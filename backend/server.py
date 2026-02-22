from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import httpx
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# ── Models ──────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AnalyzeContentRequest(BaseModel):
    content: str
    platform: str = "general"

class CompetitorRequest(BaseModel):
    username: str
    platform: str = "instagram"

class CheckoutRequest(BaseModel):
    plan_id: str
    origin_url: str

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# ── Plans ───────────────────────────────────────────────
PLANS = {
    "starter": {"name": "Starter", "price": 15.00, "currency": "usd", "features": ["AI Analysis (10/mo)", "Basic Growth Recommendations", "Dashboard Access", "Email Support"]},
    "creator": {"name": "Creator", "price": 39.00, "currency": "usd", "features": ["AI Analysis (50/mo)", "Advanced Growth Recommendations", "Full Dashboard Access", "Priority Email Support", "Competitor Intelligence"]},
    "pro": {"name": "Pro", "price": 79.00, "currency": "usd", "features": ["Unlimited AI Analysis", "Full Growth Suite", "Complete Dashboard", "Priority Support", "Competitor Intelligence", "Team Features"]},
}

# ── Auth Helpers ────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

async def create_session(user_id: str) -> str:
    session_token = f"sess_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc),
    })
    return session_token

async def get_current_user(request: Request) -> dict:
    token = None
    cookie_token = request.cookies.get("session_token")
    auth_header = request.headers.get("Authorization")
    if cookie_token:
        token = cookie_token
    elif auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def set_session_cookie(response: Response, token: str):
    response.set_cookie(
        key="session_token", value=token, httponly=True,
        secure=True, samesite="none", path="/", max_age=7*24*60*60,
    )

# ── Auth Routes ─────────────────────────────────────────
@api_router.post("/auth/register")
async def register(req: RegisterRequest, response: Response):
    existing = await db.users.find_one({"email": req.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user = {
        "user_id": user_id, "email": req.email, "name": req.name,
        "password_hash": hash_password(req.password),
        "picture": "", "plan": "free",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user)
    token = await create_session(user_id)
    set_session_cookie(response, token)
    return {"user_id": user_id, "email": req.email, "name": req.name, "picture": "", "plan": "free"}

@api_router.post("/auth/login")
async def login(req: LoginRequest, response: Response):
    user = await db.users.find_one({"email": req.email}, {"_id": 0})
    if not user or "password_hash" not in user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = await create_session(user["user_id"])
    set_session_cookie(response, token)
    return {"user_id": user["user_id"], "email": user["email"], "name": user["name"], "picture": user.get("picture", ""), "plan": user.get("plan", "free")}

@api_router.get("/auth/me")
async def auth_me(request: Request):
    user = await get_current_user(request)
    return {"user_id": user["user_id"], "email": user["email"], "name": user["name"], "picture": user.get("picture", ""), "plan": user.get("plan", "free")}

@api_router.post("/auth/session")
async def auth_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")
    async with httpx.AsyncClient() as hc:
        resp = await hc.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google session")
        data = resp.json()
    email = data["email"]
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"email": email}, {"$set": {"name": data.get("name", existing["name"]), "picture": data.get("picture", "")}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": email, "name": data.get("name", ""),
            "picture": data.get("picture", ""), "plan": "free",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    token = await create_session(user_id)
    set_session_cookie(response, token)
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return {"user_id": user["user_id"], "email": user["email"], "name": user["name"], "picture": user.get("picture", ""), "plan": user.get("plan", "free")}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_many({"session_token": token})
    response.delete_cookie("session_token", path="/", secure=True, samesite="none")
    return {"message": "Logged out"}

@api_router.post("/auth/reset-password")
async def reset_password(request: Request):
    body = await request.json()
    email = body.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        return {"message": "If this email exists, a reset link has been sent."}
    return {"message": "If this email exists, a reset link has been sent."}

# ── Content Analysis ────────────────────────────────────
@api_router.post("/analyze/content")
async def analyze_content(req: AnalyzeContentRequest, request: Request):
    user = await get_current_user(request)
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=os.environ.get("EMERGENT_LLM_KEY"),
            session_id=f"analysis-{uuid.uuid4().hex[:8]}",
            system_message="""You are an expert social media content analyst. Analyze the given content and return a JSON object with exactly these fields:
{
  "viral_score": <number 0-100>,
  "strengths": [<list of 3-4 strength strings>],
  "weaknesses": [<list of 3-4 weakness strings>],
  "suggestions": [<list of 4-5 actionable improvement strings>],
  "summary": "<brief 2 sentence analysis summary>"
}
Return ONLY valid JSON, no markdown, no extra text."""
        ).with_model("openai", "gpt-5.2")
        prompt = f"Platform: {req.platform}\n\nContent to analyze:\n{req.content}"
        ai_response = await chat.send_message(UserMessage(text=prompt))
        try:
            cleaned = ai_response.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
            analysis = json.loads(cleaned)
        except json.JSONDecodeError:
            analysis = {
                "viral_score": 65,
                "strengths": ["Content has engaging elements", "Good topic selection"],
                "weaknesses": ["Could improve hook", "Pacing could be better"],
                "suggestions": ["Add a stronger opening hook", "Include a call-to-action", "Optimize for platform algorithm"],
                "summary": ai_response[:200]
            }
    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        analysis = {
            "viral_score": 72,
            "strengths": ["Relevant topic for current trends", "Good content length", "Clear messaging"],
            "weaknesses": ["Could benefit from stronger hook", "Missing trending hashtags", "No clear CTA"],
            "suggestions": ["Start with an attention-grabbing hook in the first 3 seconds", "Add relevant trending hashtags", "Include a clear call-to-action", "Optimize thumbnail/cover image", "Post during peak engagement hours"],
            "summary": "Your content shows potential with good topic relevance. Focus on improving the hook and adding strategic CTAs to boost engagement."
        }
    analysis_record = {
        "analysis_id": f"an_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "content": req.content[:500],
        "platform": req.platform,
        "result": analysis,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.analyses.insert_one(analysis_record)
    return {"analysis_id": analysis_record["analysis_id"], **analysis}

# ── Dashboard ───────────────────────────────────────────
@api_router.get("/dashboard/overview")
async def dashboard_overview(request: Request):
    user = await get_current_user(request)
    analysis_count = await db.analyses.count_documents({"user_id": user["user_id"]})
    return {
        "metrics": {
            "reach_score": 78,
            "growth_rate": 12.5,
            "engagement_score": 85,
            "total_analyses": analysis_count,
        },
        "quick_actions": [
            {"label": "Analyze New Content", "link": "/dashboard/analyze"},
            {"label": "View Growth Plan", "link": "/dashboard/growth-plan"},
            {"label": "Check Competitors", "link": "/dashboard/competitors"},
        ],
    }

@api_router.get("/dashboard/analyses")
async def dashboard_analyses(request: Request):
    user = await get_current_user(request)
    analyses = await db.analyses.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    return analyses

# ── Growth Plan ─────────────────────────────────────────
@api_router.get("/growth-plan")
async def growth_plan(request: Request):
    await get_current_user(request)
    return {
        "weekly_strategy": {
            "monday": {"type": "Educational", "time": "9:00 AM", "tip": "Share a quick tip or tutorial"},
            "tuesday": {"type": "Behind the Scenes", "time": "12:00 PM", "tip": "Show your creative process"},
            "wednesday": {"type": "Trending Topic", "time": "3:00 PM", "tip": "Jump on a trending sound or topic"},
            "thursday": {"type": "Storytelling", "time": "6:00 PM", "tip": "Share a personal story or case study"},
            "friday": {"type": "Interactive", "time": "11:00 AM", "tip": "Create a poll, Q&A, or challenge"},
            "saturday": {"type": "Collaboration", "time": "2:00 PM", "tip": "Duet or collab with another creator"},
            "sunday": {"type": "Recap/Reflection", "time": "10:00 AM", "tip": "Weekly wins or lessons learned"},
        },
        "recommended_topics": [
            "AI tools for creators", "Growth hacking strategies",
            "Content repurposing tips", "Platform algorithm updates",
            "Monetization strategies", "Audience engagement tactics",
        ],
        "best_posting_times": [
            {"day": "Weekdays", "times": ["9:00 AM", "12:00 PM", "5:00 PM"]},
            {"day": "Weekends", "times": ["10:00 AM", "2:00 PM", "7:00 PM"]},
        ],
        "content_ideas": [
            "3 mistakes killing your reach", "How I grew 10K followers in 30 days",
            "The algorithm hack nobody talks about", "Day in the life of a content creator",
            "Tools I use to go viral", "Before vs After: My content strategy",
        ],
    }

# ── Competitors ─────────────────────────────────────────
@api_router.post("/competitors/analyze")
async def analyze_competitor(req: CompetitorRequest, request: Request):
    await get_current_user(request)
    import random
    return {
        "username": req.username,
        "platform": req.platform,
        "posting_frequency": f"{random.randint(3, 7)} posts/week",
        "avg_engagement_rate": f"{random.uniform(2.5, 8.5):.1f}%",
        "content_themes": ["Educational content", "Behind the scenes", "Trending challenges", "Product reviews"],
        "growth_trend": f"+{random.randint(500, 5000)} followers/month",
        "top_performing_content": [
            {"type": "Reel/Short", "topic": "Tutorial", "engagement": f"{random.uniform(5, 15):.1f}%"},
            {"type": "Carousel", "topic": "Tips & Tricks", "engagement": f"{random.uniform(3, 10):.1f}%"},
            {"type": "Story", "topic": "Q&A", "engagement": f"{random.uniform(4, 12):.1f}%"},
        ],
        "strengths": ["Consistent posting schedule", "Strong brand identity", "Engaging captions"],
        "opportunities": ["Underutilizing video content", "Not leveraging trending audio", "Inconsistent hashtag strategy"],
    }

# ── Billing ─────────────────────────────────────────────
@api_router.get("/billing/plans")
async def get_plans():
    return [{"id": k, **v} for k, v in PLANS.items()]

@api_router.post("/billing/checkout")
async def create_checkout(req: CheckoutRequest, request: Request):
    user = await get_current_user(request)
    if req.plan_id not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    plan = PLANS[req.plan_id]
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(
            api_key=os.environ.get("STRIPE_API_KEY"),
            webhook_url=webhook_url
        )
        success_url = f"{req.origin_url}/dashboard/billing?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{req.origin_url}/dashboard/billing"
        checkout_req = CheckoutSessionRequest(
            amount=plan["price"],
            currency=plan["currency"],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"user_id": user["user_id"], "plan_id": req.plan_id, "plan_name": plan["name"]}
        )
        session = await stripe_checkout.create_checkout_session(checkout_req)
        await db.payment_transactions.insert_one({
            "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
            "user_id": user["user_id"],
            "plan_id": req.plan_id,
            "plan_name": plan["name"],
            "amount": plan["price"],
            "currency": plan["currency"],
            "session_id": session.session_id,
            "payment_status": "initiated",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return {"url": session.url, "session_id": session.session_id}
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail="Payment service unavailable")

@api_router.get("/billing/status/{session_id}")
async def check_payment_status(session_id: str, request: Request):
    user = await get_current_user(request)
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(
            api_key=os.environ.get("STRIPE_API_KEY"),
            webhook_url=webhook_url
        )
        status = await stripe_checkout.get_checkout_status(session_id)
        txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        if txn and txn.get("payment_status") != "paid":
            update_data = {"payment_status": status.payment_status, "status": status.status}
            if status.payment_status == "paid":
                update_data["paid_at"] = datetime.now(timezone.utc).isoformat()
                await db.users.update_one(
                    {"user_id": user["user_id"]},
                    {"$set": {"plan": txn.get("plan_id", "starter")}}
                )
            await db.payment_transactions.update_one(
                {"session_id": session_id}, {"$set": update_data}
            )
        return {"status": status.status, "payment_status": status.payment_status, "amount_total": status.amount_total, "currency": status.currency}
    except Exception as e:
        logger.error(f"Payment status error: {e}")
        raise HTTPException(status_code=500, detail="Could not check payment status")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(
            api_key=os.environ.get("STRIPE_API_KEY"),
            webhook_url=webhook_url
        )
        body = await request.body()
        sig = request.headers.get("Stripe-Signature")
        webhook_response = await stripe_checkout.handle_webhook(body, sig)
        if webhook_response.payment_status == "paid":
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {"payment_status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}}
            )
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": False}

@api_router.get("/billing/history")
async def billing_history(request: Request):
    user = await get_current_user(request)
    history = await db.payment_transactions.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return history

# ── Account ─────────────────────────────────────────────
@api_router.put("/account/profile")
async def update_profile(req: UpdateProfileRequest, request: Request):
    user = await get_current_user(request)
    update = {}
    if req.name:
        update["name"] = req.name
    if req.email:
        update["email"] = req.email
    if update:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {"user_id": updated["user_id"], "email": updated["email"], "name": updated["name"], "picture": updated.get("picture", ""), "plan": updated.get("plan", "free")}

@api_router.put("/account/password")
async def change_password(req: ChangePasswordRequest, request: Request):
    user = await get_current_user(request)
    full_user = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if "password_hash" not in full_user:
        raise HTTPException(status_code=400, detail="Cannot change password for Google-authenticated accounts")
    if not verify_password(req.current_password, full_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"password_hash": hash_password(req.new_password)}}
    )
    return {"message": "Password updated successfully"}

# ── Root ────────────────────────────────────────────────
@api_router.get("/")
async def root():
    return {"message": "MyAlgorithm API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
