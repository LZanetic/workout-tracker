import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FileUpload from './FileUpload';
import { parseCSV } from '../utils/csvParser';
import { useWorkout } from '../context/WorkoutContext';
import { getWorkoutLogs, getTrainingBlock, saveWorkoutsByDay, clearWorkoutsByDay } from '../utils/workoutStorage';
import ExerciseForm from './ExerciseForm';
import DayBuilder from './DayBuilder';

const Home = () => {
  const { workoutsByDay, setWorkoutsByDay } = useWorkout();
  const [error, setError] = useState('');
  const [currentWeek, setCurrentWeek] = useState(null);
  const [inputMethod, setInputMethod] = useState('csv'); // 'csv' or 'manual'
  const navigate = useNavigate();

  // Manual builder state
  const [numDays, setNumDays] = useState(3); // 1-7 days
  const [manualWeekData, setManualWeekData] = useState({
    1: [],
    2: [],
    3: []
  });
  const [editingExercise, setEditingExercise] = useState(null);
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [currentDayForForm, setCurrentDayForForm] = useState(1);

  useEffect(() => {
    // Get the most recent workout to determine current week
    const logs = getWorkoutLogs();
    if (logs.length > 0) {
      // Sort by timestamp, most recent first
      const sortedLogs = logs.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      const mostRecent = sortedLogs[0];
      if (mostRecent.blockId && mostRecent.week) {
        const block = getTrainingBlock(mostRecent.blockId);
        if (block) {
          const isDeload = mostRecent.week === block.blockLength;
          setCurrentWeek({
            blockId: mostRecent.blockId,
            week: mostRecent.week,
            isDeload,
            blockLength: block.blockLength
          });
        }
      }
    }
  }, []);

  const handleFileUpload = (csvText) => {
    // Clear error before attempting to parse
    setError('');
    try {
      const parsed = parseCSV(csvText);
      setWorkoutsByDay(parsed);
      saveWorkoutsByDay(parsed);
      setError('');
      
      // Navigate to first day if available
      const days = Object.keys(parsed).map(d => parseInt(d, 10)).sort((a, b) => a - b);
      if (days.length > 0) {
        navigate(`/day/${days[0]}`);
      }
    } catch (err) {
      setError(err.message);
      setWorkoutsByDay(null);
      clearWorkoutsByDay();
    }
  };

  const handleAddExercise = (dayNumber) => {
    setCurrentDayForForm(dayNumber);
    setEditingExercise(null);
    setShowExerciseForm(true);
  };

  const handleEditExercise = (dayNumber, exerciseIndex) => {
    const exercise = manualWeekData[dayNumber][exerciseIndex];
    setCurrentDayForForm(dayNumber);
    setEditingExercise({ ...exercise, dayNumber, exerciseIndex });
    setShowExerciseForm(true);
  };

  const handleSaveExercise = (exerciseData) => {
    const newExercise = {
      Day: currentDayForForm,
      Exercise: exerciseData.name,
      Sets: exerciseData.sets,
      Reps: exerciseData.reps,
      LoadMin: exerciseData.loadMin,
      LoadMax: exerciseData.loadMax,
      RPE: exerciseData.rpe,
      Category: exerciseData.category,
      Tempo: exerciseData.tempo
    };

    if (editingExercise) {
      // Update existing exercise
      const updatedDay = [...manualWeekData[currentDayForForm]];
      updatedDay[editingExercise.exerciseIndex] = newExercise;
      setManualWeekData({
        ...manualWeekData,
        [currentDayForForm]: updatedDay
      });
    } else {
      // Add new exercise
      setManualWeekData({
        ...manualWeekData,
        [currentDayForForm]: [...manualWeekData[currentDayForForm], newExercise]
      });
    }

    setShowExerciseForm(false);
    setEditingExercise(null);
  };

  const handleDeleteExercise = (dayNumber, exerciseIndex) => {
    const updatedDay = manualWeekData[dayNumber].filter((_, idx) => idx !== exerciseIndex);
    setManualWeekData({
      ...manualWeekData,
      [dayNumber]: updatedDay
    });
  };

  const handleMoveExercise = (dayNumber, exerciseIndex, direction) => {
    const dayExercises = [...manualWeekData[dayNumber]];
    if (
      (direction === 'up' && exerciseIndex === 0) ||
      (direction === 'down' && exerciseIndex === dayExercises.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? exerciseIndex - 1 : exerciseIndex + 1;
    [dayExercises[exerciseIndex], dayExercises[newIndex]] = [
      dayExercises[newIndex],
      dayExercises[exerciseIndex]
    ];

    setManualWeekData({
      ...manualWeekData,
      [dayNumber]: dayExercises
    });
  };

  const handleAddDay = () => {
    if (numDays < 7) {
      const newDayNum = numDays + 1;
      setNumDays(newDayNum);
      setManualWeekData({
        ...manualWeekData,
        [newDayNum]: []
      });
    }
  };

  const handleRemoveDay = () => {
    if (numDays > 1) {
      const dayToRemove = numDays;
      const updated = { ...manualWeekData };
      delete updated[dayToRemove];
      setManualWeekData(updated);
      setNumDays(numDays - 1);
    }
  };

  const handleSaveManualWorkout = () => {
    // Convert manual builder data to workoutsByDay format
    const hasExercises = Object.values(manualWeekData).some(day => day.length > 0);
    if (!hasExercises) {
      setError('Please add at least one exercise to save');
      return;
    }

    // Convert to workoutsByDay format (using LoadMin/LoadMax for legacy system)
    const workoutsByDayData = {};
    Object.keys(manualWeekData).forEach(dayNum => {
      const dayExercises = manualWeekData[dayNum];
      if (dayExercises.length > 0) {
        workoutsByDayData[dayNum] = dayExercises.map(ex => ({
          Day: ex.Day,
          Exercise: ex.Exercise,
          Sets: ex.Sets,
          Reps: ex.Reps,
          LoadMin: ex.LoadMin,
          LoadMax: ex.LoadMax,
          RPE: ex.RPE,
          Category: ex.Category,
          Tempo: ex.Tempo
        }));
      }
    });

    setWorkoutsByDay(workoutsByDayData);
    saveWorkoutsByDay(workoutsByDayData);
    setError('');

    // Navigate to first day if available
    const days = Object.keys(workoutsByDayData).map(d => parseInt(d, 10)).sort((a, b) => a - b);
    if (days.length > 0) {
      navigate(`/day/${days[0]}`);
    }
  };

  const allDays = workoutsByDay
    ? Object.keys(workoutsByDay)
        .map(d => parseInt(d, 10))
        .sort((a, b) => a - b)
    : [];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">
              Workout Tracker
            </h1>
            <div className="flex gap-2">
              <Link
                to="/blocks"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Blocks
              </Link>
              <Link
                to="/history"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                History
              </Link>
            </div>
          </div>
          <p className="text-gray-600 text-center mb-8">
            Upload your workout CSV file or build manually to get started
          </p>

          {/* Method Selection */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Input Method</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setInputMethod('csv');
                  setError('');
                }}
                className={`px-4 py-4 rounded-xl font-bold text-lg transition-all min-h-[56px] ${
                  inputMethod === 'csv'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                CSV Upload
              </button>
              <button
                onClick={() => {
                  setInputMethod('manual');
                  setError('');
                }}
                className={`px-4 py-4 rounded-xl font-bold text-lg transition-all min-h-[56px] ${
                  inputMethod === 'manual'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Manual Builder
              </button>
            </div>
          </div>

          {/* CSV Upload Method */}
          {inputMethod === 'csv' && (
            <div>
              <FileUpload 
                onFileUpload={handleFileUpload}
                onFileSelect={() => setError('')}
              />
            </div>
          )}

          {/* Manual Builder Method */}
          {inputMethod === 'manual' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Build Your Workout Program</h2>
              
              {/* Days Control */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Number of Days
                  </label>
                  <span className="text-lg font-bold text-gray-900">{numDays}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRemoveDay}
                    disabled={numDays <= 1}
                    className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    −
                  </button>
                  <button
                    onClick={handleAddDay}
                    disabled={numDays >= 7}
                    className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    +
                  </button>
                </div>
              </div>
              
              {/* Days */}
              {Array.from({ length: numDays }, (_, i) => i + 1).map(dayNum => (
                <DayBuilder
                  key={dayNum}
                  dayNumber={dayNum}
                  exercises={manualWeekData[dayNum] || []}
                  onAddExercise={() => handleAddExercise(dayNum)}
                  onEditExercise={(index) => handleEditExercise(dayNum, index)}
                  onDeleteExercise={(index) => handleDeleteExercise(dayNum, index)}
                  onMoveExercise={(index, direction) => handleMoveExercise(dayNum, index, direction)}
                />
              ))}

              {/* Workout Preview */}
              {Object.values(manualWeekData).some(day => day.length > 0) && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 font-semibold mb-2">Workout Preview:</p>
                  <div className="space-y-2 text-sm text-blue-700">
                    {Array.from({ length: numDays }, (_, i) => i + 1).map(dayNum => {
                      const dayExercises = manualWeekData[dayNum] || [];
                      if (dayExercises.length === 0) return null;
                      return (
                        <div key={dayNum}>
                          <span className="font-semibold">Day {dayNum}:</span>{' '}
                          {dayExercises.map(ex => ex.Exercise).join(', ')}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSaveManualWorkout}
                disabled={!Object.values(manualWeekData).some(day => day.length > 0)}
                className="w-full px-6 py-5 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 active:bg-green-800 transition-colors shadow-lg min-h-[56px] disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Save Workout Program
              </button>
            </div>
          )}

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

        {/* Current Week Display - Separate card */}
        {currentWeek && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Current Week
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to={`/block/${currentWeek.blockId}/week/${currentWeek.week}/day/1`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors"
              >
                Block {currentWeek.blockId} - Week {currentWeek.week}
              </Link>
              {currentWeek.isDeload && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-semibold border-2 border-yellow-300">
                  Deload Week
                </span>
              )}
              {currentWeek.week < currentWeek.blockLength && (
                <span className="text-sm text-gray-600">
                  {currentWeek.blockLength - currentWeek.week} week{currentWeek.blockLength - currentWeek.week !== 1 ? 's' : ''} remaining
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Exercise Form Modal */}
      {showExerciseForm && (
        <ExerciseForm
          exercise={editingExercise}
          onSave={handleSaveExercise}
          onClose={() => {
            setShowExerciseForm(false);
            setEditingExercise(null);
          }}
        />
      )}
    </div>
  );
};

export default Home;

