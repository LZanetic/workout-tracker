/**
 * Utility functions for calculating progressive overload across training blocks
 */

/**
 * Rounds a weight to the nearest 2.5kg increment (practical gym increment)
 * @param {number} weight - Weight in kg
 * @returns {number} Rounded weight
 */
export const roundToNearestIncrement = (weight, increment = 2.5) => {
  return Math.round(weight / increment) * increment;
};

/**
 * Calculates progressive overload for a given week
 * @param {number} baseWeight - Starting weight from Week 1
 * @param {number} weekNumber - Week number (1-6)
 * @param {number} progressionRate - Weekly progression rate (default 0.075 = 7.5%)
 * @param {number} deloadRate - Deload percentage of Week 1 (default 0.85 = 85%)
 * @param {number} blockLength - Total weeks in block (4, 5, or 6)
 * @returns {number} Calculated weight for the week
 */
export const calculateWeekWeight = (baseWeight, weekNumber, progressionRate, deloadRate, blockLength) => {
  if (weekNumber === 1) {
    return baseWeight;
  }

  // Last week is deload
  if (weekNumber === blockLength) {
    return roundToNearestIncrement(baseWeight * deloadRate);
  }

  // Progressive weeks: Week 2 = Week 1 × (1 + progressionRate), etc.
  const progressionMultiplier = Math.pow(1 + progressionRate, weekNumber - 1);
  return roundToNearestIncrement(baseWeight * progressionMultiplier);
};

/**
 * Generates all weeks for a training block based on Week 1 data
 * @param {Object} week1Data - Week 1 workout data
 * @param {number} blockLength - Number of weeks (4, 5, or 6)
 * @param {number} progressionRate - Weekly progression percentage (default 0.075)
 * @param {number} deloadRate - Deload percentage (default 0.85)
 * @returns {Array} Array of week objects
 */
export const generateBlockWeeks = (week1Data, blockLength, progressionRate = 0.075, deloadRate = 0.85) => {
  const weeks = [];

  for (let weekNum = 1; weekNum <= blockLength; weekNum++) {
    const week = {
      weekNumber: weekNum,
      days: {}
    };

    // Process each day from Week 1
    Object.keys(week1Data).forEach(dayNum => {
      const dayExercises = week1Data[dayNum];
      week.days[dayNum] = dayExercises.map(exercise => {
        const newExercise = { ...exercise };

        // Calculate new loads for this week
        if (exercise.BaseLoadMin) {
          newExercise.LoadMin = calculateWeekWeight(
            exercise.BaseLoadMin,
            weekNum,
            progressionRate,
            deloadRate,
            blockLength
          );
        }

        if (exercise.BaseLoadMax) {
          newExercise.LoadMax = calculateWeekWeight(
            exercise.BaseLoadMax,
            weekNum,
            progressionRate,
            deloadRate,
            blockLength
          );
        }

        // Remove BaseLoadMin/BaseLoadMax as they're only for Week 1
        delete newExercise.BaseLoadMin;
        delete newExercise.BaseLoadMax;

        return newExercise;
      });
    });

    weeks.push(week);
  }

  return weeks;
};

