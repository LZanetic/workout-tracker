/**
 * Utility functions for storing and retrieving workout logs and training blocks from localStorage
 */

const STORAGE_KEY = 'workout_logs';
const BLOCKS_STORAGE_KEY = 'training_blocks';
const WORKOUTS_BY_DAY_KEY = 'workouts_by_day';

/**
 * Save a completed workout to localStorage
 * @param {Object} workoutLog - The workout log object to save
 * @returns {void}
 */
export const saveWorkoutLog = (workoutLog) => {
  try {
    const existingLogs = getWorkoutLogs();
    const updatedLogs = [...existingLogs, workoutLog];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error('Error saving workout log:', error);
    throw new Error('Failed to save workout log');
  }
};

/**
 * Get all workout logs from localStorage
 * @returns {Array} Array of workout logs
 */
export const getWorkoutLogs = () => {
  try {
    const logs = localStorage.getItem(STORAGE_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    console.error('Error reading workout logs:', error);
    return [];
  }
};

/**
 * Clear all workout logs from localStorage
 * @returns {void}
 */
export const clearWorkoutLogs = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing workout logs:', error);
  }
};

/**
 * Save a training block to localStorage
 * @param {Object} block - The training block object to save
 * @returns {void}
 */
export const saveTrainingBlock = (block) => {
  try {
    const existingBlocks = getTrainingBlocks();
    const updatedBlocks = [...existingBlocks, block];
    localStorage.setItem(BLOCKS_STORAGE_KEY, JSON.stringify(updatedBlocks));
  } catch (error) {
    console.error('Error saving training block:', error);
    throw new Error('Failed to save training block');
  }
};

/**
 * Get all training blocks from localStorage
 * @returns {Array} Array of training blocks
 */
export const getTrainingBlocks = () => {
  try {
    const blocks = localStorage.getItem(BLOCKS_STORAGE_KEY);
    return blocks ? JSON.parse(blocks) : [];
  } catch (error) {
    console.error('Error reading training blocks:', error);
    return [];
  }
};

/**
 * Get a specific training block by ID
 * @param {number} blockId - The block ID
 * @returns {Object|null} The training block or null if not found
 */
export const getTrainingBlock = (blockId) => {
  try {
    const blocks = getTrainingBlocks();
    return blocks.find(block => block.blockId === blockId) || null;
  } catch (error) {
    console.error('Error reading training block:', error);
    return null;
  }
};

/**
 * Clear all training blocks from localStorage
 * @returns {void}
 */
export const clearTrainingBlocks = () => {
  try {
    localStorage.removeItem(BLOCKS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing training blocks:', error);
  }
};

/**
 * Delete a specific training block by ID
 * @param {number} blockId - The block ID to delete
 * @returns {void}
 */
export const deleteTrainingBlock = (blockId) => {
  try {
    const idNum = Number(blockId);
    const blocks = getTrainingBlocks();
    const updatedBlocks = blocks.filter(
      block => Number(block.blockId ?? block.id) !== idNum
    );
    localStorage.setItem(BLOCKS_STORAGE_KEY, JSON.stringify(updatedBlocks));
  } catch (error) {
    console.error('Error deleting training block:', error);
    throw new Error('Failed to delete training block');
  }
};

/**
 * Delete a specific workout log by index
 * @param {number} index - The index of the workout log to delete
 * @returns {void}
 */
export const deleteWorkoutLog = (index) => {
  try {
    const logs = getWorkoutLogs();
    const updatedLogs = logs.filter((_, i) => i !== index);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
  } catch (error) {
    console.error('Error deleting workout log:', error);
    throw new Error('Failed to delete workout log');
  }
};

/**
 * Update a training block (for editing exercises, days, weeks)
 * @param {Object} updatedBlock - The updated training block
 * @returns {void}
 */
export const updateTrainingBlock = (updatedBlock) => {
  try {
    const blocks = getTrainingBlocks();
    const updatedBlocks = blocks.map(block => 
      block.blockId === updatedBlock.blockId ? updatedBlock : block
    );
    localStorage.setItem(BLOCKS_STORAGE_KEY, JSON.stringify(updatedBlocks));
  } catch (error) {
    console.error('Error updating training block:', error);
    throw new Error('Failed to update training block');
  }
};

/**
 * Save workoutsByDay to localStorage
 * @param {Object} workoutsByDay - The workouts by day object
 * @returns {void}
 */
export const saveWorkoutsByDay = (workoutsByDay) => {
  try {
    localStorage.setItem(WORKOUTS_BY_DAY_KEY, JSON.stringify(workoutsByDay));
  } catch (error) {
    console.error('Error saving workouts by day:', error);
    throw new Error('Failed to save workouts by day');
  }
};

/**
 * Get workoutsByDay from localStorage
 * @returns {Object|null} The workouts by day object or null if not found
 */
export const getWorkoutsByDay = () => {
  try {
    const data = localStorage.getItem(WORKOUTS_BY_DAY_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading workouts by day:', error);
    return null;
  }
};

/**
 * Clear workoutsByDay from localStorage
 * @returns {void}
 */
export const clearWorkoutsByDay = () => {
  try {
    localStorage.removeItem(WORKOUTS_BY_DAY_KEY);
  } catch (error) {
    console.error('Error clearing workouts by day:', error);
  }
};

