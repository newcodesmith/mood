# Health Tracker

A health tracking app where you log daily mood (1-10), feelings, reflections, sleep, water intake (oz), and weight (lbs), with analytics, visualizations, and a guided breathing experience with saved routines.

## Setup

**Backend:**
```bash
cd backend
npm install
cp .env.example .env  # Update DB credentials
createdb mood_tracker
npm run migrate
npm run dev       # Port 3001
```

**Frontend:**
```bash
cd frontend
npm install
npm start         # Port 3000
```

## Production Frontend Deploy

Set a production API URL before building so auth does not point to localhost:

```bash
cd frontend
REACT_APP_API_URL="https://YOUR_BACKEND_DOMAIN/api" npm run build
firebase deploy
```

If `REACT_APP_API_URL` is missing, the app now falls back to `/api` in production (instead of `localhost`).

**Both (from root):**
```bash
npm run dev
```

## Features

- **Log Health Check-In** - Rate mood, select emotions, add reflections, and track sleep/water/weight
- **Spinner Controls** - Increment/decrement pickers for sleep, water intake, and weight fields; buttons match input height across the site
- **Dashboard Health Pillars** - Dedicated cards for Mood, Sleep, Hydration, and Weight with mini insights and per-pillar color accents
- **Health Trends** - Interactive chart tabs for Mood, Sleep, Water, and Weight over the last 11 entries
- **Weekly Insights** - Compare mood, sleep, hydration, and weight (last 5 check-ins vs. previous 5); cards have per-pillar colored left borders
- **Today's Check-In** - View full current-day details including all tracked metrics
- **Guided Breathing Exercise** - Run inhale/hold/exhale cycles with animated visuals, countdown, start/pause/reset controls, and per-phase tones that fade to silence before the next phase
- **Breathing Profiles** - Save named breathing routines, edit them later, and load built-in presets for focus, calm, or sleep
- **Breathing Theme Palettes** - Choose a breathing color palette that updates the shapes and related exercise UI; palette swatches shown as circles
- **Breathing Audio Controls** - Toggle with live On/Off status badge; volume slider styled with earthy gradient; maximum volume capped at 0.30
- **Cross-Device Breathing Preferences** - Breathing audio settings and color palette persist to the user account
- **Settings** - Update name, avatar, theme, change password
- **Authentication** - Register/login with JWT, password reset
- **Light & Dark Mode** - Earthy wellness palette with neutral charcoal dark mode surfaces; consistent input, card, and border styling across both themes
- **Responsive** - Mobile-first design

## Tech Stack

- **Frontend:** React, Chart.js, Axios, SCSS
- **Backend:** Node.js, Express, PostgreSQL, Knex.js
- **Auth:** JWT + bcryptjs

## API

**Mood Entries:**
- `GET /api/mood-entries/user/:userId/recent` - Last 11 entries
- `GET /api/mood-entries/user/:userId/today` - Today's entry
- `POST /api/mood-entries` - Create entry
- `PUT /api/mood-entries/:id` - Update entry

Payload supports:
- `mood` (1-10, required)
- `feelings` (array, required)
- `reflection` (optional)
- `sleep` (0-24, optional)
- `water_oz` (0-1000, optional)
- `weight_lbs` (0-1400, optional)

**Auth:**
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/change-password` - Change password

**User:**
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/preferences` - Update persisted user preferences including breathing audio and color palette
- `GET /api/users/:id/breathing-profiles` - List saved breathing profiles
- `POST /api/users/:id/breathing-profiles` - Create a breathing profile
- `PATCH /api/users/:id/breathing-profiles/:profileId` - Update a saved breathing profile

Breathing preference payload supports:
- `breathing_audio_enabled` or `breathingAudioEnabled` (boolean)
- `breathing_audio_level` or `breathingAudioLevel` (0.00-0.30)
- `breathing_color_palette` or `breathingColorPalette` (`ocean`, `sunrise`, `forest`, `lavender`, `ember`)

Breathing profile payload supports:
- `name` (required)
- `inhale_seconds` or `inhaleSeconds` (required)
- `hold_seconds` or `holdSeconds` (required)
- `exhale_seconds` or `exhaleSeconds` (required)
- `audio_enabled` or `audioEnabled` (optional)
- `audio_level` or `audioLevel` (0.00-0.30, optional)

## Notes

- One health check-in entry per day
- Mobile-responsive design
- Entries are private per user
- Breathing preferences and saved breathing profiles are private per user
- See CLAUDE.md for full project specs
