# Mood Tracker

## Project Overview
A time-series mood tracking application that allows users to log daily mood, feelings, reflections, and sleep patterns. The app provides analytics, visualizations, and insights based on collected data.

## Tech Stack
- **Frontend:** React 18.2.0, Axios, Chart.js 4.2.1, Sass 1.69.0
- **Backend:** Node.js, Express.js, Knex.js 2.5.1
- **Authentication:** JWT (`jsonwebtoken`) + `bcryptjs`
- **Database:** PostgreSQL
- **Development:** Nodemon for backend hot-reload, React Fast Refresh for frontend
- **Styling:** SCSS with centralized design variables and reusable mixins
- **Testing:** Cypress 14.5.4 (end-to-end)

## Core Features

### 1. Daily Mood Logging
- Users can log mood, feelings, reflections, and sleep data
- Simple form with input validation
- Single entry per day
- If an entry already exists for today, the Log Mood screen shows a notice and routes users to edit today's entry
- Store: mood score (1-10), feelings (array/string), reflection (text), sleep hours (number)

### 2. Today's Entry View
- Display current day's complete mood entry
- Show all fields: mood, feelings, reflections, sleep
- Option to edit/update today's entry
- Quick access from dashboard

### 3. Mood Quotes
- Display contextual quotes based on current mood level
- Different quotes for different mood ranges (low, neutral, high)

### 4. Mood Graph
- Line or bar chart showing last 11 mood records
- X-axis: dates
- Y-axis: mood score (1-10)

### 5. Interactive Chart
- Click/tap on chart points to view details
- Show full data for selected day: mood, feelings, reflections, sleep
- Allow editing a selected mood entry from its detail view

### 6. Mood & Sleep Comparisons
- Compare average mood from last 5 check-ins vs. previous 5 check-ins
- Compare average sleep from last 5 check-ins vs. previous 5 check-ins
- Display percentage change and insight narrative

### 7. Settings & Profile
- Update user name
- Upload/change avatar from local files or image URL
- Preview and remove avatar before saving
- Store theme preference and profile preferences

### 8. Form Validation
- Required fields: mood score, at least one feeling
- Reflection: optional
- Sleep: optional, must be valid number (0-24)
- User name: required, min/max length
- Avatar: optional, image file or URL with file size/format validation

### 9. User Login & Registration
- Users can register with name, email, and password
- Users can log in with email and password
- Users can toggle password visibility (show/hide) on login and registration forms
- Frontend stores auth token and restores session on refresh
- Users can sign out from desktop header controls or the mobile slide-out menu
- Protected routes require a valid JWT

### 10. Password Security Best Practices
- Passwords are never stored in plain text
- Passwords are hashed with bcrypt and strong cost factor
- Password policy is enforced at registration:
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character
  - No spaces
- Login failures return generic messages (no account-enumeration leaks)
- Password hashes are never returned in API responses

### 11. Mobile-Friendly Design
- Responsive layout that works seamlessly on mobile, tablet, and desktop
- Navigation buttons remain visible and accessible on mobile screens
- Primary navigation is displayed below the header on larger screens
- Settings and sign-out actions move into a slide-out mobile menu on small screens
- Header layout adapts with flexbox wrapping on smaller screens
- All interactive elements (buttons, inputs) have proper touch targets
- Font sizes scale appropriately for mobile viewing (smaller fonts on mobile)
- Padding and spacing adjusted for mobile to reduce scrolling
- Images and avatars sized appropriately for small screens
- Forms and input fields optimized for mobile interaction
- No content is hidden or inaccessible on mobile views

### 12. Appearance Preferences
- Users can switch between light and dark mode in Settings
- Theme changes preview immediately in Settings
- Theme choice only persists after user saves Settings
- Unsaved theme changes revert when leaving the Settings page
- Theme tokens are shared through SCSS variables and CSS custom properties

### 13. Password Reset
- Users can request password reset via email entry form (forgot password)
- Reset flow uses secure random token with expiration window
- Reset tokens are stored as hashes, not plain values
- Reset token is single-use and cleared after successful password update
- Forgot password responses avoid account enumeration leaks

## Data Model

### User
```json
{
  "id": "number",
  "name": "string",
  "email": "string (unique)",
  "avatar": "string (url/path)",
  "password_hash": "string (DB only)",
  "reset_token_hash": "string (DB only, nullable)",
  "reset_token_expires_at": "timestamp (DB only, nullable)",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Mood Entry
```json
{
  "id": "number",
  "user_id": "number",
  "date": "date",
  "mood": "number (1-10)",
  "feelings": "array<string>",
  "reflection": "string",
  "sleep": "number (hours)",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## Styling Architecture
- `/frontend/src/styles/_variables.scss`: design tokens (colors, spacing, typography)
- `/frontend/src/styles/_mixins.scss`: reusable mixins (flexbox, grid, responsive breakpoints)
- `/frontend/src/styles/index.scss`: global base styles and theme system
- `/frontend/src/styles/App.scss`: app shell, header/nav, responsive layouts
- Component style files: MoodForm, TodaysEntry, MoodChart, MoodComparison, Settings, EntryDetails, AuthForm

### Mobile Responsive Design
- Breakpoints: Mobile (< 768px), Tablet (768px - 1024px), Desktop (> 1024px)
- Mobile-first approach with `@include mobile`, `@include tablet`, `@include desktop` mixins
- Desktop/tablet navigation sits below the header rather than stretching across it
- Mobile account actions use a slide-out panel with backdrop and close control
- Font sizes, padding, and gaps scale down on mobile for optimal viewing
- Touch targets maintained at 40px+ for buttons on mobile
- Images and avatars scale appropriately for mobile screens

## Testing (Cypress)
- Config: `/frontend/cypress.config.js`
- Specs: `/frontend/cypress/e2e/`
- Run headless: `cd frontend && npm run cy:run`
- Open UI: `cd frontend && npm run cy:open`

## Implementation Notes
- Mobile-first responsive design with proper breakpoints
- Validate on both frontend and backend
- Use secure auth defaults and least-privilege data access
- Keep error responses useful but non-sensitive
- All touch targets at least 40px on mobile for accessibility
- Avatar uploads are stored as validated image data and limited to 2MB on the frontend
- Navigation styling must preserve readable contrast in both light and dark mode
- Password reset tokens must be hashed, time-limited, and invalidated after use

## Completed Tasks
- [x] Project setup (React + Node.js)
- [x] Database schema design
- [x] Backend API (CRUD for mood entries)
- [x] Frontend form for logging mood
- [x] Today's entry view
- [x] Chart visualization
- [x] Interactive chart details
- [x] Comparison analytics
- [x] Settings/profile management
- [x] Form validation
- [x] Mood quotes feature
- [x] SCSS architecture with design system
- [x] Hot reload development environment
- [x] Responsive mobile-first design
- [x] Cypress E2E testing setup
- [x] User authentication (register/login)
- [x] Password best-practice policy enforcement
- [x] Avatar image file upload (drag-drop and click)
- [x] Mobile-friendly navigation and layout
- [x] Light and dark theme preference
- [x] Desktop nav bar moved below header
- [x] Mobile slide-out account menu
- [x] Mood entry editing from dashboard views
- [x] One-entry-per-day log guard with edit redirect for today's mood
- [x] Show/hide password toggle on auth forms
- [x] Secure forgot/reset password workflow
