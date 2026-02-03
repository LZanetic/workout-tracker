import { createContext, useContext, useState } from 'react';
import { getWorkoutsByDay, getStandaloneBlockId, setStandaloneBlockId as persistStandaloneBlockId } from '../utils/workoutStorage';

const WorkoutContext = createContext();

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};

export const WorkoutProvider = ({ children }) => {
  const [workoutsByDay, setWorkoutsByDay] = useState(() => getWorkoutsByDay());
  const [standaloneBlockId, setStandaloneBlockIdState] = useState(() => getStandaloneBlockId());

  const setStandaloneBlockId = (id) => {
    setStandaloneBlockIdState(id);
    persistStandaloneBlockId(id);
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

