import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FileUpload from './FileUpload';
import { parseCSV } from '../utils/csvParser';
import { useWorkout } from '../context/WorkoutContext';

const Home = () => {
  const { workoutsByDay, setWorkoutsByDay } = useWorkout();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileUpload = (csvText) => {
    try {
      const parsed = parseCSV(csvText);
      setWorkoutsByDay(parsed);
      setError('');
      
      // Navigate to first day if available
      const days = Object.keys(parsed).map(d => parseInt(d, 10)).sort((a, b) => a - b);
      if (days.length > 0) {
        navigate(`/day/${days[0]}`);
      }
    } catch (err) {
      setError(err.message);
      setWorkoutsByDay(null);
    }
  };

  const allDays = workoutsByDay
    ? Object.keys(workoutsByDay)
        .map(d => parseInt(d, 10))
        .sort((a, b) => a - b)
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Workout Tracker
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Upload your workout CSV file to get started
          </p>

          <FileUpload onFileUpload={handleFileUpload} />

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {workoutsByDay && allDays.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Available Days
              </h2>
              <div className="flex flex-wrap gap-2">
                {allDays.map((day) => (
                  <Link
                    key={day}
                    to={`/day/${day}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    Day {day}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;

