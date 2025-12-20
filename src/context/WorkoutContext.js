import { createContext, useContext, useState } from 'react';
import { getWorkoutsByDay } from '../utils/workoutStorage';

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
  // Load from localStorage on initialization
  const [workoutsByDay, setWorkoutsByDay] = useState(() => {
    return getWorkoutsByDay();
  });
  
  // New block-based structure
  const [currentBlock, setCurrentBlock] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);

  return (
    <WorkoutContext.Provider value={{ 
      workoutsByDay, 
      setWorkoutsByDay,
      currentBlock,
      setCurrentBlock,
      currentWeek,
      setCurrentWeek
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};

