import { createContext, useContext, useState } from 'react';
import { getWorkoutsByDay } from '../utils/workoutStorage';

const STANDALONE_BLOCK_ID_KEY = 'workout_standalone_block_id';

const WorkoutContext = createContext();

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};

export const WorkoutProvider = ({ children }) => {
  // Legacy support for old day-based structure
  const [workoutsByDay, setWorkoutsByDay] = useState(() => getWorkoutsByDay());

  // Standalone block id: one block used for legacy (no block structure) so same API as blocks
  const [standaloneBlockId, setStandaloneBlockIdState] = useState(() => {
    try {
      const id = localStorage.getItem(STANDALONE_BLOCK_ID_KEY);
      return id ? parseInt(id, 10) : null;
    } catch {
      return null;
    }
  });
  const setStandaloneBlockId = (id) => {
    setStandaloneBlockIdState(id);
    try {
      if (id != null) localStorage.setItem(STANDALONE_BLOCK_ID_KEY, String(id));
      else localStorage.removeItem(STANDALONE_BLOCK_ID_KEY);
    } catch {}
  };

  const [currentBlock, setCurrentBlock] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);

  return (
    <WorkoutContext.Provider value={{
      workoutsByDay,
      setWorkoutsByDay,
      standaloneBlockId,
      setStandaloneBlockId,
      currentBlock,
      setCurrentBlock,
      currentWeek,
      setCurrentWeek
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};

