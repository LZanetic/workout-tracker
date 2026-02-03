/**
 * Storage for workout logs, training blocks, and workouts by day.
 * On Android/iOS (Capacitor) uses @capacitor/preferences for reliable persistence.
 * On web uses localStorage.
 */

const STORAGE_KEY = 'workout_logs';
const BLOCKS_STORAGE_KEY = 'training_blocks';
const WORKOUTS_BY_DAY_KEY = 'workouts_by_day';
export const STANDALONE_BLOCK_ID_KEY = 'workout_standalone_block_id';

// In-memory cache for native (Android/iOS); populated by initStorage()
const cache = {
  [STORAGE_KEY]: null,
  [BLOCKS_STORAGE_KEY]: null,
  [WORKOUTS_BY_DAY_KEY]: null,
  [STANDALONE_BLOCK_ID_KEY]: null
};

let useNativeStorage = false;
let Preferences = null;

function isNative() {
  if (typeof window === 'undefined' || !window.Capacitor) return false;
  const p = window.Capacitor.getPlatform();
  return p === 'android' || p === 'ios';
}

async function initNativeStorage() {
  try {
    const mod = await import('@capacitor/preferences');
    Preferences = mod.Preferences;
    useNativeStorage = true;
    const keys = [STORAGE_KEY, BLOCKS_STORAGE_KEY, WORKOUTS_BY_DAY_KEY, STANDALONE_BLOCK_ID_KEY];
    for (const key of keys) {
      const { value } = await Preferences.get({ key });
      if (value != null) cache[key] = value;
    }
  } catch (e) {
    console.warn('Capacitor Preferences not available, using localStorage:', e);
  }
}

function parse(key, value) {
  if (value === null || value === undefined) return value;
  if (key === STANDALONE_BLOCK_ID_KEY) return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function getFromStorage(key) {
  if (useNativeStorage) {
    const raw = cache[key];
    if (raw === null || raw === undefined) {
      if (key === WORKOUTS_BY_DAY_KEY || key === STANDALONE_BLOCK_ID_KEY) return null;
      return [];
    }
    return key === STANDALONE_BLOCK_ID_KEY ? raw : parse(key, raw);
  }
  try {
    const raw = localStorage.getItem(key);
    if (key === STANDALONE_BLOCK_ID_KEY) return raw;
    return raw ? JSON.parse(raw) : (key === WORKOUTS_BY_DAY_KEY ? null : []);
  } catch {
    return key === WORKOUTS_BY_DAY_KEY ? null : [];
  }
}

function setInStorage(key, value) {
  const serialized = key === STANDALONE_BLOCK_ID_KEY ? String(value) : JSON.stringify(value);
  if (useNativeStorage && Preferences) {
    cache[key] = serialized;
    Preferences.set({ key, value: serialized }).catch((e) => console.warn('Preferences.set failed:', e));
    return;
  }
  try {
    if (value == null && key !== STANDALONE_BLOCK_ID_KEY) localStorage.removeItem(key);
    else localStorage.setItem(key, serialized);
  } catch (error) {
    console.error('Storage set failed:', error);
    throw new Error('Failed to save');
  }
}

function removeFromStorage(key) {
  if (useNativeStorage && Preferences) {
    cache[key] = null;
    Preferences.remove({ key }).catch((e) => console.warn('Preferences.remove failed:', e));
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('Storage remove failed:', e);
  }
}

/**
 * Call once before using storage (e.g. in App mount). On native loads from Preferences into cache.
 * @returns {Promise<void>}
 */
export async function initStorage() {
  if (isNative()) await initNativeStorage();
}

export const saveWorkoutLog = (workoutLog) => {
  try {
    const existingLogs = getWorkoutLogs();
    const updatedLogs = [...existingLogs, workoutLog];
    setInStorage(STORAGE_KEY, updatedLogs);
  } catch (error) {
    console.error('Error saving workout log:', error);
    throw new Error('Failed to save workout log');
  }
};

export const getWorkoutLogs = () => {
  try {
    const logs = getFromStorage(STORAGE_KEY);
    return Array.isArray(logs) ? logs : [];
  } catch (error) {
    console.error('Error reading workout logs:', error);
    return [];
  }
};

/** Replace all workout logs (used by api.js deleteWorkoutLocal) */
export const setWorkoutLogs = (logs) => {
  try {
    setInStorage(STORAGE_KEY, Array.isArray(logs) ? logs : []);
  } catch (error) {
    console.error('Error setting workout logs:', error);
    throw new Error('Failed to save workout logs');
  }
};

export const clearWorkoutLogs = () => {
  try {
    removeFromStorage(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing workout logs:', error);
  }
};

export const saveTrainingBlock = (block) => {
  try {
    const existingBlocks = getTrainingBlocks();
    const updatedBlocks = [...existingBlocks, block];
    setInStorage(BLOCKS_STORAGE_KEY, updatedBlocks);
  } catch (error) {
    console.error('Error saving training block:', error);
    throw new Error('Failed to save training block');
  }
};

export const getTrainingBlocks = () => {
  try {
    const blocks = getFromStorage(BLOCKS_STORAGE_KEY);
    return Array.isArray(blocks) ? blocks : [];
  } catch (error) {
    console.error('Error reading training blocks:', error);
    return [];
  }
};

export const getTrainingBlock = (blockId) => {
  try {
    const idNum = Number(blockId);
    if (Number.isNaN(idNum)) return null;
    const blocks = getTrainingBlocks();
    return blocks.find(block => Number(block.blockId ?? block.id) === idNum) || null;
  } catch (error) {
    console.error('Error reading training block:', error);
    return null;
  }
};

export const clearTrainingBlocks = () => {
  try {
    removeFromStorage(BLOCKS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing training blocks:', error);
  }
};

export const deleteTrainingBlock = (blockId) => {
  try {
    const idNum = Number(blockId);
    const blocks = getTrainingBlocks();
    const updatedBlocks = blocks.filter(
      block => Number(block.blockId ?? block.id) !== idNum
    );
    setInStorage(BLOCKS_STORAGE_KEY, updatedBlocks);
  } catch (error) {
    console.error('Error deleting training block:', error);
    throw new Error('Failed to delete training block');
  }
};

export const deleteWorkoutLog = (index) => {
  try {
    const logs = getWorkoutLogs();
    const updatedLogs = logs.filter((_, i) => i !== index);
    setInStorage(STORAGE_KEY, updatedLogs);
  } catch (error) {
    console.error('Error deleting workout log:', error);
    throw new Error('Failed to delete workout log');
  }
};

export const updateTrainingBlock = (updatedBlock) => {
  try {
    const updatedId = Number(updatedBlock.blockId ?? updatedBlock.id);
    if (Number.isNaN(updatedId)) throw new Error('Invalid block id');
    const blocks = getTrainingBlocks();
    const updatedBlocks = blocks.map(block =>
      Number(block.blockId ?? block.id) === updatedId ? updatedBlock : block
    );
    setInStorage(BLOCKS_STORAGE_KEY, updatedBlocks);
  } catch (error) {
    console.error('Error updating training block:', error);
    throw new Error('Failed to update training block');
  }
};

export const saveWorkoutsByDay = (workoutsByDay) => {
  try {
    setInStorage(WORKOUTS_BY_DAY_KEY, workoutsByDay);
  } catch (error) {
    console.error('Error saving workouts by day:', error);
    throw new Error('Failed to save workouts by day');
  }
};

export const getWorkoutsByDay = () => {
  try {
    const data = getFromStorage(WORKOUTS_BY_DAY_KEY);
    return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
  } catch (error) {
    console.error('Error reading workouts by day:', error);
    return null;
  }
};

export const clearWorkoutsByDay = () => {
  try {
    removeFromStorage(WORKOUTS_BY_DAY_KEY);
  } catch (error) {
    console.error('Error clearing workouts by day:', error);
  }
};

export const getStandaloneBlockId = () => {
  try {
    const raw = getFromStorage(STANDALONE_BLOCK_ID_KEY);
    if (raw == null || raw === '') return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
};

export const setStandaloneBlockId = (id) => {
  try {
    if (id != null) setInStorage(STANDALONE_BLOCK_ID_KEY, String(id));
    else removeFromStorage(STANDALONE_BLOCK_ID_KEY);
  } catch (e) {
    console.warn('setStandaloneBlockId failed:', e);
  }
};
