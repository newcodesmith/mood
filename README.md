# Mood Tracker

A mood tracking app where you log daily mood (1-10), feelings, reflections, and sleep patterns with analytics and visualizations.

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

- **Log Mood** - Rate mood (1-10), select emotions, add reflections, log sleep
- **Dashboard** - View today's entry and motivation quote
- **Mood Trends** - Interactive chart of last 11 entries
- **Weekly Insights** - Compare mood & sleep (last 5 entries vs. previous 5)
- **Settings** - Update name, avatar, theme, change password
- **Authentication** - Register/login with JWT, password reset
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

**Auth:**
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `POST /api/auth/change-password` - Change password

**User:**
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user

## Notes

- One mood entry per day
- Mobile-responsive design
- Entries are private per user
- See `claude.md` for full project specs
