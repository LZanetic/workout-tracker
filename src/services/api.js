const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

/**
 * Create a new training block with all weeks
 * @param {Object} blockData - Block data with weeks structure
 * @returns {Promise<Object>} Created block
 */
export const createBlock = async (blockData) => {
  try {
    const response = await fetch(`${API_URL}/blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blockData)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create block: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('API Error - createBlock:', error);
    throw error;
  }
};

/**
 * Get all training blocks
 * @returns {Promise<Array>} Array of block data
 */
export const getAllBlocks = async () => {
  try {
    const response = await fetch(`${API_URL}/blocks`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch blocks: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('API Error - getAllBlocks:', error);
    throw error;
  }
};

/**
 * Get a training block by ID
 * @param {number} blockId - Block ID
 * @returns {Promise<Object>} Block data
 */
export const getBlock = async (blockId) => {
  try {
    const response = await fetch(`${API_URL}/blocks/${blockId}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch block: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('API Error - getBlock:', error);
    throw error;
  }
};

/**
 * Log a completed workout
 * @param {Object} workoutData - Workout data
 * @returns {Promise<Object>} Saved workout
 */
export const logWorkout = async (workoutData) => {
  try {
    const response = await fetch(`${API_URL}/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workoutData)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to log workout: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('API Error - logWorkout:', error);
    throw error;
  }
};

/**
 * Get a specific logged workout
 * @param {number} blockId - Block ID
 * @param {number} weekNumber - Week number
 * @param {number} dayNumber - Day number
 * @returns {Promise<Object|null>} Workout data or null if not found
 */
export const getWorkout = async (blockId, weekNumber, dayNumber) => {
  try {
    const response = await fetch(
      `${API_URL}/workouts?blockId=${blockId}&weekNumber=${weekNumber}&dayNumber=${dayNumber}`
    );
    if (!response.ok) {
      if (response.status === 404) return null;
      return null; // No workout logged yet
    }
    return response.json();
  } catch (error) {
    console.error('API Error - getWorkout:', error);
    return null; // Return null on error (workout may not exist)
  }
};

/**
 * Get all completed workouts for a block (progress)
 * @param {number} blockId - Block ID
 * @returns {Promise<Array>} Array of workout data
 */
export const getBlockProgress = async (blockId) => {
  try {
    const response = await fetch(`${API_URL}/blocks/${blockId}/progress`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch progress: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('API Error - getBlockProgress:', error);
    throw error;
  }
};

/**
 * Delete a training block by ID
 * @param {number} blockId - Block ID to delete
 * @returns {Promise<void>}
 */
export const deleteBlock = async (blockId) => {
  try {
    const response = await fetch(`${API_URL}/blocks/${blockId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete block: ${response.statusText}`);
    }
  } catch (error) {
    console.error('API Error - deleteBlock:', error);
    throw error;
  }
};

/**
 * Delete a specific logged workout
 * @param {number} blockId - Block ID
 * @param {number} weekNumber - Week number
 * @param {number} dayNumber - Day number
 * @returns {Promise<void>}
 */
export const deleteWorkout = async (blockId, weekNumber, dayNumber) => {
  try {
    const response = await fetch(
      `${API_URL}/workouts?blockId=${blockId}&weekNumber=${weekNumber}&dayNumber=${dayNumber}`,
      {
        method: 'DELETE'
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete workout: ${response.statusText}`);
    }
  } catch (error) {
    console.error('API Error - deleteWorkout:', error);
    throw error;
  }
};

