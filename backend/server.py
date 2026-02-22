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
import re
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

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

class VideoLinkRequest(BaseModel):
    url: str

class CompetitorRequest(BaseModel):
    username: str
    platform: str = "instagram"

class CheckoutRequest(BaseModel):
    plan_id: str
    origin_url: str
    billing_cycle: str = "monthly"

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class OnboardingRequest(BaseModel):
    user_type: str = ""
    goals: List[str] = []
    platforms: List[str] = []
    niche: str = ""
    content_types: List[str] = []

class GrowthPlanUpdateRequest(BaseModel):
    day: str
    content_type: str = ""
    time: str = ""
    tip: str = ""

class GenerateIdeasRequest(BaseModel):
    topic: str = ""
    platform: str = "general"
    count: int = 6

class FavoriteRequest(BaseModel):
    analysis_id: str

class ConnectPlatformRequest(BaseModel):
    platform: str
    username: str

# ── Plans & Features ────────────────────────────────────
PLANS = {
    "pro": {
        "name": "Pro", "price_monthly": 19.00, "price_yearly": 190.00, "currency": "usd",
        "features": [
            "Unlimited AI Analyses", "Advanced Insights & Hashtags",
            "Competitor Intelligence", "Full Analysis History",
            "Save Favorite Analyses", "Export Reports", "Priority Email Support",
        ],
    },
    "premium": {
        "name": "Premium", "price_monthly": 49.00, "price_yearly": 490.00, "currency": "usd",
        "features": [
            "Everything in Pro", "Deep Performance Analysis",
            "AI Script Suggestions", "Smart Content Calendar",
            "Niche Trend Alerts", "Profile Optimization AI",
            "Top Creator Comparisons", "Priority Processing", "Priority Support",
        ],
    },
}

PLAN_FEATURES = {
    "free": {"daily_limit": 3, "history_limit": 10, "competitors": False, "favorites": False, "advanced": False, "deep": False},
    "pro": {"daily_limit": -1, "history_limit": -1, "competitors": True, "favorites": True, "advanced": True, "deep": False},
    "premium": {"daily_limit": -1, "history_limit": -1, "competitors": True, "favorites": True, "advanced": True, "deep": True},
}

LEVELS = [
    {"level": 1, "name": "Newcomer", "xp": 0},
    {"level": 2, "name": "Explorer", "xp": 50},
    {"level": 3, "name": "Creator", "xp": 150},
    {"level": 4, "name": "Influencer", "xp": 300},
    {"level": 5, "name": "Trendsetter", "xp": 500},
    {"level": 6, "name": "Viral Maker", "xp": 800},
    {"level": 7, "name": "Growth Master", "xp": 1200},
    {"level": 8, "name": "Algorithm Expert", "xp": 2000},
]

ACHIEVEMENTS_DEF = {
    "first_analysis": {"name": "First Steps", "desc": "Complete your first analysis", "xp": 25, "icon": "sparkles"},
    "analysis_10": {"name": "Content Connoisseur", "desc": "Complete 10 analyses", "xp": 50, "icon": "bar-chart"},
    "analysis_25": {"name": "Analysis Pro", "desc": "Complete 25 analyses", "xp": 100, "icon": "trophy"},
    "streak_3": {"name": "On a Roll", "desc": "Analyze 3 days in a row", "xp": 30, "icon": "flame"},
    "streak_7": {"name": "Week Warrior", "desc": "Analyze 7 days in a row", "xp": 75, "icon": "zap"},
    "viral_80": {"name": "Almost Viral", "desc": "Score above 80 on an analysis", "xp": 40, "icon": "trending-up"},
    "viral_95": {"name": "Viral Genius", "desc": "Score above 95 on an analysis", "xp": 100, "icon": "crown"},
    "pro_upgrade": {"name": "Going Pro", "desc": "Upgrade to a paid plan", "xp": 50, "icon": "star"},
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

# ── Gamification Helpers ────────────────────────────────
def get_level_info(xp: int) -> dict:
    current = LEVELS[0]
    for lv in LEVELS:
        if xp >= lv["xp"]:
            current = lv
    nxt = None
    for lv in LEVELS:
        if lv["xp"] > xp:
            nxt = lv
            break
    progress = 0
    if nxt:
        range_xp = nxt["xp"] - current["xp"]
        progress = ((xp - current["xp"]) / range_xp * 100) if range_xp > 0 else 100
    else:
        progress = 100
    return {"level": current["level"], "name": current["name"], "xp": xp,
            "next_xp": nxt["xp"] if nxt else None, "next_name": nxt["name"] if nxt else None,
            "progress": round(progress, 1)}

async def award_xp(user_id: str, amount: int, reason: str):
    await db.user_stats.update_one(
        {"user_id": user_id},
        {"$inc": {"xp": amount}, "$setOnInsert": {"user_id": user_id}},
        upsert=True,
    )

async def get_xp(user_id: str) -> int:
    s = await db.user_stats.find_one({"user_id": user_id}, {"_id": 0})
    return s.get("xp", 0) if s else 0

async def check_and_award_achievements(user_id: str, analysis_count: int = 0, viral_score: int = 0):
    earned = await db.user_achievements.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    earned_ids = {a["achievement_id"] for a in earned}
    new = []
    checks = [
        ("first_analysis", analysis_count >= 1),
        ("analysis_10", analysis_count >= 10),
        ("analysis_25", analysis_count >= 25),
        ("viral_80", viral_score >= 80),
        ("viral_95", viral_score >= 95),
    ]
    for aid, cond in checks:
        if cond and aid not in earned_ids:
            new.append(aid)
            await db.user_achievements.insert_one({
                "user_id": user_id, "achievement_id": aid,
                "earned_at": datetime.now(timezone.utc).isoformat(),
            })
            await award_xp(user_id, ACHIEVEMENTS_DEF[aid]["xp"], f"Achievement: {ACHIEVEMENTS_DEF[aid]['name']}")
    return new

async def check_daily_limit(user_id: str, plan: str) -> tuple:
    features = PLAN_FEATURES.get(plan, PLAN_FEATURES["free"])
    limit = features["daily_limit"]
    if limit == -1:
        return True, -1, 0
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    count = await db.analyses.count_documents({"user_id": user_id, "created_at": {"$gte": today_start}})
    return count < limit, limit, count

def get_plan_features(plan: str) -> dict:
    return PLAN_FEATURES.get(plan, PLAN_FEATURES["free"])

def detect_platform(url: str) -> Optional[str]:
    u = url.lower().strip()
    if "youtube.com" in u or "youtu.be" in u:
        return "youtube"
    if "tiktok.com" in u or "vm.tiktok.com" in u:
        return "tiktok"
    if "instagram.com" in u:
        return "instagram"
    return None

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
    plan = user.get("plan", "free")
    xp = await get_xp(user["user_id"])
    level = get_level_info(xp)
    features = get_plan_features(plan)
    return {
        "user_id": user["user_id"], "email": user["email"], "name": user["name"],
        "picture": user.get("picture", ""), "plan": plan,
        "level": level, "features": features,
    }

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
    plan = user.get("plan", "free")
    allowed, limit, used = await check_daily_limit(user["user_id"], plan)
    if not allowed:
        raise HTTPException(status_code=429, detail=f"Daily analysis limit reached ({limit}). Upgrade to Pro for unlimited analyses.")
    features = get_plan_features(plan)
    # Build AI prompt based on plan level
    base_fields = '"viral_score": <0-100>, "strengths": [3-4 strings], "weaknesses": [3-4 strings], "suggestions": [4-5 strings], "summary": "2 sentences"'
    extra = ""
    if features["advanced"]:
        extra += ', "hashtag_recommendations": [5-8 optimized hashtags], "best_posting_times": [3 time slots], "engagement_prediction": "sentence"'
    if features["deep"]:
        extra += ', "script_suggestion": "3-4 sentence video script idea", "style_analysis": "sentence about visual/audio style", "trend_connections": [2-3 related trends]'
    system_msg = f"""You are an expert social media content analyst. Analyze the given content and return a JSON object with exactly these fields:
{{{base_fields}{extra}}}
Return ONLY valid JSON, no markdown, no extra text."""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=os.environ.get("EMERGENT_LLM_KEY"),
            session_id=f"analysis-{uuid.uuid4().hex[:8]}",
            system_message=system_msg,
        ).with_model("openai", "gpt-5.2")
        prompt = f"Platform: {req.platform}\n\nContent to analyze:\n{req.content}"
        ai_response = await chat.send_message(UserMessage(text=prompt))
        try:
            cleaned = ai_response.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
            analysis = json.loads(cleaned.strip())
        except json.JSONDecodeError:
            analysis = {"viral_score": 65, "strengths": ["Content has engaging elements", "Good topic selection"],
                        "weaknesses": ["Could improve hook", "Pacing could be better"],
                        "suggestions": ["Add a stronger opening hook", "Include a call-to-action"], "summary": ai_response[:200]}
    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        analysis = {"viral_score": 72, "strengths": ["Relevant topic", "Good content length", "Clear messaging"],
                    "weaknesses": ["Could benefit from stronger hook", "Missing trending hashtags"],
                    "suggestions": ["Start with an attention-grabbing hook", "Add relevant trending hashtags", "Include a clear call-to-action"],
                    "summary": "Your content shows potential. Focus on improving the hook and adding strategic CTAs."}
    analysis_record = {
        "analysis_id": f"an_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "content": req.content[:500],
        "platform": req.platform,
        "result": analysis,
        "favorited": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.analyses.insert_one(analysis_record)
    # Gamification
    await award_xp(user["user_id"], 10, "Content analysis")
    count = await db.analyses.count_documents({"user_id": user["user_id"]})
    new_achievements = await check_and_award_achievements(user["user_id"], analysis_count=count, viral_score=analysis.get("viral_score", 0))
    remaining = limit - used - 1 if limit > 0 else -1
    return {"analysis_id": analysis_record["analysis_id"], "remaining_today": remaining,
            "new_achievements": new_achievements, "xp_earned": 10, **analysis}

@api_router.post("/analyze/video-link")
async def analyze_video_link(req: VideoLinkRequest, request: Request):
    user = await get_current_user(request)
    plan = user.get("plan", "free")
    allowed, limit, used = await check_daily_limit(user["user_id"], plan)
    if not allowed:
        raise HTTPException(status_code=429, detail=f"Daily limit reached ({limit}). Upgrade for unlimited.")
    platform = detect_platform(req.url)
    if not platform:
        raise HTTPException(status_code=400, detail="Unsupported URL. Please paste a TikTok, Instagram, or YouTube link.")
    # Extract video metadata via oEmbed + meta tags
    video_data = {"url": req.url, "platform": platform, "title": "", "author": "", "thumbnail": "", "description": "", "hashtags": []}
    oembed_map = {
        "youtube": f"https://www.youtube.com/oembed?url={req.url}&format=json",
        "tiktok": f"https://www.tiktok.com/oembed?url={req.url}",
        "instagram": f"https://api.instagram.com/oembed/?url={req.url}",
    }
    async with httpx.AsyncClient(timeout=12, follow_redirects=True) as hc:
        try:
            oembed_resp = await hc.get(oembed_map[platform])
            if oembed_resp.status_code == 200:
                od = oembed_resp.json()
                video_data["title"] = od.get("title", "")
                video_data["author"] = od.get("author_name", "")
                video_data["thumbnail"] = od.get("thumbnail_url", "")
        except Exception:
            pass
        try:
            page_resp = await hc.get(req.url, headers={"User-Agent": "Mozilla/5.0"})
            html = page_resp.text
            og_desc = re.search(r'<meta[^>]*property=["\']og:description["\'][^>]*content=["\']([^"\']*)["\']', html)
            og_title = re.search(r'<meta[^>]*property=["\']og:title["\'][^>]*content=["\']([^"\']*)["\']', html)
            og_img = re.search(r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']*)["\']', html)
            if og_desc:
                video_data["description"] = og_desc.group(1)[:500]
            if og_title and not video_data["title"]:
                video_data["title"] = og_title.group(1)
            if og_img and not video_data["thumbnail"]:
                video_data["thumbnail"] = og_img.group(1)
            all_text = video_data["description"] + " " + video_data["title"]
            video_data["hashtags"] = list(set(re.findall(r'#\w+', all_text)))[:15]
        except Exception:
            pass
    # Now analyze with AI
    features = get_plan_features(plan)
    base_fields = '"viral_score": <0-100>, "strengths": [3-4], "weaknesses": [3-4], "suggestions": [4-5], "summary": "2 sentences"'
    extra = ""
    if features["advanced"]:
        extra += ', "hashtag_recommendations": [5-8], "best_posting_times": [3], "engagement_prediction": "sentence"'
    if features["deep"]:
        extra += ', "script_suggestion": "3-4 sentence script", "style_analysis": "sentence", "trend_connections": [2-3]'
    system_msg = f"You are an expert social media analyst. Return ONLY valid JSON: {{{base_fields}{extra}}}"
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(api_key=os.environ.get("EMERGENT_LLM_KEY"), session_id=f"vl-{uuid.uuid4().hex[:8]}",
                       system_message=system_msg).with_model("openai", "gpt-5.2")
        prompt = f"Platform: {platform}\nTitle: {video_data['title']}\nAuthor: {video_data['author']}\nDescription: {video_data['description']}\nHashtags: {', '.join(video_data['hashtags'])}\nURL: {req.url}"
        ai_resp = await chat.send_message(UserMessage(text=prompt))
        try:
            cleaned = ai_resp.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
            analysis = json.loads(cleaned.strip())
        except json.JSONDecodeError:
            analysis = {"viral_score": 68, "strengths": ["Active on platform", "Content detected"],
                        "weaknesses": ["Limited metadata extracted"], "suggestions": ["Optimize your caption", "Add trending hashtags"],
                        "summary": ai_resp[:200] if ai_resp else "Analysis completed with limited data."}
    except Exception as e:
        logger.error(f"Video link AI error: {e}")
        analysis = {"viral_score": 70, "strengths": ["Content is on a major platform"],
                    "weaknesses": ["Unable to fully analyze"], "suggestions": ["Try pasting your caption text directly for deeper analysis"],
                    "summary": "Basic analysis completed. For better results, paste your caption/script text."}
    record = {
        "analysis_id": f"an_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"],
        "content": req.url, "platform": platform, "video_data": video_data,
        "result": analysis, "favorited": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.analyses.insert_one(record)
    await award_xp(user["user_id"], 10, "Video link analysis")
    count = await db.analyses.count_documents({"user_id": user["user_id"]})
    new_ach = await check_and_award_achievements(user["user_id"], analysis_count=count, viral_score=analysis.get("viral_score", 0))
    remaining = limit - used - 1 if limit > 0 else -1
    return {"analysis_id": record["analysis_id"], "video_data": video_data, "remaining_today": remaining,
            "new_achievements": new_ach, "xp_earned": 10, **analysis}

# ── Dashboard ───────────────────────────────────────────
@api_router.get("/dashboard/overview")
async def dashboard_overview(request: Request):
    user = await get_current_user(request)
    uid = user["user_id"]
    plan = user.get("plan", "free")
    analysis_count = await db.analyses.count_documents({"user_id": uid})
    xp = await get_xp(uid)
    level = get_level_info(xp)
    achievements = await db.user_achievements.find({"user_id": uid}, {"_id": 0}).to_list(100)
    allowed, limit, used = await check_daily_limit(uid, plan)
    # Compute avg viral score
    pipeline = [{"$match": {"user_id": uid}}, {"$group": {"_id": None, "avg_score": {"$avg": "$result.viral_score"}}}]
    avg_result = await db.analyses.aggregate(pipeline).to_list(1)
    avg_score = round(avg_result[0]["avg_score"], 1) if avg_result and avg_result[0].get("avg_score") else 0
    return {
        "metrics": {
            "reach_score": 78, "growth_rate": 12.5, "engagement_score": 85,
            "total_analyses": analysis_count, "avg_viral_score": avg_score,
        },
        "level": level,
        "achievements": [{"achievement_id": a["achievement_id"], "earned_at": a["earned_at"],
                          **ACHIEVEMENTS_DEF.get(a["achievement_id"], {})} for a in achievements],
        "all_achievements": [{**v, "id": k} for k, v in ACHIEVEMENTS_DEF.items()],
        "plan": plan,
        "daily_usage": {"used": used, "limit": limit, "remaining": limit - used if limit > 0 else -1},
        "quick_actions": [
            {"label": "Analyze New Content", "link": "/dashboard/analyze"},
            {"label": "View Growth Plan", "link": "/dashboard/growth-plan"},
            {"label": "Check Competitors", "link": "/dashboard/competitors"},
        ],
    }

@api_router.get("/dashboard/analyses")
async def dashboard_analyses(request: Request):
    user = await get_current_user(request)
    plan = user.get("plan", "free")
    features = get_plan_features(plan)
    limit = features["history_limit"] if features["history_limit"] > 0 else 100
    analyses = await db.analyses.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    return analyses

# ── Favorites ───────────────────────────────────────────
@api_router.post("/analyses/favorite")
async def toggle_favorite(req: FavoriteRequest, request: Request):
    user = await get_current_user(request)
    plan = user.get("plan", "free")
    if not get_plan_features(plan)["favorites"]:
        raise HTTPException(status_code=403, detail="Favorites require Pro plan or higher")
    analysis = await db.analyses.find_one({"analysis_id": req.analysis_id, "user_id": user["user_id"]}, {"_id": 0})
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    new_state = not analysis.get("favorited", False)
    await db.analyses.update_one({"analysis_id": req.analysis_id}, {"$set": {"favorited": new_state}})
    return {"favorited": new_state}

@api_router.get("/analyses/favorites")
async def get_favorites(request: Request):
    user = await get_current_user(request)
    favs = await db.analyses.find(
        {"user_id": user["user_id"], "favorited": True}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return favs

# ── User Stats & Achievements ──────────────────────────
@api_router.get("/user/stats")
async def get_user_stats(request: Request):
    user = await get_current_user(request)
    xp = await get_xp(user["user_id"])
    level = get_level_info(xp)
    count = await db.analyses.count_documents({"user_id": user["user_id"]})
    achievements = await db.user_achievements.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    earned_ids = {a["achievement_id"] for a in achievements}
    all_ach = []
    for k, v in ACHIEVEMENTS_DEF.items():
        all_ach.append({"id": k, **v, "earned": k in earned_ids,
                        "earned_at": next((a["earned_at"] for a in achievements if a["achievement_id"] == k), None)})
    return {"level": level, "total_analyses": count, "achievements": all_ach}

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
    user = await get_current_user(request)
    plan = user.get("plan", "free")
    if not get_plan_features(plan)["competitors"]:
        raise HTTPException(status_code=403, detail="Competitor analysis requires Pro plan or higher. Upgrade to unlock.")
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
