/**
 * Utility functions for storing and retrieving workout logs and training blocks from localStorage
 */

const STORAGE_KEY = 'workout_logs';
const BLOCKS_STORAGE_KEY = 'training_blocks';

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

