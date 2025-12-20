import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getWorkoutLogs, getTrainingBlock, deleteWorkoutLog } from '../utils/workoutStorage';

const History = () => {
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [error, setError] = useState('');

  const loadWorkouts = () => {
    const logs = getWorkoutLogs();
    // Sort by timestamp, most recent first
    const sortedLogs = logs.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    setWorkouts(sortedLogs);
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

  const handleDeleteWorkout = (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
      try {
        deleteWorkoutLog(index);
        loadWorkouts();
        if (selectedWorkout && workouts.indexOf(selectedWorkout) === index) {
          setSelectedWorkout(null);
        }
      } catch (err) {
        setError('Failed to delete workout: ' + err.message);
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalExercises = (workout) => {
    return workout.exercises ? workout.exercises.length : 0;
  };

  const isDeloadWeek = (workout) => {
    if (!workout.blockId || !workout.week) return false;
    const block = getTrainingBlock(workout.blockId);
    return block && workout.week === block.blockLength;
  };

  if (selectedWorkout) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
          {/* Back Button */}
          <button
            onClick={() => setSelectedWorkout(null)}
            className="mb-6 text-blue-600 hover:text-blue-800 font-medium text-base py-2 px-1 min-h-[44px] flex items-center"
          >
            ← Back to History
          </button>

          {/* Workout Detail Header */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  {selectedWorkout.blockId && selectedWorkout.week 
                    ? `Week ${selectedWorkout.week}: Day ${selectedWorkout.day}`
                    : `Day ${selectedWorkout.day} Workout`}
                </h1>
                {selectedWorkout.blockId && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold">
                      Block {selectedWorkout.blockId}
                    </span>
                    {isDeloadWeek(selectedWorkout) && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-semibold border-2 border-yellow-300">
                        Deload Week
                      </span>
                    )}
                  </div>
                )}
                <p className="text-lg text-gray-600">
                  {formatDate(selectedWorkout.timestamp)}
                </p>
              </div>
              <button
                onClick={() => {
                  const index = workouts.findIndex(w => w === selectedWorkout);
                  if (index !== -1) {
                    handleDeleteWorkout(index, { preventDefault: () => {}, stopPropagation: () => {} });
                  }
                }}
                className="ml-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors min-h-[44px]"
                aria-label="Delete workout"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Exercise Details */}
          <div className="space-y-6">
            {selectedWorkout.exercises.map((exercise, exIndex) => (
              <div
                key={exIndex}
                className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 sm:p-8"
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                  {exercise.exerciseName}
                </h2>

                {/* Sets Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Set
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Weight (kg)
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Reps
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                          RPE
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {exercise.sets.map((set, setIndex) => (
                        <tr key={setIndex} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {setIndex + 1}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                            {set.weight || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                            {set.reps || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">
                            {set.rpe || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {set.completed ? (
                              <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                                ✓ Complete
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">
                                Incomplete
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-block mb-4 text-blue-600 hover:text-blue-800 font-medium text-base py-2 px-1 min-h-[44px] flex items-center"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">
            Workout History
          </h1>
          <p className="text-lg text-gray-600">
            {workouts.length} {workouts.length === 1 ? 'workout' : 'workouts'} completed
          </p>
        </div>

        {/* Workout List */}
        {workouts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <p className="text-xl text-gray-600 mb-4">No workouts completed yet</p>
            <p className="text-gray-500">Complete a workout to see it here!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => setSelectedWorkout(workout)}
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {workout.blockId && workout.week 
                        ? `Week ${workout.week}: Day ${workout.day}`
                        : `Day ${workout.day}`}
                    </h2>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      {workout.blockId && (
                        <>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold">
                            Block {workout.blockId}
                          </span>
                          {isDeloadWeek(workout) && (
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-semibold border-2 border-yellow-300">
                              Deload
                            </span>
                          )}
                        </>
                      )}
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-semibold">
                        {getTotalExercises(workout)} {getTotalExercises(workout) === 1 ? 'exercise' : 'exercises'}
                      </span>
                    </div>
                    <p className="text-lg text-gray-600">
                      {formatDate(workout.timestamp)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {workout.exercises && workout.exercises.slice(0, 3).map((exercise, exIndex) => (
                        <span
                          key={exIndex}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                        >
                          {exercise.exerciseName}
                        </span>
                      ))}
                      {workout.exercises && workout.exercises.length > 3 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                          +{workout.exercises.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div 
                      className="text-blue-600 font-semibold text-lg cursor-pointer"
                      onClick={() => setSelectedWorkout(workout)}
                    >
                      View Details
                    </div>
                    <button
                      onClick={(e) => handleDeleteWorkout(index, e)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors min-h-[44px]"
                      aria-label="Delete workout"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;

