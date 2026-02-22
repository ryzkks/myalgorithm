import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sparkles, TrendingUp, Target, Users, ArrowRight, Check, ChevronRight,
  Play, Zap, BarChart3, Shield, Star, Crown, Menu, X,
} from "lucide-react";

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);

  const handleCTA = () => navigate(user ? "/dashboard" : "/signup");

  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-x-hidden">
      {/* ── Navbar ────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-white/[0.04]" data-testid="landing-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group" data-testid="logo-link">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
              <div className="w-3 h-3 rounded-sm bg-cyan-400" />
            </div>
            <span className="font-['Outfit'] text-xl font-bold">MyAlgorithm</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors" data-testid="nav-features">Features</a>
            <a href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors" data-testid="nav-pricing">Pricing</a>
            <a href="#faq" className="text-sm text-slate-400 hover:text-white transition-colors" data-testid="nav-faq">FAQ</a>
            {user ? (
              <Link to="/dashboard" data-testid="nav-dashboard">
                <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl h-9 px-5 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm text-slate-300 hover:text-white transition-colors" data-testid="nav-login">Login</Link>
                <Link to="/signup" data-testid="nav-get-started">
                  <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl h-9 px-5 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden text-slate-400" onClick={() => setMobileMenu(!mobileMenu)} data-testid="mobile-nav-toggle">
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenu && (
          <div className="md:hidden glass border-t border-white/[0.04] p-4 space-y-3">
            <a href="#features" className="block text-sm text-slate-300 py-2" onClick={() => setMobileMenu(false)}>Features</a>
            <a href="#pricing" className="block text-sm text-slate-300 py-2" onClick={() => setMobileMenu(false)}>Pricing</a>
            <a href="#faq" className="block text-sm text-slate-300 py-2" onClick={() => setMobileMenu(false)}>FAQ</a>
            <div className="flex gap-3 pt-2">
              <Link to="/login" className="flex-1"><Button variant="outline" className="w-full rounded-xl border-slate-700 text-white">Login</Button></Link>
              <Link to="/signup" className="flex-1"><Button className="w-full rounded-xl bg-cyan-500 text-black font-semibold">Get Started</Button></Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 hero-gradient grid-bg" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-6 animate-fade-up">
              <Sparkles className="w-3.5 h-3.5" /> AI-Powered Growth Platform
            </div>
            <h1 className="font-['Outfit'] text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6 animate-fade-up" style={{ animationDelay: "100ms" }}>
              Make the algorithm{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400 neon-text">
                work for you.
              </span>
            </h1>
            <p className="text-base md:text-lg text-slate-400 leading-relaxed mb-8 max-w-xl animate-fade-up" style={{ animationDelay: "200ms" }}>
              AI analyzes your content and tells you exactly how to get more views, followers, and sales.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 animate-fade-up" style={{ animationDelay: "300ms" }}>
              <Button onClick={handleCTA} data-testid="hero-cta"
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold h-12 px-8 rounded-xl text-base shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                Start for free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <a href="#how-it-works">
                <Button variant="outline" data-testid="hero-secondary-cta"
                  className="border-slate-700 text-white hover:bg-white/5 h-12 px-8 rounded-xl text-base">
                  <Play className="w-4 h-4 mr-2" /> See how it works
                </Button>
              </a>
            </div>
            <p className="text-sm text-slate-500 mt-6 animate-fade-up" style={{ animationDelay: "400ms" }}>
              Trusted by <span className="text-slate-300 font-medium">10,000+</span> creators worldwide
            </p>
          </div>

          {/* Mock Dashboard Preview */}
          <div className="mt-16 lg:mt-20 animate-fade-up" style={{ animationDelay: "500ms" }} data-testid="dashboard-preview">
            <div className="glass-card rounded-2xl p-1 neon-border max-w-4xl">
              <div className="bg-[#0b1121] rounded-xl p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                  <span className="ml-3 text-xs text-slate-500">MyAlgorithm Dashboard</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Viral Score", val: "92", c: "cyan" },
                    { label: "Growth Rate", val: "+24%", c: "emerald" },
                    { label: "Engagement", val: "8.5K", c: "violet" },
                  ].map((m) => (
                    <div key={m.label} className="bg-white/[0.03] rounded-xl p-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{m.label}</p>
                      <p className={`text-xl font-bold font-['Outfit'] text-${m.c}-400 mt-1`}>{m.val}</p>
                    </div>
                  ))}
                </div>
                <div className="h-24 bg-white/[0.02] rounded-xl flex items-end px-3 pb-3 gap-1">
                  {[40, 55, 45, 70, 65, 80, 75, 90, 85, 95, 88, 78].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-cyan-500/20 to-cyan-500/60" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────── */}
      <section id="features" className="py-20 md:py-32" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <p className="text-xs font-medium uppercase tracking-wider text-cyan-400 mb-3">Features</p>
            <h2 className="font-['Outfit'] text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Why creators choose MyAlgorithm
            </h2>
            <p className="text-slate-400">Everything you need to understand, optimize, and grow your social media presence.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Sparkles, title: "AI Content Analysis", desc: "Get instant feedback on what's holding your content back. Our AI breaks down every element of your posts.", color: "cyan" },
              { icon: TrendingUp, title: "Viral Potential Score", desc: "Know your chances of going viral before you post. Our predictive model scores content from 0 to 100.", color: "emerald" },
              { icon: Target, title: "Personalized Growth Plan", desc: "Exactly what to post to grow faster in your niche. Weekly strategies tailored to your audience.", color: "violet" },
              { icon: Users, title: "Competitor Intelligence", desc: "Discover what top creators are doing differently. Analyze their strategies and find opportunities.", color: "amber" },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title}
                className="glass-card rounded-2xl p-7 group transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/20"
                data-testid={`feature-${title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <div className={`w-11 h-11 rounded-xl bg-${color}-500/10 flex items-center justify-center mb-4 group-hover:bg-${color}-500/20 transition-colors`}>
                  <Icon className={`w-5 h-5 text-${color}-400`} strokeWidth={1.5} />
                </div>
                <h3 className="font-['Outfit'] text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────── */}
      <section id="how-it-works" className="py-20 md:py-32 border-t border-slate-800/50" data-testid="how-it-works-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <p className="text-xs font-medium uppercase tracking-wider text-cyan-400 mb-3">How It Works</p>
            <h2 className="font-['Outfit'] text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Three steps to growth
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Connect your account", desc: "Link your TikTok, Instagram, or YouTube account in seconds." },
              { step: "02", title: "Get AI-powered insights", desc: "Our AI analyzes your content, audience, and competitors." },
              { step: "03", title: "Grow with data", desc: "Follow personalized strategies and watch your metrics climb." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative text-center group" data-testid={`step-${step}`}>
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-5 group-hover:bg-cyan-500/20 transition-all">
                  <span className="font-['Outfit'] text-lg font-bold text-cyan-400">{step}</span>
                </div>
                <h3 className="font-['Outfit'] text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────── */}
      <section id="pricing" className="py-20 md:py-32 border-t border-slate-800/50" data-testid="pricing-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <p className="text-xs font-medium uppercase tracking-wider text-cyan-400 mb-3">Pricing</p>
            <h2 className="font-['Outfit'] text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-slate-400">Start free. Upgrade when you're ready.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { name: "Starter", price: 15, desc: "For beginners starting their growth journey", icon: Zap, features: ["AI Analysis (10/mo)", "Basic Growth Recommendations", "Dashboard Access", "Email Support"], popular: false },
              { name: "Creator", price: 39, desc: "Advanced insights and growth tools", icon: Crown, features: ["AI Analysis (50/mo)", "Advanced Growth Recommendations", "Full Dashboard Access", "Priority Email Support", "Competitor Intelligence"], popular: true },
              { name: "Pro", price: 79, desc: "Full analytics suite for professionals and teams", icon: Star, features: ["Unlimited AI Analysis", "Full Growth Suite", "Complete Dashboard", "Priority Support", "Competitor Intelligence", "Team Features"], popular: false },
            ].map(({ name, price, desc, icon: Icon, features, popular }) => (
              <div key={name}
                className={`glass-card rounded-2xl p-7 relative transition-all duration-300 hover:-translate-y-1 ${popular ? "neon-border" : ""}`}
                data-testid={`pricing-${name.toLowerCase()}`}
              >
                {popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyan-500 text-black text-xs font-bold">
                    Most Popular
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-5 h-5 text-cyan-400" strokeWidth={1.5} />
                  <h3 className="font-['Outfit'] text-lg font-bold text-white">{name}</h3>
                </div>
                <p className="text-sm text-slate-400 mb-4">{desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold font-['Outfit'] text-white">${price}</span>
                  <span className="text-slate-500">/month</span>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button onClick={handleCTA} data-testid={`pricing-cta-${name.toLowerCase()}`}
                  className={`w-full rounded-xl font-semibold h-11 ${
                    popular
                      ? "bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                      : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                  }`}>
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────── */}
      <section className="py-20 md:py-32 border-t border-slate-800/50" data-testid="testimonials-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-medium uppercase tracking-wider text-cyan-400 mb-3">Testimonials</p>
            <h2 className="font-['Outfit'] text-4xl md:text-5xl font-bold tracking-tight">
              Creators love MyAlgorithm
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              { name: "Sarah Chen", handle: "@sarahcreates", followers: "245K followers", quote: "MyAlgorithm completely changed my content strategy. My engagement rate went from 2% to 8% in just two months.", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" },
              { name: "Marcus Johnson", handle: "@marcusj", followers: "180K followers", quote: "The viral score feature is incredibly accurate. I've had 3 videos go viral since I started using the insights.", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" },
              { name: "Priya Sharma", handle: "@priyatalks", followers: "520K followers", quote: "The competitor analysis alone is worth the subscription. I can see exactly what's working in my niche.", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face" },
            ].map(({ name, handle, followers, quote, img }) => (
              <div key={name} className="glass-card rounded-2xl p-6" data-testid={`testimonial-${name.split(" ")[0].toLowerCase()}`}>
                <div className="flex mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-5">"{quote}"</p>
                <div className="flex items-center gap-3">
                  <img src={img} alt={name} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-white">{name}</p>
                    <p className="text-xs text-slate-500">{handle} &middot; {followers}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────── */}
      <section id="faq" className="py-20 md:py-32 border-t border-slate-800/50" data-testid="faq-section">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-medium uppercase tracking-wider text-cyan-400 mb-3">FAQ</p>
            <h2 className="font-['Outfit'] text-4xl md:text-5xl font-bold tracking-tight">
              Frequently asked questions
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-2">
            {[
              { q: "How does the AI analyze my content?", a: "Our AI uses advanced natural language processing and computer vision to analyze your content across multiple dimensions including hook quality, pacing, hashtag strategy, caption effectiveness, and more. It compares your content against millions of high-performing posts to provide actionable insights." },
              { q: "Which platforms are supported?", a: "MyAlgorithm currently supports TikTok, Instagram, and YouTube. We analyze content specific to each platform's algorithm and best practices." },
              { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees. Your account will remain active until the end of your billing period." },
              { q: "Is my data secure?", a: "Absolutely. We use enterprise-grade encryption and never store your social media passwords. Your data is processed securely and never shared with third parties." },
              { q: "Do I need a large following to benefit?", a: "Not at all! MyAlgorithm is designed for creators at every stage. Whether you have 100 or 100,000 followers, our AI provides personalized insights to help you grow." },
            ].map(({ q, a }, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="glass-card rounded-xl border-0 px-6" data-testid={`faq-item-${i}`}>
                <AccordionTrigger className="text-sm font-medium text-white hover:text-cyan-400 hover:no-underline py-4">{q}</AccordionTrigger>
                <AccordionContent className="text-sm text-slate-400 pb-4">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="py-20 md:py-32 border-t border-slate-800/50" data-testid="cta-section">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-['Outfit'] text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Ready to grow faster?
          </h2>
          <p className="text-slate-400 mb-8 text-lg">Join 10,000+ creators already using MyAlgorithm to grow their audience.</p>
          <Button onClick={handleCTA} data-testid="cta-bottom"
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold h-12 px-8 rounded-xl text-base shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            Start for free <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="border-t border-slate-800/50 py-12" data-testid="landing-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
              </div>
              <span className="font-['Outfit'] text-lg font-bold">MyAlgorithm</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
              <a href="#features" className="hover:text-white transition-colors">Product</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <span className="cursor-default hover:text-white transition-colors">Privacy Policy</span>
              <span className="cursor-default hover:text-white transition-colors">Terms</span>
              <span className="cursor-default hover:text-white transition-colors">Contact</span>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
            <p className="text-xs text-slate-600">&copy; {new Date().getFullYear()} MyAlgorithm. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
