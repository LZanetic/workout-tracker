import { buildStandaloneBlockFromWorkoutsByDay } from '../utils/apiTransformers';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

/**
 * Ensure a standalone block exists for legacy workouts; create from workoutsByDay if needed.
 * @param {Object} workoutsByDay - { dayNumber: [exercises] }
 * @param {number|null} currentStandaloneBlockId - existing id if any
 * @returns {Promise<number|null>} block id to use for legacy, or null if no data
 */
export const ensureStandaloneBlock = async (workoutsByDay, currentStandaloneBlockId) => {
  const hasDays = workoutsByDay && Object.keys(workoutsByDay).length > 0;
  if (!hasDays) return currentStandaloneBlockId;
  if (currentStandaloneBlockId != null) {
    try {
      await getBlock(currentStandaloneBlockId);
      return currentStandaloneBlockId;
    } catch (e) {
      // Block gone (404 or deleted); create new one
    }
  }
  const payload = buildStandaloneBlockFromWorkoutsByDay(workoutsByDay);
  if (!payload) return null;
  const block = await createBlock(payload);
  return block?.id ?? null;
};

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

// ExerciseDB v1 (open source) - direct calls with in-memory cache to avoid 429 rate limits
const EXERCISEDB_BASE = 'https://exercisedb-api.vercel.app';
const EXERCISE_LIMIT = 100;  // single request; filtered results are typically well under this

// Static lists from ExerciseDB v1 – no API calls, zero 429 risk for body parts / equipments
const BODY_PARTS_STATIC = [
  'Back', 'Cardio', 'Chest', 'Lower Arms', 'Lower Legs', 'Neck', 'Shoulders', 'Upper Arms', 'Upper Legs', 'Waist'
];
const EQUIPMENTS_STATIC = [
  'Assisted', 'Band', 'Barbell', 'Bosu Ball', 'Cable', 'Dumbbell', 'Elliptical Machine', 'Ez Barbell', 'Hammer',
  'Kettlebell', 'Leverage Machine', 'Medicine Ball', 'Olympic Barbell', 'Resistance Band', 'Roller', 'Rope',
  'Sled Machine', 'Skierg Machine', 'Smith Machine', 'Stability Ball', 'Stationary Bike', 'Stepmill Machine',
  'Tire', 'Trap Bar', 'Upper Body Ergometer', 'Weighted', 'Wheel Roller', 'Body Weight'
].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

// Cache TTLs (ms): filter/search only (body parts and equipments use static lists)
const CACHE_FILTER_MS = 15 * 60 * 1000;       // 15 min
const CACHE_SEARCH_MS = 5 * 60 * 1000;        // 5 min
const CACHE_429_COOLDOWN_MS = 60 * 1000;      // 1 min - avoid retrying soon after 429

const cache = {
  filter: new Map(),   // key "bodyPart|equipment" -> { data, ts }
  search: new Map()    // key query -> { data, ts }
};

// In-flight requests: same key returns same promise (request coalescing)
const inFlight = {
  filter: new Map(),
  search: new Map()
};
const last429 = { filter: 0, search: 0 };

function toTitleCase(s) {
  if (s == null || typeof s !== 'string' || !s.trim()) return s;
  return s.trim().split(/\s+/).map(w =>
    w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''
  ).join(' ');
}

function parseExerciseList(json) {
  try {
    const data = json?.data;
    if (!Array.isArray(data)) return [];
    return data.map((item) => {
      const name = item.name ? toTitleCase(item.name) : '';
      const bodyPart = Array.isArray(item.bodyParts) && item.bodyParts[0] ? toTitleCase(item.bodyParts[0]) : undefined;
      const equipment = Array.isArray(item.equipments) && item.equipments[0] ? toTitleCase(item.equipments[0]) : undefined;
      return { name, bodyPart, equipment };
    }).filter((item) => item.name);
  } catch {
    return [];
  }
}

/**
 * List equipment names. Uses static list (ExerciseDB v1) – no API call, avoids 429.
 * @returns {Promise<string[]>}
 */
export const getEquipments = async () => Promise.resolve([...EQUIPMENTS_STATIC]);

/**
 * List body part names. Uses static list (ExerciseDB v1) – no API call, avoids 429.
 * @returns {Promise<string[]>}
 */
export const getBodyParts = async () => Promise.resolve([...BODY_PARTS_STATIC]);

/**
 * List exercises for body part AND equipment (ExerciseDB direct, cached).
 * @param {string} bodyPart - e.g. "Upper Legs"
 * @param {string} equipment - e.g. "Barbell"
 * @returns {Promise<Array<{ name: string, bodyPart?: string, equipment?: string }>>}
 */
export const getExercisesByBodyPartAndEquipment = async (bodyPart, equipment) => {
  if (!bodyPart || !equipment || String(bodyPart).trim() === '' || String(equipment).trim() === '') return [];
  const key = `${String(bodyPart).trim()}|${String(equipment).trim()}`;
  const now = Date.now();
  const entry = cache.filter.get(key);
  if (entry && now - entry.ts < CACHE_FILTER_MS) return entry.data;
  if (now - last429.filter < CACHE_429_COOLDOWN_MS && entry) return entry.data;
  if (inFlight.filter.get(key)) return inFlight.filter.get(key);
  const promise = (async () => {
    try {
      const bp = encodeURIComponent(String(bodyPart).trim());
      const eq = encodeURIComponent(String(equipment).trim());
      const url = `${EXERCISEDB_BASE}/api/v1/exercises/filter?bodyParts=${bp}&equipment=${eq}&limit=${EXERCISE_LIMIT}&offset=0`;
      const response = await fetch(url);
      if (response.status === 429) {
        last429.filter = Date.now();
        return entry ? entry.data : [];
      }
      if (!response.ok) return entry ? entry.data : [];
      const json = await response.json();
      const data = parseExerciseList(json).sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
      cache.filter.set(key, { data, ts: Date.now() });
      return data;
    } catch (err) {
      if (err?.status === 429) last429.filter = Date.now();
      console.warn('Exercises by body part + equipment failed:', err);
      return entry ? entry.data : [];
    } finally {
      inFlight.filter.delete(key);
    }
  })();
  inFlight.filter.set(key, promise);
  return promise;
};

/**
 * Search exercise names (ExerciseDB direct, cached, for custom name fallback).
 * @param {string} query - Search term (optional; empty returns initial list)
 * @returns {Promise<Array<{ name: string, bodyPart?: string, equipment?: string }>>}
 */
export const getExerciseNames = async (query = '') => {
  const q = query != null ? String(query).trim() : '';
  const key = q || '__empty__';
  const now = Date.now();
  const entry = cache.search.get(key);
  if (entry && now - entry.ts < CACHE_SEARCH_MS) return entry.data;
  if (now - last429.search < CACHE_429_COOLDOWN_MS && entry) return entry.data;
  if (inFlight.search.get(key)) return inFlight.search.get(key);
  const promise = (async () => {
    try {
      const url = q
        ? `${EXERCISEDB_BASE}/api/v1/exercises/search?q=${encodeURIComponent(q)}&threshold=0.5&limit=${EXERCISE_LIMIT}&offset=0`
        : `${EXERCISEDB_BASE}/api/v1/exercises?search=&limit=${EXERCISE_LIMIT}&offset=0`;
      const response = await fetch(url);
      if (response.status === 429) {
        last429.search = Date.now();
        return entry ? entry.data : [];
      }
      if (!response.ok) return entry ? entry.data : [];
      const json = await response.json();
      const data = parseExerciseList(json).sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
      cache.search.set(key, { data, ts: Date.now() });
      return data;
    } catch (err) {
      if (err?.status === 429) last429.search = Date.now();
      console.warn('Exercise search failed:', err);
      return entry ? entry.data : [];
    } finally {
      inFlight.search.delete(key);
    }
  })();
  inFlight.search.set(key, promise);
  return promise;
};

/**
 * Delete an exercise by ID (removes from block/day; prescribed and actual sets are removed)
 * @param {number} exerciseId - Exercise ID to delete
 * @returns {Promise<void>}
 */
export const deleteExercise = async (exerciseId) => {
  try {
    const response = await fetch(`${API_URL}/exercises/${exerciseId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete exercise: ${response.statusText}`);
    }
  } catch (error) {
    console.error('API Error - deleteExercise:', error);
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

