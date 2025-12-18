import { createContext, useContext, useState } from 'react';

const WorkoutContext = createContext();

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};

export const WorkoutProvider = ({ children }) => {
  const [workoutsByDay, setWorkoutsByDay] = useState(null);

  return (
    <WorkoutContext.Provider value={{ workoutsByDay, setWorkoutsByDay }}>
      {children}
    </WorkoutContext.Provider>
  );
};

