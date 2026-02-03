import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Home, History, ChevronLeft, Dumbbell, Loader2 } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { saveWorkoutLog, getTrainingBlock, updateTrainingBlock, saveWorkoutsByDay, getWorkoutLogs } from '../utils/workoutStorage';
import { getBlock, getWorkout, logWorkout, deleteExercise, ensureStandaloneBlock } from '../services/api';

const DayView = () => {
  const { workoutsByDay, setWorkoutsByDay, standaloneBlockId, setStandaloneBlockId } = useWorkout();
  const { blockId, weekNumber, dayNumber } = useParams();

  const day = parseInt(dayNumber, 10);
  const week = weekNumber ? parseInt(weekNumber, 10) : null;
  const isLegacyRoute = !blockId && dayNumber != null;
  const effectiveBlockId = blockId ? parseInt(blockId, 10) : (isLegacyRoute ? standaloneBlockId : null);
  const effectiveWeek = week ?? (isLegacyRoute ? 1 : null);
  const effectiveDay = day;

  // Block mode = we have a block (from URL or standalone) and use block API
  const isBlockMode = effectiveBlockId != null && effectiveWeek != null && effectiveDay != null;

  const [block, setBlock] = useState(null);

  // Legacy route: ensure standalone block exists (create from workoutsByDay if needed)
  useEffect(() => {
    if (!isLegacyRoute || !workoutsByDay || Object.keys(workoutsByDay).length === 0) return;
    ensureStandaloneBlock(workoutsByDay, standaloneBlockId).then((id) => {
      if (id != null) setStandaloneBlockId(id);
    });
  }, [isLegacyRoute, workoutsByDay, standaloneBlockId, setStandaloneBlockId]);

  // Load block when we have effectiveBlockId (from URL or standalone)
  useEffect(() => {
    if (!effectiveBlockId) return;
    const loadBlock = async () => {
      setIsLoadingBlock(true);
      try {
        const apiBlock = await getBlock(effectiveBlockId);
        if (apiBlock) {
          setBlock(apiBlock);
        } else {
          const localBlock = getTrainingBlock(effectiveBlockId);
          setBlock(localBlock);
        }
      } catch (err) {
        console.warn('Failed to load block from API, using localStorage:', err);
        const localBlock = getTrainingBlock(effectiveBlockId);
        setBlock(localBlock);
      } finally {
        setIsLoadingBlock(false);
      }
    };
    loadBlock();
  }, [effectiveBlockId]);

  // Load saved legacy workout from localStorage only when not using standalone block
  useEffect(() => {
    if (isBlockMode || (isLegacyRoute && standaloneBlockId) || !day || !workoutsByDay || !workoutsByDay[day]?.length) return;
    const logs = getWorkoutLogs();
    const dayLogs = logs.filter(
      (log) =>
        (log.day === day || log.dayNumber === day) &&
        (log.blockId == null || Number.isNaN(log.blockId))
    );
    if (dayLogs.length === 0) return;
    const mostRecent = dayLogs.sort(
      (a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)
    )[0];
    if (!mostRecent?.exercises?.length) return;
    const exercisesForDay = workoutsByDay[day] || [];
    const newCompleted = {};
    const newWorkoutLog = {};
    const newLogging = {};
    mostRecent.exercises.forEach((logEx, idx) => {
      const exIndex = exercisesForDay.findIndex(
        (ex) => (ex.Exercise || ex.name) === (logEx.exerciseName || logEx.name)
      );
      if (exIndex === -1) return;
      newCompleted[exIndex] = true;
      newLogging[exIndex] = true;
      const sets = (logEx.sets || logEx.actualSets || []).map((s) => ({
        weight: s.weight != null ? String(s.weight) : (s.actualWeight != null ? String(s.actualWeight) : ''),
        reps: s.reps != null ? String(s.reps) : (s.actualReps != null ? String(s.actualReps) : ''),
        rpe: s.rpe != null ? String(s.rpe) : (s.actualRPE != null ? String(s.actualRPE) : ''),
        completed: true
      }));
      newWorkoutLog[exIndex] = sets;
    });
    if (Object.keys(newCompleted).length === 0) return;
    setCompletedExercises((prev) => ({ ...prev, [day]: { ...(prev[day] || {}), ...newCompleted } }));
    setWorkoutLog((prev) => ({ ...prev, [day]: { ...(prev[day] || {}), ...newWorkoutLog } }));
    setLoggingExercises((prev) => ({ ...prev, [day]: { ...(prev[day] || {}), ...newLogging } }));
  }, [day, workoutsByDay, isBlockMode, isLegacyRoute, standaloneBlockId]);

  // Load saved workout from API so completed exercises/show state persist when reopening the day
  useEffect(() => {
    if (!isBlockMode || effectiveBlockId == null || effectiveWeek == null || effectiveDay == null || !block) return;
    const loadSavedWorkout = async () => {
      try {
        const saved = await getWorkout(effectiveBlockId, effectiveWeek, effectiveDay);
        if (!saved || !saved.exercises || saved.exercises.length === 0) return;
        const currentWeekData = block.weeks?.find(w => w.weekNumber === effectiveWeek);
        if (!currentWeekData) return;
        const daysArray = Array.isArray(currentWeekData.days)
          ? currentWeekData.days
          : currentWeekData.days && typeof currentWeekData.days === 'object'
            ? Object.values(currentWeekData.days).sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0))
            : [];
        const dayData = daysArray.find(d => d.dayNumber === effectiveDay);
        if (!dayData || !dayData.exercises) return;
        const exercisesForDay = dayData.exercises.map(normalizeExercise);
        const newCompleted = {};
        const newWorkoutLog = {};
        const newLogging = {};
        saved.exercises.forEach((apiEx) => {
          const exIndex = exercisesForDay.findIndex(
            (ex) => ex.id === apiEx.exerciseId || (ex.Exercise || ex.name) === apiEx.exerciseName
          );
          if (exIndex === -1) return;
          newCompleted[exIndex] = true;
          newLogging[exIndex] = true;
          const sets = (apiEx.actualSets || []).map((s) => ({
            weight: s.actualWeight != null ? String(s.actualWeight) : '',
            reps: s.actualReps != null ? String(s.actualReps) : '',
            rpe: s.actualRPE != null ? String(s.actualRPE) : '',
            completed: true
          }));
          newWorkoutLog[exIndex] = sets;
        });
        if (Object.keys(newCompleted).length === 0) return;
        setCompletedExercises((prev) => ({ ...prev, [day]: { ...(prev[day] || {}), ...newCompleted } }));
        setWorkoutLog((prev) => ({ ...prev, [day]: { ...(prev[day] || {}), ...newWorkoutLog } }));
        setLoggingExercises((prev) => ({ ...prev, [day]: { ...(prev[day] || {}), ...newLogging } }));
      } catch (err) {
        console.warn('Could not load saved workout for day:', err);
      }
    };
    loadSavedWorkout();
  }, [effectiveBlockId, effectiveWeek, effectiveDay, block, isBlockMode, day]);

  // State keyed by day number to maintain separate state for each day
  const [loggingExercises, setLoggingExercises] = useState({}); // { day: { exIndex: true } }
  const [workoutLog, setWorkoutLog] = useState({}); // { day: { exIndex: [sets] } }
  const [completedExercises, setCompletedExercises] = useState({}); // { day: { exIndex: true } }
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoadingBlock, setIsLoadingBlock] = useState(false);
  const [isSavingWorkout, setIsSavingWorkout] = useState(false);

  // Normalize exercise from API format to frontend format
  const normalizeExercise = (exercise) => {
    // If already in frontend format (localStorage), return as is
    if (exercise.Exercise || exercise.Sets) {
      return exercise;
    }
    
    // Convert from API format to frontend format
    // API format has prescribedSets array, frontend expects Sets/Reps/LoadMin/LoadMax/RPE
    const firstSet = exercise.prescribedSets && exercise.prescribedSets.length > 0 
      ? exercise.prescribedSets[0] 
      : null;
    
    return {
      id: exercise.id,
      Exercise: exercise.name,
      Sets: firstSet ? firstSet.targetSets : 0,
      Reps: firstSet ? firstSet.targetReps : 0,
      LoadMin: firstSet ? firstSet.targetLoadMin : null,
      LoadMax: firstSet ? firstSet.targetLoadMax : null,
      RPE: firstSet ? firstSet.targetRPE : null,
      Category: exercise.category,
      Tempo: firstSet ? (firstSet.tempo === 'EXPLOSIVE' ? 'Explosive' : 'Controlled') : 'Controlled',
      prescribedSets: exercise.prescribedSets // Keep for reference
    };
  };

  // Load exercises based on mode - computed from current state
  const getExercises = () => {
    if (isBlockMode && block) {
      const currentWeekData = block.weeks?.find(w => w.weekNumber === effectiveWeek);
      if (currentWeekData) {
        const daysArr = Array.isArray(currentWeekData.days)
          ? currentWeekData.days
          : currentWeekData.days && typeof currentWeekData.days === 'object'
            ? Object.values(currentWeekData.days).sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0))
            : [];
        const dayData = daysArr.find(d => d.dayNumber === effectiveDay);
        if (dayData && dayData.exercises) {
          return dayData.exercises.map(normalizeExercise);
        }
        return [];
      }
    } else if (workoutsByDay) {
      return workoutsByDay[effectiveDay] || [];
    }
    return [];
  };

  const getAllDays = () => {
    if (isBlockMode && block) {
      const currentWeekData = block.weeks?.find(w => w.weekNumber === effectiveWeek);
      if (currentWeekData) {
        const daysArr = Array.isArray(currentWeekData.days)
          ? currentWeekData.days
          : currentWeekData.days && typeof currentWeekData.days === 'object'
            ? Object.values(currentWeekData.days).sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0))
            : [];
        return daysArr.map(d => d.dayNumber).sort((a, b) => a - b);
      }
    } else if (workoutsByDay) {
      return Object.keys(workoutsByDay)
        .map((d) => parseInt(d, 10))
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

  // Helper function to get previous week's workout data for comparison
  const getPreviousWeekData = (exerciseName, currentWeekNum, currentDayNum, currentBlockId) => {
    if (!currentWeekNum || currentWeekNum <= 1 || !currentBlockId) {
      return null; // No previous week or not in block mode
    }

    const previousWeekNum = currentWeekNum - 1;
    const allLogs = getWorkoutLogs();
    
    // Find previous week's workout for the same day and block
    const previousWorkout = allLogs.find(log => {
      // Handle both 'week' and 'weekNumber' field names
      const logWeek = log.week || log.weekNumber;
      // Handle both 'day' and 'dayNumber' field names
      const logDay = log.day || log.dayNumber;
      const logBlockId = log.blockId;
      
      return logWeek === previousWeekNum && 
             logDay === currentDayNum && 
             logBlockId === currentBlockId;
    });

    if (!previousWorkout || !previousWorkout.exercises) {
      return null;
    }

    // Find the matching exercise by name
    // Handle both 'exerciseName' and 'name' field names
    const previousExercise = previousWorkout.exercises.find(ex => {
      const exName = ex.exerciseName || ex.name;
      return exName === exerciseName;
    });

    if (!previousExercise) {
      return null;
    }

    // Handle both 'sets' and 'actualSets' field names
    const sets = previousExercise.sets || previousExercise.actualSets || [];
    
    if (sets.length === 0) {
      return null;
    }

    // Calculate averages from all sets
    const validSets = sets.filter(set => 
      set.weight !== null && set.weight !== undefined && set.weight !== '' &&
      set.reps !== null && set.reps !== undefined && set.reps !== ''
    );

    if (validSets.length === 0) {
      return null;
    }

    const totalWeight = validSets.reduce((sum, set) => sum + parseFloat(set.weight), 0);
    const totalReps = validSets.reduce((sum, set) => sum + parseFloat(set.reps), 0);
    const totalRPE = validSets
      .filter(set => set.rpe !== null && set.rpe !== undefined && set.rpe !== '')
      .reduce((sum, set) => sum + parseFloat(set.rpe), 0);
    const rpeCount = validSets.filter(set => set.rpe !== null && set.rpe !== undefined && set.rpe !== '').length;

    return {
      avgWeight: totalWeight / validSets.length,
      avgReps: totalReps / validSets.length,
      avgRPE: rpeCount > 0 ? totalRPE / rpeCount : null,
      weekNumber: previousWeekNum
    };
  };
  
  // Check if we have data to display
  if (!isBlockMode && !workoutsByDay) {
    return (
      <div className="min-h-screen bg-gray-900 pb-24">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
          <div className="flex flex-wrap gap-4 mb-6">
            <Link
              to="/"
              className="text-amber-400 hover:text-amber-300 font-medium text-base py-2 px-1 min-h-[44px] flex items-center gap-2"
            >
              <Home className="w-5 h-5" /> Home
            </Link>
            <Link
              to="/blocks"
              className="text-gray-300 hover:text-gray-200 font-medium text-base py-2 px-1 min-h-[44px] flex items-center"
            >
              Blocks
            </Link>
            <Link
              to="/history"
              className="text-gray-300 hover:text-gray-200 font-medium text-base py-2 px-1 min-h-[44px] flex items-center gap-2"
            >
              <History className="w-5 h-5" /> History
            </Link>
          </div>
          <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8 text-center">
            <h1 className="text-4xl font-bold text-gray-100 mb-2">No workout data</h1>
            <p className="text-lg text-gray-400 mb-4">Please create a training block or upload a CSV file.</p>
            <Link
              to="/blocks"
              className="inline-block px-6 py-3 bg-amber-500 text-gray-900 rounded-xl font-bold text-base hover:bg-amber-400 transition-colors"
            >
              Create Training Block
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (effectiveBlockId != null && !block) {
    return (
      <div className="min-h-screen bg-gray-900 pb-24">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
          <Link
            to={isLegacyRoute ? '/' : '/blocks'}
            className="inline-flex items-center gap-2 mb-6 text-amber-400 hover:text-amber-300 font-medium text-base py-2 px-1 min-h-[44px]"
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </Link>
          <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8 text-center">
            {isLoadingBlock ? (
              <p className="text-lg text-gray-400 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading...
              </p>
            ) : (
              <>
                <h1 className="text-4xl font-bold text-gray-100 mb-2">Block not found</h1>
                <p className="text-lg text-gray-400">The requested training block does not exist.</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 pb-24">
        {/* Day Tabs - Sticky at top */}
        <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 shadow-sm">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide py-3">
              {allDays.map((d) => (
                <Link
                  key={d}
                  to={`/day/${d}`}
                  className={`flex-shrink-0 px-5 py-3 rounded-xl font-bold text-base transition-all min-h-[44px] flex items-center justify-center ${
                    d === day
                      ? 'bg-amber-500 text-gray-900 shadow-lg scale-105'
                      : 'bg-gray-700 text-gray-300 active:bg-gray-600'
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
              className="text-amber-400 hover:text-amber-300 font-medium text-base py-2 px-1 min-h-[44px] flex items-center gap-2"
            >
              <Home className="w-5 h-5" /> Home
            </Link>
            <Link
              to="/history"
              className="text-gray-300 hover:text-gray-200 font-medium text-base py-2 px-1 min-h-[44px] flex items-center gap-2"
            >
              <History className="w-5 h-5" /> History
            </Link>
          </div>
          <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8 text-center">
            <h1 className="text-4xl font-bold text-gray-100 mb-2">
              {isBlockMode
                ? (effectiveBlockId === standaloneBlockId ? `My Workouts - Day ${effectiveDay}` : `Block ${effectiveBlockId} - Week ${effectiveWeek} - Day ${effectiveDay}`)
                : `Day ${effectiveDay}`}
            </h1>
            <p className="text-lg text-gray-400">No exercises found for this day.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pb-24">
      {/* Day Tabs - Sticky at top with backdrop blur for better visibility */}
      <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide py-3">
            {allDays.map((d) => (
              <Link
                key={d}
                to={isBlockMode 
                  ? `/block/${effectiveBlockId}/week/${effectiveWeek}/day/${d}`
                  : `/day/${d}`
                }
                className={`flex-shrink-0 px-5 py-3 rounded-xl font-bold text-base transition-all min-h-[44px] flex items-center justify-center ${
                  d === day
                    ? 'bg-amber-500 text-gray-900 shadow-lg scale-105'
                    : 'bg-gray-700 text-gray-300 active:bg-gray-600'
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
                to={effectiveBlockId === standaloneBlockId ? '/' : '/blocks'}
                className="text-amber-400 hover:text-amber-300 font-medium text-base py-2 px-1 min-h-[44px] flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                {effectiveBlockId === standaloneBlockId ? 'Home' : 'Blocks'}
              </Link>
              {effectiveBlockId !== standaloneBlockId && (
                <Link
                  to={`/block/${effectiveBlockId}`}
                  className="text-gray-300 hover:text-gray-200 font-medium text-base py-2 px-1 min-h-[44px] flex items-center"
                >
                  Week {effectiveWeek}
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                to="/"
                className="text-amber-400 hover:text-amber-300 font-medium text-base py-2 px-1 min-h-[44px] flex items-center gap-2"
              >
                <Home className="w-5 h-5" /> Home
              </Link>
            </>
          )}
          <Link
            to="/history"
            className="text-gray-300 hover:text-gray-200 font-medium text-base py-2 px-1 min-h-[44px] flex items-center gap-2"
          >
            <History className="w-5 h-5" /> History
          </Link>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-xl text-red-300">
            {error}
          </div>
        )}

        {/* Loading Indicator for Block */}
        {isLoadingBlock && isBlockMode && (
          <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading block data...
          </div>
        )}

        {/* Day Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-100 mb-2 flex items-center gap-3">
            <Dumbbell className="w-9 h-9 text-amber-500" />
            {isBlockMode
              ? (effectiveBlockId === standaloneBlockId ? `My Workouts - Day ${effectiveDay}` : `Block ${effectiveBlockId} - Week ${effectiveWeek} - Day ${effectiveDay}`)
              : `Day ${day}`}
          </h1>
          {isBlockMode && block && effectiveBlockId !== standaloneBlockId && (
            <p className="text-base text-gray-500 mb-2">
              {effectiveWeek === block.blockLength ? 'Deload Week' : effectiveWeek === 1 ? 'Base Week' : `Progression Week ${effectiveWeek - 1}`}
            </p>
          )}
          <p className="text-lg text-gray-400">{exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}</p>
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
                className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6 sm:p-8 active:shadow-lg transition-all"
              >
                {/* Exercise Name and Delete Button */}
                <div className="flex items-start justify-between mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-100 leading-tight flex-1">
                    {exercise.Exercise || exercise.name}
                  </h2>
                  <button
                    onClick={async () => {
                      if (!window.confirm(`Delete "${exercise.Exercise || exercise.name}" from this day?`)) return;
                      try {
                        if (isBlockMode && block) {
                          // Collect exercise IDs for this (day, exIndex) across all weeks (backend has one exercise per week/day)
                          const weeksArray = block.weeks || [];
                          const exerciseIdsToDelete = [];
                          for (const w of weeksArray) {
                            const daysArray = Array.isArray(w.days) ? w.days : (w.days && typeof w.days === 'object' ? Object.values(w.days).sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0)) : []);
                            const dayData = daysArray.find(d => d.dayNumber === day);
                            const ex = dayData?.exercises?.[exIndex];
                            if (ex?.id) exerciseIdsToDelete.push(ex.id);
                          }
                          if (exerciseIdsToDelete.length > 0) {
                            for (const id of exerciseIdsToDelete) {
                              await deleteExercise(id);
                            }
                          }
                          // Update local block: remove exercise at exIndex from this day in all weeks
                          const updatedBlock = JSON.parse(JSON.stringify(block));
                          (updatedBlock.weeks || []).forEach(w => {
                            const daysArr = Array.isArray(w.days) ? w.days : (w.days && typeof w.days === 'object' ? Object.values(w.days).sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0)) : []);
                            const dayData = daysArr.find(d => d.dayNumber === day);
                            if (dayData && dayData.exercises) {
                              dayData.exercises = dayData.exercises.filter((_, idx) => idx !== exIndex);
                            }
                          });
                          updateTrainingBlock(updatedBlock);
                          setBlock(updatedBlock);
                        } else if (workoutsByDay) {
                          // Legacy mode: remove from workoutsByDay only
                          const updatedWorkoutsByDay = { ...workoutsByDay };
                          if (updatedWorkoutsByDay[day]) {
                            updatedWorkoutsByDay[day] = updatedWorkoutsByDay[day].filter((_, idx) => idx !== exIndex);
                            if (updatedWorkoutsByDay[day].length === 0) delete updatedWorkoutsByDay[day];
                            saveWorkoutsByDay(updatedWorkoutsByDay);
                            setWorkoutsByDay(updatedWorkoutsByDay);
                          }
                        }
                      } catch (err) {
                        setError(err.message || 'Failed to delete exercise. Is the backend running?');
                        setTimeout(() => setError(''), 5000);
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
                        <span className="text-2xl sm:text-3xl font-bold text-gray-100 leading-tight">
                          {exercise.Sets} sets × {exercise.Reps} reps
                        </span>
                      </div>

                      {/* Load Range */}
                      {loadRange && (
                        <div className="flex flex-col">
                          <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Load Range
                          </span>
                          <span className="text-2xl sm:text-3xl font-bold text-gray-100 leading-tight">
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
                          <span className="text-2xl sm:text-3xl font-bold text-gray-100 leading-tight">
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
                      className="w-full px-6 py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-500 active:bg-emerald-700 transition-colors shadow-md min-h-[56px]"
                    >
                      Start Exercise
                    </button>
                  </div>
                ) : (
                  /* Workout Logging Mode */
                  <div className={`space-y-4 ${currentDayCompleted[exIndex] ? 'opacity-75' : ''}`}>
                    <div className={`mb-4 pb-4 border-b ${currentDayCompleted[exIndex] ? 'border-emerald-500/50' : 'border-gray-600'} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4`}>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                          Target: {exercise.Sets} sets × {exercise.Reps} reps
                          {loadRange && ` | ${loadRange}`}
                        </span>
                        {currentDayCompleted[exIndex] && (
                          <span className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center gap-1.5">
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
                            className="px-5 py-3 text-base bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 font-bold min-h-[48px] shadow-md"
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
                          className="px-5 py-3 text-base bg-gray-600 text-gray-200 rounded-xl hover:bg-gray-500 font-bold min-h-[48px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                    {/* Last Week Comparison */}
                    {(() => {
                      if (!isBlockMode || effectiveWeek == null || effectiveWeek <= 1) {
                        return null; // Only show for block mode, week 2+
                      }

                      const previousWeekData = getPreviousWeekData(exercise.Exercise || exercise.name, effectiveWeek, effectiveDay, effectiveBlockId);
                      
                      if (!previousWeekData) {
                        return null; // No previous week data found
                      }

                      // Calculate prescribed load midpoint for comparison
                      const prescribedMidpoint = exercise.LoadMin && exercise.LoadMax
                        ? (parseFloat(exercise.LoadMin) + parseFloat(exercise.LoadMax)) / 2
                        : exercise.LoadMin
                        ? parseFloat(exercise.LoadMin)
                        : exercise.LoadMax
                        ? parseFloat(exercise.LoadMax)
                        : null;

                      if (prescribedMidpoint === null) {
                        return null; // No prescribed load to compare
                      }

                      const diff = prescribedMidpoint - previousWeekData.avgWeight;
                      const percent = previousWeekData.avgWeight > 0 
                        ? ((diff / previousWeekData.avgWeight) * 100).toFixed(1)
                        : 0;
                      const absDiff = Math.abs(diff);

                      // Determine progress indicator
                      let progressIndicator = null;
                      if (Math.abs(diff) < 0.01) {
                        // Same load (within 0.01kg tolerance)
                        progressIndicator = (
                          <span className="text-gray-400 font-semibold">→ Same load</span>
                        );
                      } else if (diff > 0) {
                        // Increased load
                        progressIndicator = (
                          <span className="text-green-600 font-semibold">
                            ↗️ +{absDiff.toFixed(1)}kg (+{percent}%)
                          </span>
                        );
                      } else {
                        // Decreased load (deload)
                        progressIndicator = (
                          <span className="text-orange-600 font-semibold">
                            ↘️ -{absDiff.toFixed(1)}kg (Deload)
                          </span>
                        );
                      }

                      return (
                        <div className="mb-4 p-4 bg-gray-700/50 border border-gray-600 rounded-xl">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">📊</span>
                            <span className="text-sm font-bold text-gray-300 uppercase tracking-wide">
                              LAST WEEK (Week {previousWeekData.weekNumber})
                            </span>
                          </div>
                          <div className="mb-3">
                            <p className="text-base text-gray-300">
                              You did: <span className="font-semibold">{previousWeekData.avgWeight.toFixed(1)}kg</span> × <span className="font-semibold">{previousWeekData.avgReps.toFixed(1)}</span> reps
                              {previousWeekData.avgRPE !== null && (
                                <span>, RPE <span className="font-semibold">{previousWeekData.avgRPE.toFixed(1)}</span></span>
                              )}
                            </p>
                          </div>
                          <div className="pt-2 border-t border-gray-300">
                            {progressIndicator}
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Sets Input Fields */}
                    <div className="space-y-5">
                      {sets.map((set, setIndex) => (
                        <div
                          key={setIndex}
                          className={`p-5 sm:p-6 rounded-xl border-2 transition-all ${
                            currentDayCompleted[exIndex]
                              ? 'bg-emerald-900/40 border-emerald-500/50'
                              : set.completed
                              ? 'bg-emerald-900/30 border-emerald-600/50'
                              : 'bg-gray-700/50 border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-xl font-bold text-gray-300">
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
                              <span className="text-base font-semibold text-gray-300">Complete</span>
                            </label>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            {/* Weight Input - text so user can clear and type in one action */}
                            <div className="flex flex-col">
                              <label className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 h-[32px] flex items-end">
                                <span className="leading-tight">Weight (kg)</span>
                              </label>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={set.weight != null && set.weight !== '' ? String(set.weight) : ''}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (v !== '' && !/^\d*\.?\d*$/.test(v)) return;
                                  const updatedLog = { ...workoutLog };
                                  if (!updatedLog[day]) updatedLog[day] = {};
                                  if (!updatedLog[day][exIndex]) updatedLog[day][exIndex] = [...sets];
                                  updatedLog[day][exIndex][setIndex].weight = v;
                                  setWorkoutLog(updatedLog);
                                }}
                                disabled={currentDayCompleted[exIndex]}
                                placeholder="0"
                                className={`w-full px-4 py-3 text-xl font-semibold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[56px] ${
                                  currentDayCompleted[exIndex] ? 'bg-gray-600 cursor-not-allowed opacity-60' : 'bg-gray-700'
                                }`}
                              />
                            </div>

                            {/* Reps Input - text so user can clear and type in one action */}
                            <div className="flex flex-col">
                              <label className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 h-[32px] flex items-end">
                                <span className="leading-tight">Reps</span>
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={set.reps != null && set.reps !== '' ? String(set.reps) : ''}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (v !== '' && !/^\d*$/.test(v)) return;
                                  const updatedLog = { ...workoutLog };
                                  if (!updatedLog[day]) updatedLog[day] = {};
                                  if (!updatedLog[day][exIndex]) updatedLog[day][exIndex] = [...sets];
                                  updatedLog[day][exIndex][setIndex].reps = v;
                                  setWorkoutLog(updatedLog);
                                }}
                                disabled={currentDayCompleted[exIndex]}
                                placeholder="0"
                                className={`w-full px-4 py-3 text-xl font-semibold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[56px] ${
                                  currentDayCompleted[exIndex] ? 'bg-gray-600 cursor-not-allowed opacity-60' : 'bg-gray-700'
                                }`}
                              />
                            </div>

                            {/* RPE Input - text so user can clear and type in one action */}
                            <div className="flex flex-col">
                              <label className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 h-[32px] flex items-end">
                                <span className="leading-tight">RPE</span>
                              </label>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={set.rpe != null && set.rpe !== '' ? String(set.rpe) : ''}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (v !== '' && !/^\d*\.?\d*$/.test(v)) return;
                                  const num = parseFloat(v);
                                  if (v !== '' && (Number.isNaN(num) || num < 1 || num > 10)) return;
                                  const updatedLog = { ...workoutLog };
                                  if (!updatedLog[day]) updatedLog[day] = {};
                                  if (!updatedLog[day][exIndex]) updatedLog[day][exIndex] = [...sets];
                                  updatedLog[day][exIndex][setIndex].rpe = v;
                                  setWorkoutLog(updatedLog);
                                }}
                                disabled={currentDayCompleted[exIndex]}
                                placeholder="1-10"
                                className={`w-full px-4 py-3 text-xl font-semibold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[56px] ${
                                  currentDayCompleted[exIndex] ? 'bg-gray-600 cursor-not-allowed opacity-60' : 'bg-gray-700'
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
              className="flex-1 px-6 py-5 bg-gray-600 text-gray-200 rounded-xl font-bold text-lg hover:bg-gray-500 active:bg-gray-400 transition-colors min-h-[56px] shadow-md"
            >
              Cancel All
            </button>
            <button
              onClick={async () => {
                // Prepare workout log data - only include exercises that were logged and completed
                const loggedExercises = exercises
                  .map((exercise, exIndex) => {
                    if (currentDayWorkoutLog[exIndex] && currentDayWorkoutLog[exIndex].length > 0 && currentDayCompleted[exIndex]) {
                      return {
                        exerciseId: exercise.id, // From API block (may be undefined for localStorage blocks)
                        exerciseName: exercise.Exercise || exercise.name,
                        sets: currentDayWorkoutLog[exIndex],
                        index: exIndex
                      };
                    }
                    return null;
                  })
                  .filter(ex => ex !== null);

                if (loggedExercises.length === 0) {
                  setError('Please complete at least one exercise');
                  return;
                }

                if (!isBlockMode) {
                  setError('Workout logging requires a training block');
                  return;
                }

                setIsSavingWorkout(true);
                setError('');

                try {
                  // Check if all exercises have IDs (required for API)
                  const allExercisesHaveIds = loggedExercises.every(ex => ex.exerciseId);
                  
                  if (allExercisesHaveIds) {
                    // Transform for API format
                    const workoutForAPI = {
                      blockId: effectiveBlockId,
                      weekNumber: effectiveWeek,
                      dayNumber: effectiveDay,
                      exercises: loggedExercises.map(ex => ({
                        exerciseId: ex.exerciseId,
                        actualSets: ex.sets.map((set, setIndex) => ({
                          setNumber: setIndex + 1,
                          actualWeight: set.weight ? parseFloat(set.weight) : null,
                          actualReps: set.reps ? parseInt(set.reps, 10) : null,
                          actualRPE: set.rpe ? parseInt(set.rpe, 10) : null,
                          tempoUsed: null,
                          videoRecorded: false,
                          feedback: null
                        }))
                      }))
                    };

                    // Try API first
                    try {
                      await logWorkout(workoutForAPI);
                    } catch (apiError) {
                      console.warn('API call failed, using localStorage fallback:', apiError);
                      // Fallback to localStorage
                      const completedWorkout = {
                        day,
                        timestamp: new Date().toISOString(),
                        exercises: loggedExercises.map(ex => ({
                          exerciseName: ex.exerciseName,
                          sets: ex.sets
                        })),
                        blockId: effectiveBlockId,
                        week: effectiveWeek
                      };
                      saveWorkoutLog(completedWorkout);
                      setError('Warning: Saved to local storage only. API unavailable.');
                      setTimeout(() => setError(''), 5000);
                    }
                  } else {
                    // No exercise IDs - use localStorage only (legacy or block from localStorage)
                    const completedWorkout = {
                      day,
                      timestamp: new Date().toISOString(),
                      exercises: loggedExercises.map(ex => ({
                        exerciseName: ex.exerciseName,
                        sets: ex.sets
                      })),
                      ...(isBlockMode && effectiveBlockId != null && { blockId: effectiveBlockId, week: effectiveWeek })
                    };
                    saveWorkoutLog(completedWorkout);
                  }

                  // Refresh UI: show workout as completed (re-fetch from API or apply from just-saved data)
                  const applyCompletedFromApi = (saved) => {
                    if (!saved?.exercises?.length) return false;
                    const currentWeekData = block.weeks?.find(w => w.weekNumber === effectiveWeek);
                    if (!currentWeekData) return false;
                    const daysArray = Array.isArray(currentWeekData.days)
                      ? currentWeekData.days
                      : currentWeekData.days && typeof currentWeekData.days === 'object'
                        ? Object.values(currentWeekData.days).sort((a, b) => (a.dayNumber || 0) - (b.dayNumber || 0))
                        : [];
                    const dayData = daysArray.find(d => d.dayNumber === effectiveDay);
                    if (!dayData?.exercises) return false;
                    const exercisesForDay = dayData.exercises.map(normalizeExercise);
                    const newCompleted = {};
                    const newWorkoutLog = {};
                    const newLogging = {};
                    saved.exercises.forEach((apiEx) => {
                      const exIdx = exercisesForDay.findIndex(
                        (ex) => ex.id === apiEx.exerciseId || (ex.Exercise || ex.name) === apiEx.exerciseName
                      );
                      if (exIdx === -1) return;
                      newCompleted[exIdx] = true;
                      newLogging[exIdx] = true;
                      newWorkoutLog[exIdx] = (apiEx.actualSets || []).map((s) => ({
                        weight: s.actualWeight != null ? String(s.actualWeight) : '',
                        reps: s.actualReps != null ? String(s.actualReps) : '',
                        rpe: s.actualRPE != null ? String(s.actualRPE) : '',
                        completed: true
                      }));
                    });
                    setCompletedExercises((prev) => ({ ...prev, [day]: { ...(prev[day] || {}), ...newCompleted } }));
                    setWorkoutLog((prev) => ({ ...prev, [day]: { ...(prev[day] || {}), ...newWorkoutLog } }));
                    setLoggingExercises((prev) => ({ ...prev, [day]: { ...(prev[day] || {}), ...newLogging } }));
                    return true;
                  };
                  const applyCompletedFromLogged = () => {
                    const newCompleted = {};
                    const newWorkoutLog = {};
                    const newLogging = {};
                    loggedExercises.forEach((ex) => {
                      newCompleted[ex.index] = true;
                      newLogging[ex.index] = true;
                      newWorkoutLog[ex.index] = (ex.sets || []).map((s) => ({
                        weight: s.weight ?? '',
                        reps: s.reps ?? '',
                        rpe: s.rpe ?? '',
                        completed: true
                      }));
                    });
                    setCompletedExercises((prev) => ({ ...prev, [day]: { ...(prev[day] || {}), ...newCompleted } }));
                    setWorkoutLog((prev) => ({ ...prev, [day]: { ...(prev[day] || {}), ...newWorkoutLog } }));
                    setLoggingExercises((prev) => ({ ...prev, [day]: { ...(prev[day] || {}), ...newLogging } }));
                  };
                  if (allExercisesHaveIds) {
                    try {
                      const saved = await getWorkout(effectiveBlockId, effectiveWeek, effectiveDay);
                      if (!applyCompletedFromApi(saved)) applyCompletedFromLogged();
                    } catch (refreshErr) {
                      console.warn('Could not refresh saved workout:', refreshErr);
                      applyCompletedFromLogged();
                    }
                  } else {
                    applyCompletedFromLogged();
                  }

                  // Show success message
                  setShowSuccess(true);
                  setTimeout(() => setShowSuccess(false), 3000);
                } catch (err) {
                  setError(`Error saving workout: ${err.message}`);
                } finally {
                  setIsSavingWorkout(false);
                }
              }}
              disabled={isSavingWorkout}
              className="flex-1 px-6 py-5 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-500 active:bg-emerald-700 transition-colors shadow-lg min-h-[56px] disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isSavingWorkout ? 'Saving...' : 'Complete Workout'}
            </button>
          </div>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8 max-w-md w-full text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-3xl font-bold text-gray-100 mb-2">Workout Complete!</h2>
              <p className="text-lg text-gray-400">Your workout has been saved successfully.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DayView;

