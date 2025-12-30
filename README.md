# Workout Tracker

A mobile-first workout tracking application built with React. Track your training blocks, log workouts, and monitor progress with automatic progressive overload calculations.

## Features

### Training Block System
- **Progressive Overload Blocks**: Create multi-week training blocks with automatic weight progression
- **Flexible Configuration**: Set block length (1-12 weeks), progression rate (5-15% per week), and deload percentage (70-90%)
- **Two Input Methods**:
  - **CSV Upload**: Upload Week 1 base program as CSV
  - **Manual Builder**: Build workouts day-by-day with a mobile-friendly interface
- **Dynamic Day/Week Management**: Add or remove days (1-7) and weeks (1-12) in the manual builder

### Workout Logging
- **Detailed Set Tracking**: Log weight, reps, and RPE for each set
- **Exercise Management**: Add, edit, delete, and reorder exercises
- **Completion Tracking**: Mark sets and exercises as complete
- **Workout History**: View all completed workouts with detailed set-by-set data

### Legacy Workout System
- **Day-Based Workouts**: Support for traditional day-based workout plans
- **CSV Upload**: Upload workout plans with standard format
- **Manual Builder**: Create workouts without CSV files

### User Experience
- **Mobile-Optimized**: Large touch targets, numeric keypads, and responsive design
- **Current Week Display**: See your active training block and week on the home page
- **Deload Week Indicators**: Visual badges for deload weeks
- **Persistent Storage**: All data saved to localStorage
- **Error Handling**: User-friendly error messages with auto-dismiss

## Tech Stack

- **React 19** - UI framework
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **LocalStorage** - Data persistence

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd workout-tracker
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
```

## Usage

### Creating a Training Block

1. Navigate to **Blocks** → **+ New Block**
2. Choose input method:
   - **CSV Upload**: Upload a CSV file with format: `Day,Exercise,Sets,Reps,BaseLoadMin,BaseLoadMax,RPE`
   - **Manual Builder**: Build your Week 1 program day-by-day
3. Configure block settings:
   - Block length (weeks)
   - Weekly progression rate (%)
   - Deload week percentage (%)
4. Click **Generate Training Block**

### Logging a Workout

1. Navigate to your training block or day
2. Click **Start Exercise** on any exercise
3. Enter weight, reps, and RPE for each set
4. Mark sets as complete
5. Click **Complete Exercise** when finished
6. Click **Complete Workout** to save

### Viewing History

- Navigate to **History** to see all completed workouts
- Click on any workout to view detailed set-by-set data
- Filter by block, week, or date

## CSV Format

### Training Block CSV
```
Day,Exercise,Sets,Reps,BaseLoadMin,BaseLoadMax,RPE
1,Squat,3,5,100,110,8
1,Bench Press,3,5,80,90,8
2,Deadlift,3,5,120,130,8
```

### Legacy Workout CSV
```
Day,Exercise,Sets,Reps,BaseLoadMin,BaseLoadMax,RPE
1,Squat,3,5,100,110,8
1,Bench Press,3,5,80,90,8
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Home.js         # Main landing page
│   ├── BlockSelector.js # Training block list
│   ├── BlockSetup.js   # Block creation
│   ├── DayView.js      # Workout logging interface
│   ├── History.js      # Workout history
│   ├── WeekSelector.js # Week navigation
│   ├── DayBuilder.js   # Manual workout builder
│   └── ExerciseForm.js # Exercise input modal
├── context/            # React context
│   └── WorkoutContext.js
├── utils/              # Utility functions
│   ├── workoutStorage.js # LocalStorage operations
│   ├── blockProgression.js # Progressive overload calculations
│   ├── csvParser.js    # CSV parsing
│   └── blockCsvParser.js
└── App.js              # Main app component
```

## Features in Detail

### Progressive Overload
- Automatically calculates weight increases week-over-week
- Rounds weights to nearest 2.5kg increment
- Applies deload percentage in final week

### Data Management
- All data persisted in browser localStorage
- Delete exercises, workouts, and blocks
- Edit exercises within training blocks
- Consistent error handling across all operations

### Mobile-First Design
- Large touch targets (minimum 44px)
- Numeric keypads for number inputs
- Responsive layouts for all screen sizes
- Optimized for gym use

## Status

✅ **Fully Functional** - All core features implemented and working

The application is ready for use. All data is stored locally in your browser's localStorage.
