import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Dumbbell, LayoutList, History, PenLine, Calendar } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { getWorkoutLogs, getTrainingBlock, saveWorkoutsByDay } from '../utils/workoutStorage';
import { ensureStandaloneBlock, deleteBlock } from '../services/api';
import ExerciseForm from './ExerciseForm';
import DayBuilder from './DayBuilder';

const Home = () => {
  const { workoutsByDay, setWorkoutsByDay, standaloneBlockId, setStandaloneBlockId } = useWorkout();
  const [error, setError] = useState('');
  const [currentWeek, setCurrentWeek] = useState(null);
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
      Equipment: exerciseData.equipment || '',
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

  const handleSaveManualWorkout = async () => {
    const hasExercises = Object.values(manualWeekData).some(day => day.length > 0);
    if (!hasExercises) {
      setError('Please add at least one exercise to save');
      return;
    }

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
          Equipment: ex.Equipment || '',
          Tempo: ex.Tempo
        }));
      }
    });

    // Override existing standalone: delete old block if any, then create new one
    if (standaloneBlockId != null) {
      try {
        await deleteBlock(standaloneBlockId);
      } catch (_) { /* block may already be gone */ }
      setStandaloneBlockId(null);
    }
    const newId = await ensureStandaloneBlock(workoutsByDayData, null);
    if (newId != null) setStandaloneBlockId(newId);

    setWorkoutsByDay(workoutsByDayData);
    saveWorkoutsByDay(workoutsByDayData);
    setError('');
    const days = Object.keys(workoutsByDayData).map(d => parseInt(d, 10)).sort((a, b) => a - b);
    if (days.length > 0) navigate(`/day/${days[0]}`);
  };

  const allDays = workoutsByDay
    ? Object.keys(workoutsByDay)
        .map(d => parseInt(d, 10))
        .sort((a, b) => a - b)
    : [];

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6 md:p-8">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 flex items-center gap-2 sm:gap-3 shrink-0">
              <Dumbbell className="w-8 h-8 sm:w-9 sm:h-9 text-amber-500" />
              Workout Tracker
            </h1>
            <div className="flex gap-2 shrink-0 min-w-0">
              <Link
                to="/blocks"
                className="px-3 sm:px-4 py-2 bg-amber-500 text-gray-900 rounded-xl hover:bg-amber-400 font-semibold transition-colors flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base whitespace-nowrap"
              >
                <LayoutList className="w-5 h-5 shrink-0" />
                Blocks
              </Link>
              <Link
                to="/history"
                className="px-3 sm:px-4 py-2 bg-gray-700 text-gray-200 rounded-xl hover:bg-gray-600 font-medium transition-colors flex items-center gap-1.5 sm:gap-2 border border-gray-600 text-sm sm:text-base whitespace-nowrap"
              >
                <History className="w-5 h-5 shrink-0" />
                History
              </Link>
            </div>
          </div>
          <p className="text-gray-400 text-center mb-8">
            Build your workout program to get started
          </p>

          {/* Manual Builder */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <PenLine className="w-6 h-6 text-amber-500" />
              Build Your Workout Program
            </h2>
              
              {/* Days Control */}
              <div className="bg-gray-700/50 rounded-xl p-4 mb-6 border border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-300">
                    Number of Days
                  </label>
                  <span className="text-lg font-bold text-gray-100">{numDays}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleRemoveDay}
                    disabled={numDays <= 1}
                    className="flex-1 px-3 py-2 bg-gray-600 text-gray-200 rounded-lg font-bold hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-colors"
                  >
                    −
                  </button>
                  <button
                    onClick={handleAddDay}
                    disabled={numDays >= 7}
                    className="flex-1 px-3 py-2 bg-gray-600 text-gray-200 rounded-lg font-bold hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-colors"
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
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <p className="text-amber-400 font-semibold mb-2">Workout Preview:</p>
                  <div className="space-y-2 text-sm text-gray-300">
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
                className="w-full px-6 py-5 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-500 active:bg-emerald-700 transition-colors shadow-lg min-h-[56px] disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Save Workout Program
              </button>
            </div>

          {error && (
            <div className="mt-4 p-4 bg-red-900/30 border border-red-700 rounded-xl text-red-300">
              {error}
            </div>
          )}

          {workoutsByDay && allDays.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                Available Days
              </h2>
              <div className="flex flex-wrap gap-2">
                {allDays.map((day) => (
                  <Link
                    key={day}
                    to={`/day/${day}`}
                    className="px-4 py-2 bg-amber-500 text-gray-900 rounded-xl hover:bg-amber-400 font-semibold transition-colors"
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
          <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Current Week
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to={`/block/${currentWeek.blockId}/week/${currentWeek.week}/day/1`}
                className="px-4 py-2 bg-amber-500 text-gray-900 rounded-xl text-base font-semibold hover:bg-amber-400 transition-colors"
              >
                Block {currentWeek.blockId} - Week {currentWeek.week}
              </Link>
              {currentWeek.isDeload && (
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-semibold border border-amber-500/50">
                  Deload Week
                </span>
              )}
              {currentWeek.week < currentWeek.blockLength && (
                <span className="text-sm text-gray-400">
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

