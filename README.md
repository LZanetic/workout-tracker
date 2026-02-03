# Workout Tracker

A mobile-first workout tracking app built with React. Create training blocks, log workouts with sets/reps/weight/RPE, and view history. Supports both block-based programs and standalone day-based plans.

## Features

### Training blocks
- **Progressive overload**: Multi-week blocks with configurable weekly progression (5–15%) and deload week (70–90% of week 1).
- **Three ways to create a block**:
  - **CSV upload**: Upload a Week 1 base program (Day, Exercise, Sets, Reps, BaseLoadMin, BaseLoadMax, RPE).
  - **Manual builder**: Build Week 1 day-by-day with exercise search (database or free text) and set/reps/load/RPE/tempo.
  - **Copy from block**: Duplicate an existing block and optionally increase all loads by a percentage.
- **Block configuration**: Block length (1–12 weeks), progression rate, deload rate. Days per week (1–7) in manual builder.

### Standalone workouts (no block)
- **Home**: Upload a CSV or build a week manually (day-based plan). Stored as a single “standalone” block so you can log and track it.
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
- **Persistence**: Backend API (blocks + workouts) with localStorage fallback when the API is unavailable.

## Tech stack

- **React 19** – UI
- **React Router 7** – Routing
- **Tailwind CSS** – Styling
- **Lucide React** – Icons
- **Backend API** – Blocks and workout logging (optional; app works with localStorage only if backend is down)

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

Configure the API base URL with `REACT_APP_API_URL` (default: `http://localhost:8080/api`).

## Usage

### Creating a training block

1. Go to **Blocks** → **New Block** (or **Create Training Block** if the list is empty).
2. Choose **CSV Upload**, **Manual Builder**, or **Copy from Block**.
3. For CSV: upload a Week 1 CSV. For manual: set days per week, add exercises per day (add exercise → search or free input, set sets/reps/load/RPE/tempo). For copy: select a block and optional load increase %.
4. Set **Block configuration** (block length, progression %, deload %) if not using copy.
5. Click **Generate Training Block** (or **Copy & Create Block**).

### Logging a workout

1. Open a block → choose week → choose day (or from Home, open a **Day** for standalone).
2. For each exercise, click **Start Exercise**, enter weight/reps/RPE per set, mark sets complete, then **Complete Exercise**.
3. Click **Complete Workout** to save.

### Viewing history

- Go to **History**. Click a workout to see set-by-set details. Use **Delete** to remove a workout.

## CSV format

### Block Week 1 (or standalone plan)

```csv
Day,Exercise,Sets,Reps,BaseLoadMin,BaseLoadMax,RPE
1,Squat,3,5,100,110,8
1,Bench Press,3,5,80,90,8
2,Deadlift,3,5,120,130,8
```

For standalone/home uploads the same columns are used; the app uses `LoadMin`/`LoadMax` in the UI but the format is equivalent.

## Project structure

```
src/
├── components/
│   ├── Home.js          # Landing: CSV/manual input, standalone days
│   ├── BlockSelector.js # List blocks, new block, delete
│   ├── BlockSetup.js    # Create block (CSV / manual / copy)
│   ├── DayView.js       # Log workout (sets, weight, reps, RPE)
│   ├── WeekSelector.js  # Week tabs for a block
│   ├── History.js       # Completed workouts list and detail
│   ├── DayBuilder.js    # Day card + exercise list (manual builder)
│   ├── ExerciseForm.js  # Add/edit exercise (DB search or free)
│   └── FileUpload.js    # CSV file input
├── context/
│   └── WorkoutContext.js
├── services/
│   └── api.js           # Backend API + ExerciseDB (body parts, exercises)
├── utils/
│   ├── workoutStorage.js    # localStorage
│   ├── blockProgression.js  # Progressive overload math
│   ├── apiTransformers.js   # Request/response shapes
│   ├── csvParser.js         # Standalone CSV
│   └── blockCsvParser.js    # Block Week 1 CSV
├── App.js
└── index.js
```

## Status

The app is fully usable with or without the backend. Blocks and workouts are stored in PostgreSQL when the backend is running; otherwise they are kept in localStorage.
