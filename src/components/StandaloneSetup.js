import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, PenLine, Calendar } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { saveWorkoutsByDay } from '../utils/workoutStorage';
import { ensureStandaloneBlock, deleteBlock } from '../services/api';
import ExerciseForm from './ExerciseForm';
import DayBuilder from './DayBuilder';

const StandaloneSetup = () => {
  const { workoutsByDay, setWorkoutsByDay, standaloneBlockId, setStandaloneBlockId } = useWorkout();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [numDays, setNumDays] = useState(3);
  const [manualWeekData, setManualWeekData] = useState({
    1: [],
    2: [],
    3: []
  });
  const [editingExercise, setEditingExercise] = useState(null);
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [currentDayForForm, setCurrentDayForForm] = useState(1);

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
      const updatedDay = [...manualWeekData[currentDayForForm]];
      updatedDay[editingExercise.exerciseIndex] = newExercise;
      setManualWeekData({
        ...manualWeekData,
        [currentDayForForm]: updatedDay
      });
    } else {
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
    ) return;
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
      setManualWeekData({ ...manualWeekData, [newDayNum]: [] });
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

    if (standaloneBlockId != null) {
      try {
        await deleteBlock(standaloneBlockId);
      } catch (_) {}
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
    ? Object.keys(workoutsByDay).map(d => parseInt(d, 10)).sort((a, b) => a - b)
    : [];

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium text-base py-2 px-1 min-h-[44px]"
        >
          <ChevronLeft className="w-5 h-5" /> Home
        </Link>

        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6 md:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-1 flex items-center gap-2">
            <PenLine className="w-8 h-8 text-amber-500" />
            My Workout Plan
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            A simple plan with Day 1, Day 2, … No multi-week block. For multi-week programs with progression, use <Link to="/blocks" className="text-amber-400 hover:text-amber-300 font-medium">Blocks</Link>.
          </p>

          <div className="space-y-6">
            <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-300">Number of Days</label>
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
            <div className="mt-8 pt-6 border-t border-gray-600">
              <h2 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
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
      </div>

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

export default StandaloneSetup;
