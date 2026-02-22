# MyAlgorithm - Product Requirements Document

## Overview
AI-powered social media growth platform that analyzes content and provides actionable insights for TikTok, Instagram, and YouTube creators.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI (dark tech aesthetic, cyan/teal neon accents)
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Auth**: Emergent Google OAuth + JWT email/password with cookie-based sessions
- **AI**: OpenAI GPT-5.2 via Emergent Integrations for content analysis
- **Payments**: Stripe via Emergent Integrations for subscription billing

## User Personas
1. **Aspiring Creator**: Beginner with <10K followers, wants to understand algorithm
2. **Growing Creator**: 10K-100K followers, wants to optimize content strategy
3. **Professional/Team**: 100K+ followers, needs full analytics and competitor intelligence

## Core Requirements
- Landing page with hero, features, how it works, pricing, testimonials, FAQ, footer
- Full authentication (email/password + Google OAuth)
- Dashboard with sidebar navigation
- AI-powered content analysis (viral score 0-100, strengths, weaknesses, suggestions)
- Personalized weekly growth plan
- Competitor intelligence analysis
- Account management (profile, password)
- Stripe billing with 3 tiers: Starter ($15), Creator ($39), Pro ($79)

## What's Been Implemented (Feb 22, 2026)
- [x] Complete landing page with all sections
- [x] Auth system (Google OAuth + email/password registration/login)
- [x] Protected dashboard with sidebar navigation
- [x] Dashboard Overview with metrics cards
- [x] AI Content Analysis using OpenAI GPT-5.2 (real AI integration)
- [x] Growth Plan page with weekly strategy
- [x] Competitor Intelligence page
- [x] Account settings (profile edit, password change)
- [x] Billing page with Stripe checkout integration
- [x] Payment history tracking
- [x] Responsive design (mobile + desktop)
- [x] Dark tech aesthetic with glassmorphism

## Simulated/Demo Data
- Dashboard metrics (reach score, growth rate, engagement)
- Growth plan weekly strategy
- Competitor analysis insights

## Prioritized Backlog
### P0 (Critical)
- None remaining

### P1 (High)
- Real social media API integrations (TikTok, Instagram, YouTube)
- Email verification on signup
- Password reset via email (currently mock)
- Stripe subscription management (upgrade/downgrade/cancel)

### P2 (Medium)
- Content upload (image/video) for analysis
- Historical analytics charts with Recharts
- Team collaboration features
- Notification system
- Content calendar integration

### P3 (Nice to Have)
- Apple social login
- Dark/light mode toggle
- Export reports as PDF
- Mobile app version
- Webhook integrations
