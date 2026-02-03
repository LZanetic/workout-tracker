import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PenLine, Copy, ChevronLeft, Dumbbell } from 'lucide-react';
import { generateBlockWeeks } from '../utils/blockProgression';
import { saveTrainingBlock, getTrainingBlocks } from '../utils/workoutStorage';
import { createBlock, getBlock, getAllBlocks } from '../services/api';
import { transformBlockForAPI, buildCopyBlockPayload } from '../utils/apiTransformers';
import ExerciseForm from './ExerciseForm';
import DayBuilder from './DayBuilder';

const BlockSetup = () => {
  const navigate = useNavigate();
  const [inputMethod, setInputMethod] = useState('manual'); // 'manual' | 'copy'
  const [progressionRate, setProgressionRate] = useState(0.075);
  const [deloadRate, setDeloadRate] = useState(0.85);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Copy-from-block state
  const [blocksList, setBlocksList] = useState([]);
  const [copySourceBlockId, setCopySourceBlockId] = useState('');
  const [loadIncreasePct, setLoadIncreasePct] = useState('0');

  // Manual builder state
  const [numDays, setNumDays] = useState(3); // 1-7 days
  const [numWeeks, setNumWeeks] = useState(5); // For manual builder weeks
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
      BaseLoadMin: exerciseData.loadMin,
      BaseLoadMax: exerciseData.loadMax,
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

  const handleAddWeek = () => {
    if (numWeeks < 10) {
      setNumWeeks(numWeeks + 1);
    }
  };

  const handleRemoveWeek = () => {
    if (numWeeks > 1) {
      setNumWeeks(numWeeks - 1);
    }
  };

  const handleGenerateBlock = async () => {
    if (inputMethod === 'copy') {
      if (!copySourceBlockId) {
        setError('Please select a block to copy');
        return;
      }
      setIsGenerating(true);
      setError('');
      try {
        const sourceBlock = await getBlock(Number(copySourceBlockId));
        if (!sourceBlock || !sourceBlock.weeks?.length) {
          setError('Could not load the selected block');
          setIsGenerating(false);
          return;
        }
        const pct = parseFloat(loadIncreasePct) || 0;
        const apiBlockData = buildCopyBlockPayload(sourceBlock, pct);
        const createdBlock = await createBlock(apiBlockData);
        const blockForStorage = {
          blockId: createdBlock.id,
          blockLength: sourceBlock.blockLength,
          progressionRate: sourceBlock.progressionRate,
          deloadRate: sourceBlock.deloadRate,
          createdAt: new Date().toISOString(),
          weeks: createdBlock.weeks ?? apiBlockData.weeks
        };
        saveTrainingBlock(blockForStorage);
        navigate(`/block/${createdBlock.id}`);
      } catch (apiError) {
        setError(apiError.message || 'Failed to copy block. Is the backend running?');
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    const hasExercises = Object.values(manualWeekData).some(day => day.length > 0);
    if (!hasExercises) {
      setError('Please add at least one exercise to generate a block');
      return;
    }
    setIsGenerating(true);
    setError('');

    try {
      const weeks = generateBlockWeeks(manualWeekData, numWeeks, progressionRate, deloadRate);

      const blockForAPI = {
        blockLength: numWeeks,
        progressionRate,
        deloadRate,
        weeks: weeks.map(week => ({
          weekNumber: week.weekNumber,
          days: week.days
        }))
      };

      try {
        const apiBlockData = transformBlockForAPI(blockForAPI);
        const createdBlock = await createBlock(apiBlockData);
        
        const blockForStorage = {
          blockId: createdBlock.id,
          blockLength: numWeeks,
          progressionRate,
          deloadRate,
          createdAt: new Date().toISOString(),
          weeks: createdBlock.weeks ?? blockForAPI.weeks
        };
        saveTrainingBlock(blockForStorage);

        navigate(`/block/${createdBlock.id}`);
      } catch (apiError) {
        console.warn('API call failed, using localStorage fallback:', apiError);
        
        const existingBlocks = getTrainingBlocks();
        const nextBlockId = existingBlocks.length > 0
          ? Math.max(...existingBlocks.map(b => b.blockId ?? b.id)) + 1
          : 1;

        const blockForStorage = {
          blockId: nextBlockId,
          blockLength: numWeeks,
          progressionRate,
          deloadRate,
          createdAt: new Date().toISOString(),
          weeks: blockForAPI.weeks
        };

        saveTrainingBlock(blockForStorage);
        navigate(`/block/${nextBlockId}`);
        
        setError('Warning: Saved to local storage only. API unavailable.');
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      setError(`Error generating block: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (inputMethod === 'copy') {
      getAllBlocks()
        .then((list) => setBlocksList(Array.isArray(list) ? list : []))
        .catch(() => setBlocksList([]));
    }
  }, [inputMethod]);

  const getCurrentData = () => {
    if (inputMethod === 'copy') return copySourceBlockId ? { copy: true } : null;
    return manualWeekData;
  };

  const currentData = getCurrentData();

  return (
    <div className="min-h-screen bg-gray-900 pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link to="/blocks" className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-sm font-medium">
            <ChevronLeft className="w-5 h-5" /> Back to Blocks
          </Link>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-100 mb-2 flex items-center gap-3">
          <Dumbbell className="w-10 h-10 text-amber-500" />
          Create Training Block
        </h1>
        <p className="text-lg text-gray-400 mb-8">
          Set up a progressive overload training block
        </p>

        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-4 sm:p-8 space-y-8">
          {/* Method Selection */}
          <div>
            <h2 className="text-2xl font-bold text-gray-200 mb-4">Input Method</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setInputMethod('manual');
                  setError('');
                }}
                className={`px-4 py-4 rounded-xl font-bold text-lg transition-all min-h-[56px] flex items-center justify-center gap-2 ${
                  inputMethod === 'manual'
                    ? 'bg-amber-500 text-gray-900 shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                }`}
              >
                <PenLine className="w-6 h-6" />
                Manual Builder
              </button>
              <button
                onClick={() => {
                  setInputMethod('copy');
                  setError('');
                }}
                className={`px-4 py-4 rounded-xl font-bold text-lg transition-all min-h-[56px] flex items-center justify-center gap-2 ${
                  inputMethod === 'copy'
                    ? 'bg-amber-500 text-gray-900 shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                }`}
              >
                <Copy className="w-6 h-6" />
                Copy from Block
              </button>
            </div>
          </div>

          {/* Copy from Block Method */}
          {inputMethod === 'copy' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-200 mb-4">Copy an Existing Block</h2>
              <p className="text-gray-400 text-sm">
                Select a block to copy. All weeks, days, and exercises are duplicated. You can optionally increase every load by a percentage (e.g. 10 for +10%).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Block to copy *</label>
                  <select
                    value={copySourceBlockId}
                    onChange={(e) => setCopySourceBlockId(e.target.value)}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-600 rounded-xl focus:outline-none focus:border-amber-500 bg-gray-700 text-gray-100"
                  >
                    <option value="">— Select a block —</option>
                    {blocksList.map((b) => (
                      <option key={b.id} value={b.id}>
                        Block {b.id} — {b.blockLength} weeks
                      </option>
                    ))}
                  </select>
                    {blocksList.length === 0 && (
                    <p className="mt-1 text-sm text-gray-500">No blocks found. Create one first.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Increase load by (%)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={loadIncreasePct}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v !== '' && !/^-?\d*\.?\d*$/.test(v)) return;
                      setLoadIncreasePct(v);
                    }}
                    placeholder="0"
                    className="w-full px-4 py-3 text-lg border-2 border-gray-600 rounded-xl focus:outline-none focus:border-amber-500 bg-gray-700 text-gray-100"
                  />
                  <p className="mt-1 text-sm text-gray-500">e.g. 10 for +10% on all weights. Use 0 to copy as-is.</p>
                </div>
              </div>
            </div>
          )}

          {/* Manual Builder Method */}
          {inputMethod === 'manual' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-200 mb-4">Build Your Week 1 Program</h2>
              
              {/* Days and Weeks Controls */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Days Control */}
                <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
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

                {/* Weeks Control */}
                <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-300">
                      Number of Weeks
                    </label>
                    <span className="text-lg font-bold text-gray-100">{numWeeks}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRemoveWeek}
                      disabled={numWeeks <= 1}
                      className="flex-1 px-3 py-2 bg-gray-600 text-gray-200 rounded-lg font-bold hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-colors"
                    >
                      −
                    </button>
                    <button
                      onClick={handleAddWeek}
                      disabled={numWeeks >= 10}
                      className="flex-1 px-3 py-2 bg-gray-600 text-gray-200 rounded-lg font-bold hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-colors"
                    >
                      +
                    </button>
                  </div>
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

              {/* Week Preview */}
              {Object.values(manualWeekData).some(day => day.length > 0) && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <p className="text-amber-400 font-semibold mb-2">Week 1 Preview:</p>
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
            </div>
          )}

          {/* Block Configuration - hide for copy mode */}
          {inputMethod !== 'copy' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-200 mb-4">Block Configuration</h2>

            {/* Progression Rate */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Weekly Progression Rate: {(progressionRate * 100).toFixed(1)}%
              </label>
              <input
                type="range"
                min="0.05"
                max="0.15"
                step="0.005"
                value={progressionRate}
                onChange={(e) => setProgressionRate(parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5%</span>
                <span>10%</span>
                <span>15%</span>
              </div>
            </div>

            {/* Deload Rate */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Deload Week Percentage: {(deloadRate * 100).toFixed(0)}% of Week 1
              </label>
              <input
                type="range"
                min="0.70"
                max="0.90"
                step="0.01"
                value={deloadRate}
                onChange={(e) => setDeloadRate(parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>70%</span>
                <span>80%</span>
                <span>90%</span>
              </div>
            </div>
          </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-700 rounded-xl text-red-300">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/blocks')}
              className="flex-1 px-6 py-5 bg-gray-600 text-gray-200 rounded-xl font-bold text-lg hover:bg-gray-500 active:bg-gray-400 transition-colors shadow-md min-h-[56px]"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateBlock}
              disabled={
                isGenerating ||
                (inputMethod === 'copy' && !copySourceBlockId) ||
                (inputMethod === 'manual' && !Object.values(manualWeekData).some(day => day.length > 0))
              }
              className="flex-1 px-6 py-5 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-500 active:bg-emerald-700 transition-colors shadow-lg min-h-[56px] disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isGenerating ? (inputMethod === 'copy' ? 'Copying Block...' : 'Generating Block...') : (inputMethod === 'copy' ? 'Copy & Create Block' : 'Generate Training Block')}
            </button>
          </div>

          {/* Preview Info */}
          {inputMethod === 'copy' && copySourceBlockId && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-amber-400 font-semibold mb-2">Copy preview:</p>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>Same structure as selected block (weeks, days, exercises)</li>
                <li>All loads {loadIncreasePct && Number(loadIncreasePct) !== 0 ? `increased by ${loadIncreasePct}%` : 'unchanged'}</li>
              </ul>
            </div>
          )}
          {currentData && inputMethod !== 'copy' && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-amber-400 font-semibold mb-2">Block Preview:</p>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>� Week 1: Base weights (from manual builder)</li>
                <li>� Weeks 2-{numWeeks - 1}: +{(progressionRate * 100).toFixed(1)}% per week</li>
                <li>� Week {numWeeks}: Deload at {(deloadRate * 100).toFixed(0)}% of Week 1</li>
                <li>� Weights rounded to nearest 2.5kg</li>
              </ul>
            </div>
          )}
        </div>
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

export default BlockSetup;
