# Health Tracker

## Project Overview
A time-series health tracking application centered on mood, sleep, hydration, weight, and guided breathing exercises. Users can log daily entries, monitor trends, review weekly insights, and use customizable breathing routines for focus, calm, and sleep support.

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
- Users register with a unique username and password (no email required)
- Users log in with their username and password
- Username serves as the account identifier (2–50 characters, must be unique at registration)
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

### 3. Daily Health Check-In Logging
- Users can log mood, feelings, reflections, sleep, water intake (oz), and weight (lbs)
- Simple form with input validation and spinner/picker controls for numeric tracking values
- Single entry per day
- If an entry already exists for today, the Log Check-In screen shows a notice and routes users to edit today's entry
- Store: mood score (1-10), feelings (array/string), reflection (text), sleep hours (number), water oz (number), weight lbs (number)

### 4. Form Validation
- Required fields: mood score, at least one feeling
- Reflection: optional
- Sleep: optional, must be valid number (0-24)
- Water intake: optional, must be valid number (0-1000 oz)
- Weight: optional, must be valid number (0-1400 lbs)
- User name: required, min/max length
- Avatar: optional, image file or URL with file size/format validation

### 5. Today's Entry View
- Display current day's complete mood entry
- Show all fields: mood, feelings, reflections, sleep, water intake, weight
- Option to edit/update today's entry
- Quick access from dashboard

### 6. Mood Quotes
- Display contextual quotes based on current mood level
- Different quotes for different mood ranges (low, neutral, high)

### 7. Mood Graph
- Line chart showing last 11 health records
- Tabbed metric switcher to view Mood, Sleep, Water, and Weight trends in the same chart panel
- X-axis: dates
- Y-axis adapts by metric: mood (1-10), sleep (0-24), water (oz), and weight (lbs)

### 8. Interactive Chart
- Click/tap on chart points to view details
- Show full data for selected day: mood, feelings, reflections, sleep, water, weight
- Allow editing a selected mood entry from its detail view

### 9. Health Metric Comparisons
- Compare average mood from last 5 check-ins vs. previous 5 check-ins
- Compare average sleep from last 5 check-ins vs. previous 5 check-ins
- Compare average water intake from last 5 check-ins vs. previous 5 check-ins
- Compare average weight from last 5 check-ins vs. previous 5 check-ins
- Display percentage change and insight narrative

### 10. Dashboard Health Pillars
- Dashboard summary is split into distinct metric cards: Mood, Sleep, Hydration, and Weight
- Each metric card includes an average, progress bar, weekly delta, and mini insight text
- Check-in count remains visible in summary context

### 11. Settings & Profile
- Separate display name from login username: users set a display name that appears in the header and throughout the app; the login username is immutable and shown as read-only in account info
- Display name is optional (2–50 characters if set); falls back to username when not set
- Upload/change avatar from local files or image URL
- Preview and remove avatar before saving
- Store theme preference and profile preferences
- Save theme preference to the user account so it syncs across devices after login
- Settings info panel shows login username and account creation date

### 12. Mobile-Friendly Design
- Responsive layout that works seamlessly on mobile, tablet, and desktop
- Navigation buttons remain visible and accessible on mobile screens
- Primary navigation is displayed below the header on larger screens
- Settings and sign-out actions move into a slide-out mobile menu on small screens
- Header layout adapts with flexbox wrapping on smaller screens
- Dashboard card ordering on mobile ensures Entry Details appears after chart/insight sections without overlap
- All interactive elements (buttons, inputs) have proper touch targets
- Font sizes scale appropriately for mobile viewing (smaller fonts on mobile)
- Padding and spacing adjusted for mobile to reduce scrolling
- Images and avatars sized appropriately for small screens
- Forms and input fields optimized for mobile interaction
- No content is hidden or inaccessible on mobile views

### 13. Appearance Preferences
- Users can switch between light and dark mode in Settings
- Theme changes preview immediately in Settings
- Theme choice only persists after user saves Settings
- Saved theme preference is loaded from the authenticated user profile on login and session restore
- Theme preference now persists across different browsers/devices for the same account
- Unsaved theme changes revert when leaving the Settings page
- Theme tokens are shared through SCSS variables and CSS custom properties
- Dark mode includes contrast-tuned chart tabs and action buttons for readability

### 14. Guided Breathing Exercise
- Users can open a dedicated breathing experience with Exercise and Settings tabs
- Breathing runs through inhale, hold, and exhale phases with a live countdown and animated shape
- Users can choose from four visual shapes: Orb, Lotus, Crystal, and Ripple — each with distinct per-phase animations
- Phase labels and countdown visuals reflect the active breathing color palette
- Users can start, pause, and reset the breathing cycle
- Audio cues play distinct tones per phase and stop immediately on pause or reset
- Hold tone is intentionally higher than inhale and exhale, while exhale remains lower than inhale
- Audio fades completely to silence before the next phase sound begins (300ms+ silence gap between phases)
- The Exercise tab shows the currently selected breathing exercise name
- Selecting a profile from Settings routes users directly back to the Exercise tab

### 15. Breathing Preferences & Profiles
- Users can configure inhale, hold, and exhale durations in Settings
- Users can toggle breathing audio on/off and adjust volume
- Audio toggle displays a live On/Off status badge and only the toggle switch itself is clickable (not the label row)
- Volume slider uses the site's earthy gradient (slate → teal → sage) matching the mood slider style
- Maximum audio volume is capped at 0.30 (reduced from 0.60) with lower defaults across all presets
- Users can choose from saved breathing color palettes: Ocean, Sunrise, Forest, Lavender, and Ember
- Palette swatches are displayed as circles
- Users can choose a visual shape for the breathing animation: Orb, Lotus, Crystal, or Ripple
- Visual shape selection persists to the user account alongside other breathing preferences
- Breathing preferences persist to the authenticated user account and restore on login, refresh, and new devices
- Users can save named breathing profiles from their current settings
- Users can edit previously saved breathing profiles
- Preset breathing profiles are available for quick start: Calm Reset (Orb), Focus Box (Crystal), and Deep Sleep 4-7-8 (Ripple)
- Saved and preset profiles can be loaded into the active exercise from either tab
- Profile cards display iconography, timing summary, and audio state

## Deployment Notes
- Frontend production builds rely on `/frontend/.env.production`
- `REACT_APP_API_URL` must point to the deployed backend API to avoid auth failures on Firebase-hosted frontend builds
- Current production backend URL: `https://mood--backend-9b77c9379b8b.herokuapp.com/api`

## Data Model

### User
```json
{
  "id": "number",
  "name": "string (unique login username — immutable after registration)",
  "display_name": "string | null (optional display name shown in header and settings, 2–50 chars)",
  "avatar": "string (url/path)",
  "theme_preference": "string ('light' | 'dark')",
  "breathing_inhale_seconds": "number",
  "breathing_hold_seconds": "number",
  "breathing_exhale_seconds": "number",
  "breathing_cycle_count": "number",
  "breathing_audio_enabled": "boolean",
  "breathing_audio_level": "number (0.00-0.30)",
  "breathing_color_palette": "string ('ocean' | 'sunrise' | 'forest' | 'lavender' | 'ember')",
  "breathing_visual_shape": "string ('orb' | 'lotus' | 'crystal' | 'ripple')",
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
  "water_oz": "number (ounces)",
  "weight_lbs": "number (pounds)",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Breathing Profile
```json
{
  "id": "number",
  "user_id": "number",
  "name": "string",
  "inhale_seconds": "number",
  "hold_seconds": "number",
  "exhale_seconds": "number",
  "audio_enabled": "boolean",
  "audio_level": "number (0.00-0.30)",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## Styling Architecture
- `/frontend/src/styles/_variables.scss`: design tokens (colors, spacing, typography)
- `/frontend/src/styles/_mixins.scss`: reusable mixins (flexbox, grid, responsive breakpoints)
- `/frontend/src/styles/index.scss`: global base styles, CSS custom property theme system, and dark mode overrides
- `/frontend/src/styles/App.scss`: app shell, header/nav, dashboard sections, responsive layouts
- Component style files: MoodForm, TodaysEntry, MoodChart, MoodComparison, Settings, EntryDetails, AuthForm, BreathingExercise

### Design System
- **Palette:** Earthy wellness tones — slate (`#58809B`), teal (`#6BA093`), sage (`#8BC695`), olive (`#A2A574`), earth (`#8C7664`)
- **Light mode:** Neutral cool-white surfaces (`#f4f5f7` page bg, `#ffffff` cards), dark navy text
- **Dark mode:** Neutral charcoal surfaces (`#111214` page bg, `#1d2025` cards), no green tint
- **Theme switching:** CSS custom properties (`--surface`, `--input-bg`, `--text-main`, etc.) toggled via `[data-theme='dark']` on `:root`
- **`@mixin card`** uses `var(--surface, $bg-white)` so all cards automatically respect the active theme
- **`@mixin form-input`** uses `var(--input-bg)` / `var(--input-bg-focus)` for consistent dark-mode inputs
- **Left border accent pattern:** Cards and section headings use a 3px colored left border (or `::before` bar on `h2`) to identify the pillar: slate = mood/summary, teal = sleep/daily, olive = insights, sage = trends
- **Nav buttons:** Header navigation buttons use a subtle filled background and visible border in all states (inactive and active), not transparent. Active state applies the primary gradient.
- **Flat design:** All `$radius-sm/md/lg/xl` are `0`; only `$radius-full: 50%` for circles
- **Spinner buttons** (`spinner-btn`, `step-btn`) use `align-self: stretch` so they always match the adjacent input height; both files share identical visual style

### Mobile Responsive Design
- Breakpoints: Mobile (< 768px), Tablet (768px - 1024px), Desktop (> 1024px)
- Mobile-first approach with `@include mobile`, `@include tablet`, `@include desktop` mixins
- At 440px and below: profile cards expand to 100% width and center; breathing stepper content centers
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
- Auth happy path: register with username, login, restore session on refresh, logout
- Auth validation: weak password rejection, mismatched confirm password, invalid username/password generic error
- Add health check-in: create today's entry with mood, sleep, water, and weight; verify dashboard updates
- One-entry-per-day guard: second create attempt for same day should show edit redirect/notice
- Edit mood entry: open edit from Today's Entry and from chart detail, update fields, verify persisted changes
- Health form validation: required feeling, mood bounds, sleep range, water range, weight range, optional reflection behavior
- Settings profile updates: change display name and avatar URL/upload, preview/remove avatar, save success state; verify display name updates in header and settings field
- Theme behavior: switch light/dark preview, save persistence, unsaved theme reverts when leaving Settings
- Theme styling QA: verify text contrast, chart readability, borders, and component backgrounds in both light and dark mode
- Mood chart interactions: last 11 entries render, selecting a point opens matching entry details
- Trend tab coverage: switch between Mood, Sleep, Water, and Weight tabs; verify chart data/axes update correctly
- Spinner/picker controls: verify increment/decrement controls for sleep, water, and weight fields
- Dark mode button contrast: verify chart tabs, inline edit actions, form submit/secondary buttons remain readable and distinct
- Comparison analytics: validate current vs previous 5 check-ins and percentage/trend labels
- Mobile UX regression: viewport checks for slide-out menu, nav visibility, and touch-target usability
- Mobile dashboard stacking: confirm Entry Details does not render behind other cards and appears after trend/insight cards
- Breathing exercise flow: start, pause, reset, and verify countdown/phase changes
- Breathing audio: confirm phase tones differ, stop on pause/reset, respect audio toggle/volume, and verify silence gap between phases
- Breathing audio toggle: confirm the label row is not clickable; only the toggle switch triggers the on/off state
- Breathing profile flow: load preset, save named profile, edit saved profile, and verify active exercise selection updates
- Breathing theme persistence: save a palette, reload session, log in on another device/browser, and confirm palette restores
- Breathing tab navigation: selecting a profile from Settings should return the user to Exercise with the chosen routine shown
- Dark mode breathing QA: verify active palette colors apply to shapes, phase pill, countdown, and themed primary action
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
- All dashboard and form CSS must be reviewed in both themes to ensure readable typography, visible chart labels, accessible contrast, and clear button states
- Breathing exercise colors and audio settings should remain palette-driven and account-persistent across theme changes
- Dark mode surfaces use neutral charcoal tones — avoid green-tinted backgrounds; accent colors (teal borders, sage gradients) provide the earthy feel
- Input dark mode overrides in `index.scss` use `var(--input-bg)` and `var(--border-soft)` — do not hardcode hex values so the theme stays consistent
- The `index.scss` card block must not include a `border !important` shorthand on `.comparison-card` or other components that manage their own per-pillar border colors

## Build Status
- [x] Project setup (frontend, backend, environment config)
- [x] Database schema and migrations (users, mood_entries, auth fields)
- [x] Authentication foundation (register, login, JWT middleware, protected routes)
- [x] Password security policy and hashing standards
- [x] Core mood entry API (CRUD + one-entry-per-day rule)
- [x] Frontend auth screens (login/register/reset/change password)
- [x] Mood logging form and validation
- [x] Health check-in form extensions (sleep section + water/weight spinner controls)
- [x] Today's entry dashboard card with edit flow
- [x] Health chart (last 11 entries) with Mood/Sleep/Water/Weight trend tabs and interactive detail view
- [x] Mood, sleep, water, and weight comparison analytics
- [x] Dashboard health pillar cards with per-metric mini insights
- [x] Mood quote logic based on score bands
- [x] Settings/profile (name, avatar upload/url, avatar preview/remove)
- [x] Theme preferences (light/dark preview, save behavior, and cross-device persistence)
- [x] Guided breathing exercise with inhale/hold/exhale countdown and animated visual
- [x] Breathing audio cues with pause/reset stop behavior and phase-aware pitch tuning
- [x] Breathing settings persistence across login, refresh, and devices
- [x] Breathing color palette selection with light/dark theme support
- [x] Saved and preset breathing profiles with create/edit/load flows
- [x] Mobile-responsive navigation and layout polish
- [x] Shared SCSS design system and component styling cleanup (removed unused variables, duplicate rules, dead overrides)
- [x] Auth switched from email to username-based login
- [x] Display name unique constraint dropped (migration 013)
- [x] Separate display_name field added (migration 015) — editable in Settings, shown in header; login username immutable
- [x] Breathing visual shape selection (Orb, Lotus, Crystal, Ripple) with per-phase animations (migration 014)
- [ ] Cypress E2E coverage for full auth, mood logging, edit, and settings flows
- [x] Production deployment checks (REACT_APP_API_URL set, CORS verified, smoke test on hosted frontend)
