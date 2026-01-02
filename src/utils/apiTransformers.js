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
  
  // Create a prescribed set for each set
  for (let i = 1; i <= sets; i++) {
    prescribedSets.push({
      setNumber: i,
      targetSets: sets,
      targetReps: exercise.Reps || 10,
      targetLoadMin: exercise.LoadMin || exercise.BaseLoadMin || null,
      targetLoadMax: exercise.LoadMax || exercise.BaseLoadMax || null,
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

