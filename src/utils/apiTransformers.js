import { getNormalizedDaysArray } from './blockProgression';

/**
 * Transform frontend block data to backend API format
 */

const categoryMap = {
  'Squat': 'SQUAT',
  'Bench': 'BENCH',
  'Deadlift': 'DEADLIFT',
  'Accessory': 'ACCESSORY'
};

const tempoMap = {
  'Explosive': 'EXPLOSIVE',
  'Controlled': 'CONTROLLED'
};

const weekTypeMap = (weekNumber, blockLength) => {
  if (weekNumber === 1) return 'BASE';
  if (weekNumber === blockLength) return 'DELOAD';
  return 'PROGRESSION';
};

/**
 * Transform frontend exercise to backend format
 */
export const transformExercise = (exercise, orderInWorkout) => {
  const sets = exercise.Sets || 1;
  const prescribedSets = [];
  
  // Use nullish coalescing so 0 kg is preserved (|| would send null for 0)
  const loadMin = exercise.LoadMin ?? exercise.BaseLoadMin ?? null;
  const loadMax = exercise.LoadMax ?? exercise.BaseLoadMax ?? null;

  // Create a prescribed set for each set
  for (let i = 1; i <= sets; i++) {
    prescribedSets.push({
      setNumber: i,
      targetSets: sets,
      targetReps: exercise.Reps || 10,
      targetLoadMin: loadMin,
      targetLoadMax: loadMax,
      targetRPE: exercise.RPE || null,
      tempo: tempoMap[exercise.Tempo] || 'CONTROLLED',
      videoRequired: false
    });
  }
  
  return {
    name: exercise.Exercise,
    category: categoryMap[exercise.Category] || 'ACCESSORY',
    orderInWorkout,
    prescribedSets
  };
};

/**
 * Transform frontend week data to backend format
 */
export const transformWeeks = (weeks, blockLength, startDate = new Date()) => {
  return weeks.map((week, weekIndex) => {
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(weekStartDate.getDate() + (weekIndex * 7));
    
    const days = Object.keys(week.days).map((dayNum, dayIndex) => {
      const dayExercises = week.days[dayNum] || [];
      
      return {
        dayNumber: parseInt(dayNum, 10),
        dayName: `Day ${dayNum}`,
        restDay: dayExercises.length === 0,
        exercises: dayExercises.map((exercise, exIndex) => 
          transformExercise(exercise, exIndex + 1)
        )
      };
    });
    
    return {
      weekNumber: week.weekNumber,
      weekType: weekTypeMap(week.weekNumber, blockLength),
      startDate: weekStartDate.toISOString().split('T')[0], // YYYY-MM-DD format
      days
    };
  });
};

/**
 * Transform frontend block to backend API format
 */
export const transformBlockForAPI = (block) => {
  const startDate = block.startDate ? new Date(block.startDate) : new Date();
  
  return {
    blockLength: block.blockLength,
    progressionRate: block.progressionRate,
    deloadRate: block.deloadRate,
    weeks: transformWeeks(block.weeks, block.blockLength, startDate)
  };
};

/** Round weight to nearest 0.5 kg (e.g. 72.3 → 72.5, 72.7 → 72.5). */
function roundToNearestHalf(value) {
  if (value == null || !Number.isFinite(Number(value))) return value;
  return Math.round(Number(value) * 2) / 2;
}

/**
 * Get base load from an exercise (API format has prescribedSets, local has LoadMin/LoadMax).
 */
function getExerciseLoads(ex) {
  if (ex.prescribedSets && ex.prescribedSets.length > 0) {
    const ps = ex.prescribedSets[0];
    return { min: ps.targetLoadMin, max: ps.targetLoadMax, sets: ps.targetSets, reps: ps.targetReps, rpe: ps.targetRPE, tempo: ps.tempo };
  }
  const sets = ex.Sets ?? 1;
  const reps = ex.Reps ?? 10;
  return { min: ex.LoadMin ?? null, max: ex.LoadMax ?? null, sets, reps, rpe: ex.RPE ?? null, tempo: ex.Tempo ? (ex.Tempo === 'Explosive' ? 'EXPLOSIVE' : 'CONTROLLED') : 'CONTROLLED' };
}

/**
 * Build create-block payload from an existing block, with loads increased by a percentage.
 * Handles both API format (weeks[].days[] array, prescribedSets) and local format (week.days object, LoadMin/LoadMax).
 * @param {Object} apiBlock - Block from getBlock(id)
 * @param {number} loadIncreasePct - e.g. 10 for +10%
 * @returns {Object} Payload for createBlock()
 */
export const buildCopyBlockPayload = (apiBlock, loadIncreasePct = 0) => {
  const multiplier = 1 + Number(loadIncreasePct) / 100;
  const startDate = new Date();
  const weeks = (apiBlock.weeks || []).map((week, weekIndex) => {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + weekIndex * 7);
    const daysNormalized = getNormalizedDaysArray(week.days);
    const days = daysNormalized.map((day) => ({
      dayNumber: day.dayNumber,
      dayName: day.dayName || `Day ${day.dayNumber}`,
      restDay: day.restDay ?? (day.exercises && day.exercises.length === 0),
      exercises: (day.exercises || []).map((ex, exIndex) => {
        const base = getExerciseLoads(ex);
        const name = ex.name || ex.Exercise;
        const category = ex.category || ex.Category || 'ACCESSORY';
        const min = base.min != null ? roundToNearestHalf(Number(base.min) * multiplier) : null;
        const max = base.max != null ? roundToNearestHalf(Number(base.max) * multiplier) : null;
        const numSets = base.sets != null ? Number(base.sets) : 1;
        const prescribedSets = [];
        for (let i = 0; i < numSets; i++) {
          prescribedSets.push({
            setNumber: i + 1,
            targetSets: numSets,
            targetReps: base.reps != null ? Number(base.reps) : 10,
            targetLoadMin: min,
            targetLoadMax: max,
            targetRPE: base.rpe ?? null,
            tempo: base.tempo || 'CONTROLLED',
            videoRequired: false
          });
        }
        return {
          name,
          category,
          orderInWorkout: ex.orderInWorkout ?? exIndex + 1,
          prescribedSets
        };
      })
    }));
    return {
      weekNumber: week.weekNumber,
      weekType: week.weekType || weekTypeMap(week.weekNumber, apiBlock.blockLength),
      startDate: weekStart.toISOString().split('T')[0],
      days
    };
  });
  return {
    blockLength: apiBlock.blockLength,
    progressionRate: apiBlock.progressionRate,
    deloadRate: apiBlock.deloadRate,
    weeks
  };
};

/**
 * Build a block payload from legacy workoutsByDay (for standalone block)
 * One week, one day per key in workoutsByDay, exercises from each day
 */
export const buildStandaloneBlockFromWorkoutsByDay = (workoutsByDay) => {
  const dayNumbers = Object.keys(workoutsByDay)
    .map((d) => parseInt(d, 10))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  if (dayNumbers.length === 0) return null;
  const days = {};
  dayNumbers.forEach((d) => {
    days[d] = workoutsByDay[d] || [];
  });
  const block = {
    blockLength: 1,
    progressionRate: 0.075,
    deloadRate: 0.85,
    startDate: new Date(),
    weeks: [{ weekNumber: 1, days }]
  };
  return transformBlockForAPI(block);
};

