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

/**
 * Build create-block payload from an existing API block, with loads increased by a percentage.
 * @param {Object} apiBlock - Block from getBlock(id) (weeks[].days[] = array, exercises[].prescribedSets[])
 * @param {number} loadIncreasePct - e.g. 10 for +10%
 * @returns {Object} Payload for createBlock()
 */
export const buildCopyBlockPayload = (apiBlock, loadIncreasePct = 0) => {
  const multiplier = 1 + Number(loadIncreasePct) / 100;
  const startDate = new Date();
  const weeks = (apiBlock.weeks || []).map((week, weekIndex) => {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + weekIndex * 7);
    const days = (week.days || []).map((day) => ({
      dayNumber: day.dayNumber,
      dayName: day.dayName || `Day ${day.dayNumber}`,
      restDay: day.restDay ?? false,
      exercises: (day.exercises || []).map((ex, exIndex) => ({
        name: ex.name,
        category: ex.category || 'ACCESSORY',
        orderInWorkout: ex.orderInWorkout ?? exIndex + 1,
        prescribedSets: (ex.prescribedSets || []).map((ps, setIndex) => {
          const min = ps.targetLoadMin != null ? Number(ps.targetLoadMin) * multiplier : null;
          const max = ps.targetLoadMax != null ? Number(ps.targetLoadMax) * multiplier : null;
          return {
            setNumber: ps.setNumber != null ? Number(ps.setNumber) : setIndex + 1,
            targetSets: ps.targetSets != null ? ps.targetSets : 1,
            targetReps: ps.targetReps != null ? ps.targetReps : 10,
            targetLoadMin: min,
            targetLoadMax: max,
            targetRPE: ps.targetRPE ?? null,
            tempo: ps.tempo || 'CONTROLLED',
            videoRequired: ps.videoRequired ?? false
          };
        })
      }))
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

