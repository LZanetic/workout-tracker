import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { History as HistoryIcon, ChevronLeft, Trash2, Dumbbell, Home } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { getWorkoutLogs, getTrainingBlock, getTrainingBlocks, setWorkoutLogs } from '../utils/workoutStorage';
import { getAllBlocks, getBlockProgress, deleteWorkout } from '../services/api';

const History = () => {
  const { standaloneBlockId } = useWorkout();
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Transform API workout format to localStorage format
  const transformApiWorkout = (apiWorkout) => {
    return {
      blockId: apiWorkout.blockId,
      week: apiWorkout.weekNumber,
      weekNumber: apiWorkout.weekNumber,
      day: apiWorkout.dayNumber,
      dayNumber: apiWorkout.dayNumber,
      timestamp: apiWorkout.completedAt || new Date().toISOString(),
      exercises: apiWorkout.exercises.map(ex => ({
        exerciseName: ex.exerciseName,
        sets: ex.actualSets.map(set => ({
          weight: set.actualWeight,
          reps: set.actualReps,
          rpe: set.actualRPE,
          completed: true // API workouts are all completed
        }))
      }))
    };
  };

  // Create a unique key for deduplication
  const getWorkoutKey = (workout) => {
    if (workout.blockId && workout.week && workout.day) {
      return `api_${workout.blockId}_${workout.week}_${workout.day}`;
    }
    return `local_${workout.timestamp}_${workout.day}`;
  };

  const loadWorkouts = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const allWorkouts = [];
      const workoutKeys = new Set();

      // Try to load from API
      try {
        // Get all blocks (try API first, fallback to localStorage)
        let blocks = [];
        try {
          const apiBlocks = await getAllBlocks();
          blocks = apiBlocks.map(block => ({
            blockId: block.id,
            id: block.id
          }));
        } catch (apiError) {
          console.warn('Failed to load blocks from API, using localStorage:', apiError);
          const localBlocks = getTrainingBlocks();
          blocks = localBlocks.map(block => ({
            blockId: block.blockId,
            id: block.blockId
          }));
        }

        // Fetch workouts from API for each block
        for (const block of blocks) {
          try {
            const progress = await getBlockProgress(block.id || block.blockId);
            for (const apiWorkout of progress) {
              const transformed = transformApiWorkout(apiWorkout);
              const key = getWorkoutKey(transformed);
              if (!workoutKeys.has(key)) {
                workoutKeys.add(key);
                allWorkouts.push(transformed);
              }
            }
          } catch (blockError) {
            console.warn(`Failed to load progress for block ${block.id || block.blockId}:`, blockError);
            // Continue with other blocks
          }
        }
      } catch (apiError) {
        console.warn('API load failed, using localStorage only:', apiError);
      }

      // Get localStorage workouts
      const localWorkouts = getWorkoutLogs();
      for (const localWorkout of localWorkouts) {
        const key = getWorkoutKey(localWorkout);
        // Only add if not already added from API (API takes precedence)
        if (!workoutKeys.has(key)) {
          workoutKeys.add(key);
          allWorkouts.push(localWorkout);
        }
      }

      // Sort by timestamp, most recent first
      const sortedWorkouts = allWorkouts.sort((a, b) => {
        const dateA = new Date(a.timestamp || 0);
        const dateB = new Date(b.timestamp || 0);
        return dateB - dateA;
      });

      setWorkouts(sortedWorkouts);
    } catch (err) {
      console.error('Error loading workouts:', err);
      setError('Failed to load workouts: ' + err.message);
      // Fallback to localStorage only
      const logs = getWorkoutLogs();
      const sortedLogs = logs.sort((a, b) => 
        new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
      );
      setWorkouts(sortedLogs);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  const handleDeleteWorkout = async (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
      const workout = workouts[index];
      const weekNum = workout?.weekNumber || workout?.week;
      const dayNum = workout?.dayNumber || workout?.day;
      const hasApiIds = workout && workout.blockId != null && weekNum != null && dayNum != null;

      try {
        if (hasApiIds) {
          // Delete from backend first
          await deleteWorkout(workout.blockId, weekNum, dayNum);
        }
        // Remove from localStorage so UI stays in sync (for API workouts or legacy)
        const logs = getWorkoutLogs();
        const workoutWeek = workout.weekNumber ?? workout.week;
        const workoutDay = workout.dayNumber ?? workout.day;
        const updatedLogs = logs.filter(log => {
          if (workout.blockId != null && workoutWeek != null && workoutDay != null) {
            const logWeek = log.week ?? log.weekNumber;
            const logDay = log.day ?? log.dayNumber;
            const sameBlockWeekDay = Number(log.blockId) === Number(workout.blockId) &&
              Number(logWeek) === Number(workoutWeek) &&
              Number(logDay) === Number(workoutDay);
            return !sameBlockWeekDay;
          }
          return !(log.timestamp === workout.timestamp && (log.day ?? log.dayNumber) === (workout.day ?? workout.dayNumber));
        });
        setWorkoutLogs(updatedLogs);
        // Refresh list from backend (so History reflects DB)
        await loadWorkouts();
        if (selectedWorkout && workouts.indexOf(selectedWorkout) === index) {
          setSelectedWorkout(null);
        }
      } catch (err) {
        setError(err.message || 'Failed to delete workout. Is the backend running?');
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalExercises = (workout) => {
    return workout.exercises ? workout.exercises.length : 0;
  };

  const isDeloadWeek = (workout) => {
    if (!workout.blockId || !workout.week) return false;
    const block = getTrainingBlock(workout.blockId);
    return block && workout.week === block.blockLength;
  };

  if (selectedWorkout) {
    return (
      <div className="min-h-screen bg-gray-900 pb-24">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
          {/* Back Button */}
          <button
            onClick={() => setSelectedWorkout(null)}
            className="mb-6 text-amber-400 hover:text-amber-300 font-medium text-base py-2 px-1 min-h-[44px] flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" /> Back to History
          </button>

          {/* Workout Detail Header */}
          <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6 mb-6">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-2 flex items-center gap-3">
                  <Dumbbell className="w-8 h-8 text-amber-500" />
                  {selectedWorkout.blockId && selectedWorkout.week 
                    ? `Week ${selectedWorkout.week}: Day ${selectedWorkout.day}`
                    : `Day ${selectedWorkout.day} Workout`}
                </h1>
                {(selectedWorkout.blockId != null) && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${Number(selectedWorkout.blockId) === standaloneBlockId ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'bg-amber-500/20 text-amber-400 border border-amber-500/50'}`}>
                      {Number(selectedWorkout.blockId) === standaloneBlockId ? 'My Workouts' : `Block ${selectedWorkout.blockId}`}
                    </span>
                    {isDeloadWeek(selectedWorkout) && (
                      <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-semibold border border-amber-500/50">
                        Deload Week
                      </span>
                    )}
                  </div>
                )}
                <p className="text-lg text-gray-400">
                  {formatDate(selectedWorkout.timestamp)}
                </p>
              </div>
              <button
                onClick={() => {
                  const index = workouts.findIndex(w => w === selectedWorkout);
                  if (index !== -1) {
                    handleDeleteWorkout(index, { preventDefault: () => {}, stopPropagation: () => {} });
                  }
                }}
                className="ml-4 px-4 py-2 bg-red-900/40 text-red-300 rounded-lg text-sm font-semibold hover:bg-red-800/50 border border-red-700/50 transition-colors min-h-[44px] flex items-center gap-2"
                aria-label="Delete workout"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>

          {/* Exercise Details */}
          <div className="space-y-6">
            {selectedWorkout.exercises.map((exercise, exIndex) => (
              <div
                key={exIndex}
                className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6 sm:p-8"
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-6">
                  {exercise.exerciseName}
                </h2>

                {/* Sets Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Set
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Weight (kg)
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Reps
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                          RPE
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {exercise.sets.map((set, setIndex) => (
                        <tr key={setIndex} className="hover:bg-gray-700/50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-100">
                            {setIndex + 1}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-center">
                            {set.weight || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-center">
                            {set.reps || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 text-center">
                            {set.rpe || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {set.completed ? (
                              <span className="px-2 py-1 text-xs font-semibold bg-emerald-900/50 text-emerald-300 rounded-full border border-emerald-500/50">
                                ✓ Complete
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold bg-gray-600 text-gray-400 rounded-full">
                                Incomplete
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-xl text-red-300">
            {error}
          </div>
        )}
        {/* Loading Indicator */}
        {isLoading && (
          <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            Loading workouts...
          </div>
        )}
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-4 text-amber-400 hover:text-amber-300 font-medium text-base py-2 px-1 min-h-[44px]"
          >
            <Home className="w-5 h-5" /> Back to Home
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-100 mb-2 flex items-center gap-3">
            <HistoryIcon className="w-10 h-10 text-amber-500" />
            Workout History
          </h1>
          <p className="text-lg text-gray-400">
            {workouts.length} {workouts.length === 1 ? 'workout' : 'workouts'} completed
          </p>
        </div>

        {/* Workout List */}
        {workouts.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8 text-center">
            <Dumbbell className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-xl text-gray-400 mb-4">No workouts completed yet</p>
            <p className="text-gray-500">Complete a workout to see it here!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6 hover:border-gray-600 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => setSelectedWorkout(workout)}
                  >
                    <h2 className="text-2xl font-bold text-gray-100 mb-2">
                      {workout.blockId && workout.week 
                        ? `Week ${workout.week}: Day ${workout.day}`
                        : `Day ${workout.day}`}
                    </h2>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      {workout.blockId != null && (
                        <>
                          <span className={`px-3 py-1 rounded-lg text-sm font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/50`}>
                            {Number(workout.blockId) === standaloneBlockId ? 'My Workouts' : `Block ${workout.blockId}`}
                          </span>
                          {isDeloadWeek(workout) && (
                            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-semibold border border-amber-500/50">
                              Deload
                            </span>
                          )}
                        </>
                      )}
                      <span className="px-3 py-1 bg-emerald-900/40 text-emerald-300 rounded-lg text-sm font-semibold border border-emerald-500/50">
                        {getTotalExercises(workout)} {getTotalExercises(workout) === 1 ? 'exercise' : 'exercises'}
                      </span>
                    </div>
                    <p className="text-lg text-gray-400">
                      {formatDate(workout.timestamp)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {workout.exercises && workout.exercises.slice(0, 3).map((exercise, exIndex) => (
                        <span
                          key={exIndex}
                          className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium"
                        >
                          {exercise.exerciseName}
                        </span>
                      ))}
                      {workout.exercises && workout.exercises.length > 3 && (
                        <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium">
                          +{workout.exercises.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedWorkout(workout)}
                      className="text-amber-400 font-semibold text-lg hover:text-amber-300 transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={(e) => handleDeleteWorkout(index, e)}
                      className="px-4 py-2 bg-red-900/40 text-red-300 rounded-lg text-sm font-semibold hover:bg-red-800/50 border border-red-700/50 transition-colors min-h-[44px] flex items-center gap-2"
                      aria-label="Delete workout"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;

