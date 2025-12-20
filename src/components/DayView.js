import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useWorkout } from '../context/WorkoutContext';
import { saveWorkoutLog, getTrainingBlock, updateTrainingBlock, saveWorkoutsByDay } from '../utils/workoutStorage';

const DayView = () => {
  const { workoutsByDay, setWorkoutsByDay } = useWorkout();
  const { blockId, weekNumber, dayNumber } = useParams();
  const navigate = useNavigate();
  
  // Determine if we're in block mode or legacy mode
  const isBlockMode = blockId && weekNumber;
  const day = parseInt(dayNumber, 10);
  const week = weekNumber ? parseInt(weekNumber, 10) : null;
  
  // Load block data with useEffect for consistency
  const [block, setBlock] = useState(null);
  useEffect(() => {
    if (blockId) {
      const loadedBlock = getTrainingBlock(parseInt(blockId, 10));
      setBlock(loadedBlock);
    }
  }, [blockId]);

  // State keyed by day number to maintain separate state for each day
  const [loggingExercises, setLoggingExercises] = useState({}); // { day: { exIndex: true } }
  const [workoutLog, setWorkoutLog] = useState({}); // { day: { exIndex: [sets] } }
  const [completedExercises, setCompletedExercises] = useState({}); // { day: { exIndex: true } }
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  // Load exercises based on mode - computed from current state
  const getExercises = () => {
    if (isBlockMode && block) {
      // Block mode: load from block structure
      const currentWeekData = block.weeks.find(w => w.weekNumber === week);
      if (currentWeekData) {
        const dayData = currentWeekData.days.find(d => d.dayNumber === day);
        return dayData ? dayData.exercises : [];
      }
    } else if (workoutsByDay) {
      // Legacy mode: load from workoutsByDay
      return workoutsByDay[day] || [];
    }
    return [];
  };

  const getAllDays = () => {
    if (isBlockMode && block) {
      const currentWeekData = block.weeks.find(w => w.weekNumber === week);
      if (currentWeekData) {
        return currentWeekData.days.map(d => d.dayNumber).sort((a, b) => a - b);
      }
    } else if (workoutsByDay) {
      return Object.keys(workoutsByDay)
        .map(d => parseInt(d, 10))
        .sort((a, b) => a - b);
    }
    return [];
  };

  const exercises = getExercises();
  const allDays = getAllDays();

  // Get current day's state (default to empty objects if day doesn't exist)
  const currentDayLogging = loggingExercises[day] || {};
  const currentDayWorkoutLog = workoutLog[day] || {};
  const currentDayCompleted = completedExercises[day] || {};
  
  // Check if we have data to display
  if (!isBlockMode && !workoutsByDay) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
          <div className="flex flex-wrap gap-4 mb-6">
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-800 font-medium text-base py-2 px-1 min-h-[44px] flex items-center"
            >
              ← Home
            </Link>
            <Link
              to="/blocks"
              className="text-blue-600 hover:text-blue-800 font-medium text-base py-2 px-1 min-h-[44px] flex items-center"
            >
              Blocks
            </Link>
            <Link
              to="/history"
              className="text-blue-600 hover:text-blue-800 font-medium text-base py-2 px-1 min-h-[44px] flex items-center"
            >
              History
            </Link>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">No workout data</h1>
            <p className="text-lg text-gray-600 mb-4">Please create a training block or upload a CSV file.</p>
            <Link
              to="/blocks"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-xl font-bold text-base hover:bg-green-700 transition-colors"
            >
              Create Training Block
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isBlockMode && !block) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
          <Link
            to="/blocks"
            className="inline-block mb-6 text-blue-600 hover:text-blue-800 font-medium text-base py-2 px-1 min-h-[44px] flex items-center"
          >
            ← Back to Blocks
          </Link>
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Block not found</h1>
            <p className="text-lg text-gray-600">The requested training block does not exist.</p>
          </div>
        </div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Day Tabs - Sticky at top */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide py-3">
              {allDays.map((d) => (
                <Link
                  key={d}
                  to={`/day/${d}`}
                  className={`flex-shrink-0 px-5 py-3 rounded-xl font-bold text-base transition-all min-h-[44px] flex items-center justify-center ${
                    d === day
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                  }`}
                >
                  Day {d}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
          <div className="flex flex-wrap gap-4 mb-6">
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-800 font-medium text-base py-2 px-1 min-h-[44px] flex items-center"
            >
              ← Home
            </Link>
            <Link
              to="/history"
              className="text-blue-600 hover:text-blue-800 font-medium text-base py-2 px-1 min-h-[44px] flex items-center"
            >
              History
            </Link>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {isBlockMode ? `Block ${blockId} - Week ${week} - Day ${day}` : `Day ${day}`}
            </h1>
            <p className="text-lg text-gray-600">No exercises found for this day.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Day Tabs - Sticky at top with backdrop blur for better visibility */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide py-3">
            {allDays.map((d) => (
              <Link
                key={d}
                to={isBlockMode 
                  ? `/block/${blockId}/week/${week}/day/${d}`
                  : `/day/${d}`
                }
                className={`flex-shrink-0 px-5 py-3 rounded-xl font-bold text-base transition-all min-h-[44px] flex items-center justify-center ${
                  d === day
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                }`}
              >
                Day {d}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
        {/* Navigation Links */}
        <div className="flex flex-wrap gap-4 mb-6">
          {isBlockMode ? (
            <>
              <Link
                to="/blocks"
                className="text-blue-600 hover:text-blue-800 font-medium text-base py-2 px-1 min-h-[44px] flex items-center"
              >
                ← Blocks
              </Link>
              <Link
                to={`/block/${blockId}`}
                className="text-blue-600 hover:text-blue-800 font-medium text-base py-2 px-1 min-h-[44px] flex items-center"
              >
                Week {week}
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/"
                className="text-blue-600 hover:text-blue-800 font-medium text-base py-2 px-1 min-h-[44px] flex items-center"
              >
                ← Home
              </Link>
            </>
          )}
          <Link
            to="/history"
            className="text-blue-600 hover:text-blue-800 font-medium text-base py-2 px-1 min-h-[44px] flex items-center"
          >
            History
          </Link>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Day Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">
            {isBlockMode ? `Block ${blockId} - Week ${week} - Day ${day}` : `Day ${day}`}
          </h1>
          {isBlockMode && block && (
            <p className="text-base text-gray-500 mb-2">
              {week === block.blockLength ? 'Deload Week' : week === 1 ? 'Base Week' : `Progression Week ${week - 1}`}
            </p>
          )}
          <p className="text-lg text-gray-600">{exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}</p>
        </div>

        {/* Exercise Cards - Larger spacing and touch targets */}
        <div className="space-y-6">
          {exercises.map((exercise, exIndex) => {
            const loadRange = exercise.LoadMin && exercise.LoadMax
              ? `${exercise.LoadMin}-${exercise.LoadMax} kg`
              : exercise.LoadMin
              ? `${exercise.LoadMin} kg`
              : exercise.LoadMax
              ? `${exercise.LoadMax} kg`
              : null;

            const sets = currentDayWorkoutLog[exIndex] || [];

            return (
              <div
                key={exIndex}
                className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 sm:p-8 active:shadow-lg transition-all"
              >
                {/* Exercise Name and Delete Button */}
                <div className="flex items-start justify-between mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight flex-1">
                    {exercise.Exercise}
                  </h2>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${exercise.Exercise}" from this day?`)) {
                        try {
                          if (isBlockMode && block) {
                            // Block mode: remove from all weeks
                            const updatedBlock = { ...block };
                            const weekIndex = updatedBlock.weeks.findIndex(w => w.weekNumber === week);
                            if (weekIndex !== -1) {
                              const dayIndex = updatedBlock.weeks[weekIndex].days.findIndex(d => d.dayNumber === day);
                              if (dayIndex !== -1) {
                                // Remove exercise from all weeks (since exercises are the same across weeks)
                                updatedBlock.weeks.forEach(w => {
                                  const d = w.days.find(d => d.dayNumber === day);
                                  if (d) {
                                    d.exercises = d.exercises.filter((_, idx) => idx !== exIndex);
                                  }
                                });
                                updateTrainingBlock(updatedBlock);
                                // Update local state to reflect changes
                                setBlock(updatedBlock);
                              }
                            }
                          } else if (workoutsByDay) {
                            // Legacy mode: remove from workoutsByDay
                            const updatedWorkoutsByDay = { ...workoutsByDay };
                            if (updatedWorkoutsByDay[day]) {
                              updatedWorkoutsByDay[day] = updatedWorkoutsByDay[day].filter((_, idx) => idx !== exIndex);
                              // If day has no exercises left, remove the day key
                              if (updatedWorkoutsByDay[day].length === 0) {
                                delete updatedWorkoutsByDay[day];
                              }
                              // Save to localStorage
                              saveWorkoutsByDay(updatedWorkoutsByDay);
                              // Update context
                              setWorkoutsByDay(updatedWorkoutsByDay);
                            }
                          }
                        } catch (err) {
                          setError('Failed to delete exercise: ' + err.message);
                          setTimeout(() => setError(''), 5000);
                        }
                      }
                    }}
                    className="ml-4 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors min-h-[44px]"
                    aria-label="Delete exercise"
                  >
                    Delete
                  </button>
                </div>

                {!currentDayLogging[exIndex] ? (
                  /* Exercise Details - View Mode */
                  <div>
                    <div className="space-y-5 sm:grid sm:grid-cols-3 sm:gap-6 sm:space-y-0 mb-6">
                      {/* Target */}
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Target
                        </span>
                        <span className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                          {exercise.Sets} sets × {exercise.Reps} reps
                        </span>
                      </div>

                      {/* Load Range */}
                      {loadRange && (
                        <div className="flex flex-col">
                          <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Load Range
                          </span>
                          <span className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                            {loadRange}
                          </span>
                        </div>
                      )}

                      {/* RPE */}
                      {exercise.RPE && (
                        <div className="flex flex-col">
                          <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            RPE
                          </span>
                          <span className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                            {exercise.RPE}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Start Exercise Button for this exercise */}
                    <button
                      onClick={() => {
                        // Calculate pre-filled weight (use LoadMin only, or LoadMax if LoadMin doesn't exist)
                        let prefilledWeight = '';
                        if (exercise.LoadMin) {
                          prefilledWeight = exercise.LoadMin.toString();
                        } else if (exercise.LoadMax) {
                          prefilledWeight = exercise.LoadMax.toString();
                        }
                        
                        // Pre-fill with target values
                        const sets = Array(exercise.Sets).fill(null).map(() => ({
                          weight: prefilledWeight,
                          reps: exercise.Reps ? exercise.Reps.toString() : '',
                          rpe: exercise.RPE ? exercise.RPE.toString() : '',
                          completed: false
                        }));
                        
                        // Initialize logging for this exercise (keyed by day)
                        setLoggingExercises(prev => ({
                          ...prev,
                          [day]: { ...(prev[day] || {}), [exIndex]: true }
                        }));
                        setWorkoutLog(prev => ({
                          ...prev,
                          [day]: { ...(prev[day] || {}), [exIndex]: sets }
                        }));
                      }}
                      className="w-full px-6 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 active:bg-green-800 transition-colors shadow-md min-h-[56px]"
                    >
                      Start Exercise
                    </button>
                  </div>
                ) : (
                  /* Workout Logging Mode */
                  <div className={`space-y-4 ${currentDayCompleted[exIndex] ? 'opacity-75' : ''}`}>
                    <div className={`mb-4 pb-4 border-b ${currentDayCompleted[exIndex] ? 'border-green-300' : 'border-gray-200'} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                          Target: {exercise.Sets} sets × {exercise.Reps} reps
                          {loadRange && ` | ${loadRange}`}
                        </span>
                        {currentDayCompleted[exIndex] && (
                          <span className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-bold flex items-center gap-1.5">
                            <span>✓</span>
                            <span>Completed</span>
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!currentDayCompleted[exIndex] && (
                          <button
                            onClick={() => {
                              // Mark exercise as completed (keyed by day)
                              setCompletedExercises(prev => ({
                                ...prev,
                                [day]: { ...(prev[day] || {}), [exIndex]: true }
                              }));
                            }}
                            className="px-5 py-3 text-base bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold min-h-[48px] shadow-md"
                          >
                            Complete Exercise
                          </button>
                        )}
                        <button
                          onClick={() => {
                            // Stop logging for this exercise (keyed by day)
                            setLoggingExercises(prev => {
                              const updated = { ...prev };
                              if (updated[day]) {
                                updated[day] = { ...updated[day] };
                                delete updated[day][exIndex];
                              }
                              return updated;
                            });
                            setWorkoutLog(prev => {
                              const updated = { ...prev };
                              if (updated[day]) {
                                updated[day] = { ...updated[day] };
                                delete updated[day][exIndex];
                              }
                              return updated;
                            });
                            setCompletedExercises(prev => {
                              const updated = { ...prev };
                              if (updated[day]) {
                                updated[day] = { ...updated[day] };
                                delete updated[day][exIndex];
                              }
                              return updated;
                            });
                          }}
                          className="px-5 py-3 text-base bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-bold min-h-[48px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                    
                    {/* Sets Input Fields */}
                    <div className="space-y-5">
                      {sets.map((set, setIndex) => (
                        <div
                          key={setIndex}
                          className={`p-5 sm:p-6 rounded-xl border-2 transition-all ${
                            currentDayCompleted[exIndex]
                              ? 'bg-green-100 border-green-400'
                              : set.completed
                              ? 'bg-green-50 border-green-300'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-xl font-bold text-gray-700">
                              Set {setIndex + 1}
                            </span>
                            <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
                              <input
                                type="checkbox"
                                checked={set.completed}
                                onChange={(e) => {
                                  const updatedLog = { ...workoutLog };
                                  if (!updatedLog[day]) updatedLog[day] = {};
                                  if (!updatedLog[day][exIndex]) updatedLog[day][exIndex] = [...sets];
                                  updatedLog[day][exIndex][setIndex].completed = e.target.checked;
                                  setWorkoutLog(updatedLog);
                                }}
                                disabled={currentDayCompleted[exIndex]}
                                className="w-6 h-6 text-green-600 rounded focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                              />
                              <span className="text-base font-semibold text-gray-700">Complete</span>
                            </label>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            {/* Weight Input */}
                            <div className="flex flex-col">
                              <label className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 h-[32px] flex items-end">
                                <span className="leading-tight">Weight (kg)</span>
                              </label>
                              <input
                                type="number"
                                step="0.5"
                                value={set.weight}
                                onChange={(e) => {
                                  const updatedLog = { ...workoutLog };
                                  if (!updatedLog[day]) updatedLog[day] = {};
                                  if (!updatedLog[day][exIndex]) updatedLog[day][exIndex] = [...sets];
                                  updatedLog[day][exIndex][setIndex].weight = e.target.value;
                                  setWorkoutLog(updatedLog);
                                  
                                  // Check if all sets are filled and auto-complete
                                  const allSetsFilled = updatedLog[day][exIndex].every(s => 
                                    s.weight && s.reps && s.rpe
                                  );
                                  if (allSetsFilled && !currentDayCompleted[exIndex]) {
                                    setCompletedExercises(prev => ({
                                      ...prev,
                                      [day]: { ...(prev[day] || {}), [exIndex]: true }
                                    }));
                                  }
                                }}
                                disabled={currentDayCompleted[exIndex]}
                                placeholder="0"
                                className={`w-full px-4 py-3 text-xl font-semibold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[56px] ${
                                  currentDayCompleted[exIndex] ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white'
                                }`}
                              />
                            </div>

                            {/* Reps Input */}
                            <div className="flex flex-col">
                              <label className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 h-[32px] flex items-end">
                                <span className="leading-tight">Reps</span>
                              </label>
                              <input
                                type="number"
                                value={set.reps}
                                onChange={(e) => {
                                  const updatedLog = { ...workoutLog };
                                  if (!updatedLog[day]) updatedLog[day] = {};
                                  if (!updatedLog[day][exIndex]) updatedLog[day][exIndex] = [...sets];
                                  updatedLog[day][exIndex][setIndex].reps = e.target.value;
                                  setWorkoutLog(updatedLog);
                                  
                                  // Check if all sets are filled and auto-complete
                                  const allSetsFilled = updatedLog[day][exIndex].every(s => 
                                    s.weight && s.reps && s.rpe
                                  );
                                  if (allSetsFilled && !currentDayCompleted[exIndex]) {
                                    setCompletedExercises(prev => ({
                                      ...prev,
                                      [day]: { ...(prev[day] || {}), [exIndex]: true }
                                    }));
                                  }
                                }}
                                disabled={currentDayCompleted[exIndex]}
                                placeholder="0"
                                className={`w-full px-4 py-3 text-xl font-semibold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[56px] ${
                                  currentDayCompleted[exIndex] ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white'
                                }`}
                              />
                            </div>

                            {/* RPE Input */}
                            <div className="flex flex-col">
                              <label className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 h-[32px] flex items-end">
                                <span className="leading-tight">RPE</span>
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={set.rpe}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '' || (value >= 1 && value <= 10)) {
                                    const updatedLog = { ...workoutLog };
                                    if (!updatedLog[day]) updatedLog[day] = {};
                                    if (!updatedLog[day][exIndex]) updatedLog[day][exIndex] = [...sets];
                                    updatedLog[day][exIndex][setIndex].rpe = value;
                                    setWorkoutLog(updatedLog);
                                    
                                    // Check if all sets are filled and auto-complete
                                    const allSetsFilled = updatedLog[day][exIndex].every(s => 
                                      s.weight && s.reps && s.rpe
                                    );
                                    if (allSetsFilled && !currentDayCompleted[exIndex]) {
                                      setCompletedExercises(prev => ({
                                        ...prev,
                                        [day]: { ...(prev[day] || {}), [exIndex]: true }
                                      }));
                                    }
                                  }
                                }}
                                disabled={currentDayCompleted[exIndex]}
                                placeholder="1-10"
                                className={`w-full px-4 py-3 text-xl font-semibold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[56px] ${
                                  currentDayCompleted[exIndex] ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Complete Workout Button - Show if any exercise is being logged */}
        {Object.keys(currentDayLogging).length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                // Cancel all logging for current day
                setLoggingExercises(prev => {
                  const updated = { ...prev };
                  delete updated[day];
                  return updated;
                });
                setWorkoutLog(prev => {
                  const updated = { ...prev };
                  delete updated[day];
                  return updated;
                });
                setCompletedExercises(prev => {
                  const updated = { ...prev };
                  delete updated[day];
                  return updated;
                });
              }}
              className="flex-1 px-6 py-5 bg-gray-300 text-gray-800 rounded-xl font-bold text-lg hover:bg-gray-400 active:bg-gray-500 transition-colors min-h-[56px] shadow-md"
            >
              Cancel All
            </button>
            <button
              onClick={() => {
                // Prepare workout log data - only include exercises that were logged and completed
                const loggedExercises = exercises
                  .map((exercise, exIndex) => {
                    if (currentDayWorkoutLog[exIndex] && currentDayWorkoutLog[exIndex].length > 0 && currentDayCompleted[exIndex]) {
                      return {
                        exerciseName: exercise.Exercise,
                        sets: currentDayWorkoutLog[exIndex]
                      };
                    }
                    return null;
                  })
                  .filter(ex => ex !== null);

                if (loggedExercises.length > 0) {
                  const completedWorkout = {
                    day,
                    timestamp: new Date().toISOString(),
                    exercises: loggedExercises,
                    // Add block info if in block mode
                    ...(isBlockMode && {
                      blockId: parseInt(blockId, 10),
                      week: week
                    })
                  };

                  // Save to localStorage with timestamp, day, and all exercises/sets
                  saveWorkoutLog(completedWorkout);
                  
                  // Show success message
                  setShowSuccess(true);
                  
                  // Clear logging state for current day
                  setLoggingExercises(prev => {
                    const updated = { ...prev };
                    delete updated[day];
                    return updated;
                  });
                  setWorkoutLog(prev => {
                    const updated = { ...prev };
                    delete updated[day];
                    return updated;
                  });
                  setCompletedExercises(prev => {
                    const updated = { ...prev };
                    delete updated[day];
                    return updated;
                  });
                  
                  // Hide success message after 3 seconds and stay on workout plan view
                  setTimeout(() => {
                    setShowSuccess(false);
                  }, 3000);
                }
              }}
              className="flex-1 px-6 py-5 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 active:bg-green-800 transition-colors shadow-lg min-h-[56px]"
            >
              Complete Workout
            </button>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Workout Complete!</h2>
              <p className="text-lg text-gray-600 mb-4">Your workout has been saved successfully.</p>
              <p className="text-sm text-gray-500">Data saved to localStorage with timestamp and all sets.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DayView;

