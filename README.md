# Workout Tracker

A mobile-first workout tracking app built with React. Create training blocks, log workouts with sets/reps/weight/RPE, and view history. Supports both block-based programs and standalone day-based plans.

**Live demo:** [https://lzanetic.github.io/workout-tracker](https://lzanetic.github.io/workout-tracker)

## Features

### Training blocks
- **Progressive overload**: Multi-week blocks with configurable weekly progression (5–15%) and deload week (70–90% of week 1).
- **Two ways to create a block**:
  - **Manual builder**: Build Week 1 day-by-day with exercise search (database or free text) and set/reps/load/RPE/tempo.
  - **Copy from block**: Duplicate an existing block and optionally increase all loads by a percentage.
- **Block configuration**: Block length (1–12 weeks), progression rate, deload rate. Days per week (1–7) in manual builder.

### Standalone workouts (no block)
- **Home**: Build a week manually (day-based plan). Stored as a single “standalone” block so you can log and track it.
- **Available days**: Quick links to Day 1, 2, … for your current plan.

### Workout logging
- **Day view**: Per-exercise cards with prescribed sets; log weight, reps, and RPE per set.
- **Completion**: Mark sets complete, complete exercise, then complete workout. Workouts are saved to the backend (or localStorage if the API is unavailable).
- **Exercise actions**: Delete an exercise from a day (block mode removes it from all weeks).

### History
- **List**: All completed workouts (from API and localStorage), most recent first.
- **Detail**: View any workout with set-by-set results.
- **Delete**: Remove a logged workout (API and local).

### Exercise form
- **Search from database**: Choose body part (or “Search by name”), equipment, then exercise; or type a name for suggestions (external ExerciseDB API).
- **Free input**: Enter any exercise name without search.

### UX and design
- **Dark theme**: Dark backgrounds (gray-900/800), amber accents, emerald for success.
- **Icons**: Lucide React icons (dumbbell, calendar, history, etc.) across the app.
- **Mobile-first**: Large touch targets, numeric/decimal inputs, responsive layout.
- **Persistence**: Backend API (blocks + workouts) when enabled; on web uses localStorage fallback; on Android/iOS uses Capacitor Preferences (reliable on device) with localStorage fallback on web.

## Tech stack

- **React 19** – UI
- **React Router 7** – Routing
- **Tailwind CSS** – Styling
- **Lucide React** – Icons
- **Backend API** – Blocks and workout logging (optional; app works with localStorage only if backend is down)
- **Capacitor** – Android app (optional; same folder, build an APK for sideloading; all free, no store required)

## Getting started

### Prerequisites

- Node.js 14+
- npm or yarn

### Install and run

1. Clone and install:
   ```bash
   git clone <repository-url>
   cd workout-tracker
   npm install
   ```

2. Start the dev server:
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000).

3. **(Optional)** Run the backend so blocks and workouts are stored in PostgreSQL (see [backend/README.md](backend/README.md)). If the backend is not running, the app uses localStorage only.

### Build for production

```bash
npm run build
```

**Environment (optional):** Copy `.env.example` to `.env`. Set `REACT_APP_USE_API=true` to use the backend; set to `false` for local-only. Set `REACT_APP_API_URL` if your API is not at `http://localhost:8080/api`. On the Android app, the API is auto-disabled when the URL is localhost so the app works without a server.

To update the live demo after code changes: `npm run deploy`.

### Android app (Capacitor — build an APK for your phone)

You can build an Android APK and install it on your phone (sideload) without the Play Store. You need **Node.js**, **npm**, and **Android Studio** installed.

**1. Install dependencies** (once per machine):

```bash
npm install
```

**2. Build the web app first** (Capacitor needs the `build/` folder with `index.html`):

```bash
npm run build
```

**3. Add Android** (once per machine, after the first build exists):

```bash
npx cap add android
```

**4. API on Android (local-only by default when using localhost):**

The app can run with or without the backend. On the **Android app**, if the API URL is `localhost`, the app **automatically uses local-only** (Capacitor Preferences on device) so it works without your computer—no “Failed to fetch” errors. To use a real server from the app, set `REACT_APP_API_URL` to your server URL and `REACT_APP_USE_API=true`. For web dev with backend, set `REACT_APP_USE_API=true` in `.env`.

**5. Sync web app to Android** (run this after any front-end change):

```bash
npm run cap:sync
```

This runs `npm run build` and copies the `build/` output into the Android project.

**6. Open the Android project in Android Studio:**

```bash
npm run cap:open:android
```

**7. In Android Studio:**

- Wait for Gradle sync to finish.
- **Debug APK:** **Run** (green play) or **Build → Build Bundle(s) / APK(s) → Build APK(s)**. Output: `android/app/build/outputs/apk/debug/app-debug.apk`.
- **Release APK** (e.g. to share): **Build → Generate Signed Bundle / APK** or use the debug keystore (see `android/app/build.gradle`). Output: `android/app/build/outputs/apk/release/app-release.apk`.
- Copy the APK to your phone and install (enable “Install from unknown sources” if asked). No Play Store or custom keystore needed for personal use.

**Later:** To pick up code changes, run `npm run cap:sync` again, then in Android Studio run the app or build a new APK. The `android/` folder stays in the repo (one-folder setup).

## Usage

### Creating a training block

1. Go to **Blocks** → **New Block** (or **Create Training Block** if the list is empty).
2. Choose **Manual Builder** or **Copy from Block**.
3. For manual: set days per week, add exercises per day (add exercise → search or free input, set sets/reps/load/RPE/tempo). For copy: select a block and optional load increase %.
4. Set **Block configuration** (block length, progression %, deload %) if not using copy.
5. Click **Generate Training Block** (or **Copy & Create Block**).

### Logging a workout

1. Open a block → choose week → choose day (or from Home, open a **Day** for standalone).
2. For each exercise, click **Start Exercise**, enter weight/reps/RPE per set, mark sets complete, then **Complete Exercise**.
3. Click **Complete Workout** to save.

### Viewing history

- Go to **History**. Click a workout to see set-by-set details. Use **Delete** to remove a workout.

## Project structure

```
src/
├── components/
│   ├── Home.js          # Landing: CSV/manual input, standalone days
│   ├── BlockSelector.js # List blocks, new block, delete
│   ├── BlockSetup.js    # Create block (manual / copy)
│   ├── DayView.js       # Log workout (sets, weight, reps, RPE)
│   ├── WeekSelector.js  # Week tabs for a block
│   ├── History.js       # Completed workouts list and detail
│   ├── DayBuilder.js    # Day card + exercise list (manual builder)
│   └── ExerciseForm.js  # Add/edit exercise (DB search or free)
├── context/
│   └── WorkoutContext.js
├── services/
│   └── api.js           # Backend API + ExerciseDB (body parts, exercises)
├── utils/
│   ├── workoutStorage.js    # localStorage (web) / Capacitor Preferences (Android/iOS)
│   ├── blockProgression.js  # Progressive overload math
│   ├── apiTransformers.js   # Request/response shapes
│   ├── csvParser.js         # Standalone CSV
│   └── blockCsvParser.js    # Block Week 1 CSV
├── App.js
└── index.js
```

## Status

The app is fully usable with or without the backend. Blocks and workouts are stored in PostgreSQL when the backend is running; on web they fall back to localStorage; on the Android app they use Capacitor Preferences (reliable on device), with API auto-disabled when the URL is localhost.
