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

### 1. User Login & Registration
- Users can register with name, email, and password
- Users can log in with email and password
- Users can toggle password visibility (show/hide) on login and registration forms
- Authenticated users can change their password from the Settings page by providing current password + new password confirmation
- Frontend stores auth token and restores session on refresh
- Users can sign out from desktop header controls or the mobile slide-out menu
- Protected routes require a valid JWT

### 2. Password Security Best Practices
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

### 3. Daily Mood Logging
- Users can log mood, feelings, reflections, and sleep data
- Simple form with input validation
- Single entry per day
- If an entry already exists for today, the Log Mood screen shows a notice and routes users to edit today's entry
- Store: mood score (1-10), feelings (array/string), reflection (text), sleep hours (number)

### 4. Form Validation
- Required fields: mood score, at least one feeling
- Reflection: optional
- Sleep: optional, must be valid number (0-24)
- User name: required, min/max length
- Avatar: optional, image file or URL with file size/format validation

### 5. Today's Entry View
- Display current day's complete mood entry
- Show all fields: mood, feelings, reflections, sleep
- Option to edit/update today's entry
- Quick access from dashboard

### 6. Mood Quotes
- Display contextual quotes based on current mood level
- Different quotes for different mood ranges (low, neutral, high)

### 7. Mood Graph
- Line or bar chart showing last 11 mood records
- X-axis: dates
- Y-axis: mood score (1-10)

### 8. Interactive Chart
- Click/tap on chart points to view details
- Show full data for selected day: mood, feelings, reflections, sleep
- Allow editing a selected mood entry from its detail view

### 9. Mood & Sleep Comparisons
- Compare average mood from last 5 check-ins vs. previous 5 check-ins
- Compare average sleep from last 5 check-ins vs. previous 5 check-ins
- Display percentage change and insight narrative

### 10. Settings & Profile
- Update user name
- Upload/change avatar from local files or image URL
- Preview and remove avatar before saving
- Store theme preference and profile preferences

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

## Data Model

### User
```json
{
  "id": "number",
  "name": "string",
  "email": "string (unique)",
  "avatar": "string (url/path)",
  "password_hash": "string (DB only)",
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

## Test Suggestions
- Auth happy path: register, login, restore session on refresh, logout
- Auth validation: weak password rejection, mismatched confirm password, invalid login generic error
- Add mood entry: create today's mood with feeling, reflection, and sleep; verify dashboard updates
- One-entry-per-day guard: second create attempt for same day should show edit redirect/notice
- Edit mood entry: open edit from Today's Entry and from chart detail, update fields, verify persisted changes
- Mood form validation: required feeling, mood bounds, sleep range (0-24), optional reflection behavior
- Settings profile updates: change name and avatar URL/upload, preview/remove avatar, save success state
- Theme behavior: switch light/dark preview, save persistence, unsaved theme reverts when leaving Settings
- Mood chart interactions: last 11 entries render, selecting a point opens matching entry details
- Comparison analytics: validate current vs previous 5 check-ins and percentage/trend labels
- Mobile UX regression: viewport checks for slide-out menu, nav visibility, and touch-target usability
- API failure handling: network/server errors for auth, mood save, and settings save display safe user messages
- Production smoke checks: REACT_APP_API_URL is set, auth works from hosted frontend, CORS preflight passes

## Implementation Notes
- Mobile-first responsive design with proper breakpoints
- Validate on both frontend and backend
- Use secure auth defaults and least-privilege data access
- Keep error responses useful but non-sensitive
- All touch targets at least 40px on mobile for accessibility
- Avatar uploads are stored as validated image data and limited to 2MB on the frontend
- Navigation styling must preserve readable contrast in both light and dark mode

## Future Build Task Order
- [ ] Project setup (frontend, backend, environment config)
- [ ] Database schema and migrations (users, mood_entries, auth fields)
- [ ] Authentication foundation (register, login, JWT middleware, protected routes)
- [ ] Password security policy and hashing standards
- [ ] Core mood entry API (CRUD + one-entry-per-day rule)
- [ ] Frontend auth screens (login/register/reset/change password)
- [ ] Mood logging form and validation
- [ ] Today's entry dashboard card with edit flow
- [ ] Mood chart (last 11 entries) and interactive detail view
- [ ] Mood and sleep comparison analytics
- [ ] Mood quote logic based on score bands
- [ ] Settings/profile (name, avatar upload/url, avatar preview/remove)
- [ ] Theme preferences (light/dark preview and save behavior)
- [ ] Mobile-responsive navigation and layout polish
- [ ] Shared SCSS design system and component styling cleanup
- [ ] Cypress E2E coverage for auth, mood logging, edit, and settings flows
- [ ] Production deployment checks (REACT_APP_API_URL set, CORS verified, smoke test on mobile)
