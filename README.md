# Mood Tracker

A time-series mood tracking application that allows users to log daily mood, feelings, reflections, and sleep patterns with analytics and visualizations.

## Project Structure

```
mood/
├── backend/          # Node.js + Express API
│   ├── migrations/   # Knex.js database migrations
│   ├── models/       # Database models
│   ├── routes/       # API routes
│   ├── index.js      # Express server
│   ├── knexfile.js   # Knex configuration
│   └── package.json
│
├── frontend/         # React application
│   ├── public/       # Static files
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API services
│   │   ├── styles/       # CSS files
│   │   ├── App.js        # Main app component
│   │   └── index.js      # Entry point
│   └── package.json
│
└── claude.md         # Project specifications
```

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- PostgreSQL (running locally or remotely)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your PostgreSQL credentials:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=mood_tracker
   DB_USER=postgres
   DB_PASSWORD=your_password
   NODE_ENV=development
   PORT=3001
   ```

4. **Create PostgreSQL database:**
   ```bash
   createdb mood_tracker
   ```

5. **Run migrations:**
   ```bash
   npm run migrate
   ```

6. **Start the server:**
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:3001`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```
   App will open at `http://localhost:3000`

## Quick Start Guide

**First Time Using Mood Tracker?** Here's how to get started:

1. **Log Your First Mood:** Click the "Log Mood" tab
   - Rate your mood on a scale of 1-10
   - Select one or more emotions that match how you feel
   - Optionally, add a reflection (what's on your mind)
   - Log how many hours you slept
   - Click "Save Mood Entry"

2. **View Your Dashboard:** Go back to the Dashboard tab
   - See your mood entry in the "Daily Mood" section
   - As you add more entries, you'll start to see trends
   - Click on your mood quote to get a personalized message

3. **Analyze Trends:** Look at the "Mood Trends" chart
   - Visualize your moods over the past two weeks
   - Click on any data point to see what you felt on that day
   - Identify patterns: Are you typically happier on weekends? Better after exercise?

4. **Track Progress:** Check the "Weekly Insights" section
   - Compare your mood and sleep from the last week vs. the previous week
   - See if your mood is trending upward or downward
   - Monitor if you're sleeping more or less

5. **Update Your Profile:** Go to Settings
   - Set a username
   - Add an avatar image (optional)
   - View your account creation date

## Features

### Dashboard Overview

The dashboard is organized into four key sections:

#### 1. **Daily Mood** 
Your mood entry for today. This section displays:
- Current mood score (1-10)
- Contextual quote based on your mood
- Feelings you selected today
- Optional reflection notes
- Sleep hours logged
- **Empty state:** Shows a link to log your first mood if no entry exists for today

#### 2. **Mood Trends**
A visual timeline showing your last 11 mood entries as a line chart. Features:
- X-axis: Dates of your entries
- Y-axis: Mood scores (1-10)
- **Interactive:** Click on any data point to see full details for that date
- Helps you identify patterns in your emotional state over time
- See how you felt over the past 2 weeks at a glance

#### 3. **Entry Details** (Conditional)
Appears when you click on a bar in the Mood Trends chart. Shows the complete information for the selected date:
- Date selected
- Mood score
- All feelings recorded
- Full reflection text
- Sleep hours

#### 4. **Weekly Insights**
Compares your mood and sleep patterns between two periods:
- **Last 5 check-ins:** Average mood and sleep from your most recent 5 entries
- **Previous 5:** Average mood and sleep from the 5 entries before that
- **Trends:** Shows percentage change with visual indicators (📈 improved, 📉 declined)
- Helps you understand if your mood and sleep are improving or declining

### Detailed Features

#### Daily Mood Logging
Rate your emotional state and document your feelings:
- **Mood Scale (1-10):** 1 = Poor, 5 = Neutral, 10 = Excellent
- **Feelings:** Choose from 8 predefined emotions - Happy, Sad, Anxious, Calm, Energetic, Tired, Hopeful, Stressed
- Can select multiple feelings to capture your emotional complexity
- **Reflection:** Optional space to write about your day, events, or thoughts
- **Sleep Tracking:** Log hours of sleep (0-24 hours)
- **Validation:** Form ensures you log mood and at least one feeling

#### Mood Quotes
Get personalized, encouraging quotes based on your mood:
- Low mood (1-3): Supportive and hopeful messages
- Neutral mood (4-7): Balanced, grounded messages  
- High mood (8-10): Celebratory and energizing messages
- Changes every time you log a new mood

#### Mood Trends Graph
Visual representation of your emotional journey:
- Interactive line chart showing your last 11 mood entries
- Dates on the X-axis, mood scores (1-10) on the Y-axis
- **Click to explore:** Click any point to see full details for that date
- Spot emotional patterns: weekly rhythms, seasonal changes, trigger events

#### Weekly Insights
Progress tracking with week-over-week comparison:
- Compares your average mood from the last 5 entries vs. the previous 5
- Compares your average sleep from the last 5 entries vs. the previous 5
- Shows percentage change: Is your mood improving or declining?
- Visual indicators help you quickly understand the trend
- Example: "Mood improved by 15%, sleeping more this week" 📈

#### Settings & Profile
Personalize your experience:
- **Name:** Set a display name (required)
- **Avatar:** Add a profile image for personalization
- **Account Info:** View when you created your account
- Form validation ensures data integrity

### Feelings Options
The app offers 8 core emotions to choose from:
- **Happy** - Joy, contentment, satisfaction
- **Sad** - Sadness, melancholy, down
- **Anxious** - Worry, nervousness, tension
- **Calm** - Peace, relaxation, tranquility
- **Energetic** - Vitality, motivation, enthusiasm
- **Tired** - Fatigue, exhaustion, depleted
- **Hopeful** - Optimism, positive outlook, confidence
- **Stressed** - Pressure, overwhelm, tension

You can select multiple feelings - for example, you might be both "Happy" and "Tired" at the same time!

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Mood Entries
- `GET /api/mood-entries/user/:userId` - Get all entries for user
- `GET /api/mood-entries/user/:userId/today` - Get today's entry
- `GET /api/mood-entries/user/:userId/recent` - Get last 11 entries
- `GET /api/mood-entries/user/:userId/comparison` - Get comparison data
- `POST /api/mood-entries` - Create new entry
- `PUT /api/mood-entries/:id` - Update entry
- `DELETE /api/mood-entries/:id` - Delete entry

## Database Schema

### users
- `id` - Auto-incrementing primary key
- `name` - User name (required)
- `avatar` - Avatar URL (optional)
- `created_at` - Timestamp
- `updated_at` - Timestamp

### mood_entries
- `id` - Auto-incrementing primary key
- `user_id` - Foreign key to users
- `date` - Date of entry (unique per user)
- `mood` - Mood score (1-10, required)
- `feelings` - JSON array of feeling tags
- `reflection` - Text reflection (optional)
- `sleep` - Hours of sleep (0-24, optional)
- `created_at` - Timestamp
- `updated_at` - Timestamp

## Form Validation

### Mood Entry
- Mood: Required, must be 1-10
- Feelings: Required, at least one feeling needed
- Reflection: Optional, any text length
- Sleep: Optional, must be 0-24 if provided

### User Profile
- Name: Required, 2-50 characters
- Avatar: Optional, must be valid URL

## Tech Stack
- **Frontend:** React 18, Chart.js, Axios
- **Backend:** Node.js, Express
- **Database:** PostgreSQL with Knex.js query builder
- **Styling:** CSS3 with responsive design

## Development

### Running Both Servers (Recommended)

From the root directory, run both backend and frontend with hot reload:

```bash
npm run dev
```

This will use **nodemon** for the backend and **React hot reload** for the frontend. Both servers will auto-restart/refresh on file changes.

Individual server commands:
```bash
npm run backend   # Backend only (port 3001)
npm run frontend  # Frontend only (port 3000)
```

### Available Scripts

**Root:**
```bash
npm run dev           # Run both backend and frontend with hot reload
npm run backend       # Backend server with nodemon
npm run frontend      # Frontend React dev server
npm run install-all   # Install dependencies for all packages
```

**Backend:**
```bash
npm run start    # Start production server
npm run dev      # Start dev server with nodemon (auto-reload on file changes)
npm run migrate  # Run database migrations
npm run seed     # Seed database with sample data
```

**Frontend:**
```bash
npm start        # Start dev server with hot reload
npm run build    # Build for production
npm test         # Run tests
```

### Hot Reload Details

- **Backend:** Uses **nodemon** - automatically restarts Express server when files change
- **Frontend:** Uses **React Fast Refresh** - updates components in browser without full reload

## Tips & Best Practices

### For Better Insights:
1. **Log consistently:** Try to log your mood at the same time each day for better pattern recognition
2. **Be honest:** The accuracy of your insights depends on honest entries
3. **Use reflections:** The optional reflection field is powerful - write what's happening in your life
4. **Track sleep:** Sleep is a major mood factor - log your hours to see the correlation
5. **Select multiple feelings:** Choose all emotions that apply, not just the primary one
6. **Review patterns:** Check your dashboard weekly to spot emotional trends
7. **Use the week comparison:** This is where you'll see if your wellness efforts are working

### Understanding Your Data:
- **Mood Trends:** Look for weekly patterns (are Mondays harder? Better on weekends?)
- **Sleep correlation:** Compare your sleep hours with mood - you may find sleep directly impacts mood
- **Weekly Insights:** A 5-entry window is about 5-7 days. Use this to track short-term progress
- **Feelings patterns:** Do anxiety and insomnia tend to coincide? Are you more energetic after social time?

### For Mental Health:
- This app is a **self-reflection tool**, not a replacement for professional mental health care
- If you're struggling, please reach out to a mental health professional
- Use trends to identify when you might need extra support
- Share patterns with your therapist to identify triggers

## Notes

- App uses local storage for MVP and REST API with PostgreSQL for persistence
- Mobile-responsive design with mobile-first approach
- Simple, clean UI focused on user experience
- Each user can have only one entry per day
- Mood quotes adapt to the current mood level
