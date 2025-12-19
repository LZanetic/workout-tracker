/**
 * Parses a CSV string for Week 1 base program and returns structured data
 * Expected format: Day,Exercise,Sets,Reps,BaseLoadMin,BaseLoadMax,RPE
 * @param {string} csvText - The CSV file content as text
 * @returns {Object} - Object with days as keys and arrays of exercises as values
 */
export const parseBlockCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim());
  
  // Expected headers: Day,Exercise,Sets,Reps,BaseLoadMin,BaseLoadMax,RPE
  const expectedHeaders = ['Day', 'Exercise', 'Sets', 'Reps', 'BaseLoadMin', 'BaseLoadMax', 'RPE'];
  const hasAllHeaders = expectedHeaders.every(h => headers.includes(h));
  
  if (!hasAllHeaders) {
    throw new Error(`CSV must contain all required headers: ${expectedHeaders.join(', ')}`);
  }

  // Parse data rows
  const workoutsByDay = {};
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());
    
    if (values.length !== headers.length) {
      console.warn(`Skipping row ${i + 1}: incorrect number of columns`);
      continue;
    }

    const workout = {};
    headers.forEach((header, index) => {
      const value = values[index];
      
      // Convert numeric fields
      if (['Day', 'Sets', 'Reps', 'BaseLoadMin', 'BaseLoadMax', 'RPE'].includes(header)) {
        workout[header] = value === '' ? null : Number(value);
      } else {
        workout[header] = value;
      }
    });

    const day = workout.Day;
    if (!workoutsByDay[day]) {
      workoutsByDay[day] = [];
    }
    workoutsByDay[day].push(workout);
  }

  return workoutsByDay;
};

