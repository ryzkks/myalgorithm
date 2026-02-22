# MyAlgorithm - Product Requirements Document

## Overview
AI-powered social media growth platform for TikTok, Instagram, and YouTube creators.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI (dark theme, cyan neon accents)
- **Backend**: FastAPI + MongoDB
- **Auth**: Emergent Google OAuth + JWT email/password
- **AI**: OpenAI GPT-5.2 via Emergent Integrations
- **Payments**: Stripe via Emergent Integrations

## Plans
- **Free**: 3 analyses/day, basic insights, limited history (10), no competitors/favorites
- **Pro** ($39/mo): Unlimited analyses, advanced insights + hashtags, competitors, favorites, export, full history
- **Premium** ($79/mo): Everything in Pro + deep analysis, script suggestions, content calendar, trend alerts, profile optimization, priority processing

## What's Been Implemented

### Phase 1 (Feb 22, 2026)
- [x] Full landing page (hero, features, how it works, pricing, testimonials, FAQ, footer)
- [x] Auth system (Google OAuth + email/password)
- [x] Dashboard with sidebar navigation
- [x] AI Content Analysis (OpenAI GPT-5.2)
- [x] Growth Plan page
- [x] Competitor Intelligence
- [x] Account settings
- [x] Billing with Stripe

### Phase 2 (Feb 22, 2026)
- [x] Plan restructuring: Free / Pro ($39) / Premium ($79)
- [x] Plan-gated features (daily limits, competitor lock, favorites lock)
- [x] Gamification system: XP, 8 levels (Newcomer to Algorithm Expert), 8 achievements
- [x] Video link analysis (auto-detect TikTok/Instagram/YouTube, extract metadata via oEmbed)
- [x] Dual analysis modes (Video Link + Text/Caption toggle)
- [x] Enhanced AI prompts based on plan level (basic/advanced/deep)
- [x] Skeleton loading states
- [x] Scroll & stagger animations
- [x] Micro-interactions (hover, transitions, reveals)
- [x] Level badge in sidebar
- [x] Daily usage tracker
- [x] Achievement grid with earned/locked states
- [x] Favorites system (Pro+ only)
- [x] Plan gate UI for locked features

## Prioritized Backlog
### P1
- Email verification, real password reset
- Stripe subscription lifecycle (upgrade/downgrade/cancel)
- Streak tracking (consecutive days of analysis)
- Export reports feature

### P2
- Multi-step onboarding wizard
- Content calendar UI
- Trend alerts notification system
- Historical analytics charts (Recharts)
- Real social media API connections

### P3
- Apple social login
- Dark/light mode toggle
- Team collaboration features
- Weekly insight emails
