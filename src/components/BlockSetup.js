import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from './FileUpload';
import { parseBlockCSV } from '../utils/blockCsvParser';
import { generateBlockWeeks } from '../utils/blockProgression';
import { saveTrainingBlock } from '../utils/workoutStorage';
import { createBlock } from '../services/api';
import { transformBlockForAPI } from '../utils/apiTransformers';
import ExerciseForm from './ExerciseForm';
import DayBuilder from './DayBuilder';

const BlockSetup = () => {
  const navigate = useNavigate();
  const [inputMethod, setInputMethod] = useState('csv'); // 'csv' or 'manual'
  const [week1Data, setWeek1Data] = useState(null);
  const [blockLength, setBlockLength] = useState(5);
  const [progressionRate, setProgressionRate] = useState(0.075);
  const [deloadRate, setDeloadRate] = useState(0.85);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleFileUpload = (csvText) => {
    // Clear error before attempting to parse
    setError('');
    try {
      const parsed = parseBlockCSV(csvText);
      setWeek1Data(parsed);
      setError('');
    } catch (err) {
      setError(err.message);
      setWeek1Data(null);
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
      BaseLoadMin: exerciseData.loadMin,
      BaseLoadMax: exerciseData.loadMax,
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
    const dataToUse = inputMethod === 'csv' ? week1Data : manualWeekData;
    
    if (!dataToUse) {
      setError(inputMethod === 'csv' 
        ? 'Please upload Week 1 CSV file first'
        : 'Please add at least one exercise to generate a block');
      return;
    }

    // Validate manual data has at least one exercise
    if (inputMethod === 'manual') {
      const hasExercises = Object.values(manualWeekData).some(day => day.length > 0);
      if (!hasExercises) {
        setError('Please add at least one exercise to generate a block');
        return;
      }
      // Use manual builder's week count if in manual mode
      setBlockLength(numWeeks);
    }

    setIsGenerating(true);
    setError('');

    try {
      // Use manual builder's week count if in manual mode, otherwise use blockLength
      const weeksToGenerate = inputMethod === 'manual' ? numWeeks : blockLength;
      // Generate all weeks
      const weeks = generateBlockWeeks(dataToUse, weeksToGenerate, progressionRate, deloadRate);

      // Create block object for API
      const blockForAPI = {
        blockLength: weeksToGenerate,
        progressionRate,
        deloadRate,
        weeks: weeks.map(week => ({
          weekNumber: week.weekNumber,
          days: Object.keys(week.days).map(dayNum => ({
            dayNumber: parseInt(dayNum, 10),
            exercises: week.days[dayNum]
          }))
        }))
      };

      // Try API first, fallback to localStorage on error
      try {
        const apiBlockData = transformBlockForAPI(blockForAPI);
        const createdBlock = await createBlock(apiBlockData);
        
        // Also save to localStorage as backup
        const blockForStorage = {
          blockId: createdBlock.id,
          blockLength: weeksToGenerate,
          progressionRate,
          deloadRate,
          createdAt: new Date().toISOString(),
          weeks: blockForAPI.weeks
        };
        saveTrainingBlock(blockForStorage);

        // Navigate to block view
        navigate(`/block/${createdBlock.id}`);
      } catch (apiError) {
        console.warn('API call failed, using localStorage fallback:', apiError);
        
        // Fallback to localStorage
        const existingBlocks = JSON.parse(localStorage.getItem('training_blocks') || '[]');
        const nextBlockId = existingBlocks.length > 0 
          ? Math.max(...existingBlocks.map(b => b.blockId)) + 1 
          : 1;

        const blockForStorage = {
          blockId: nextBlockId,
          blockLength: weeksToGenerate,
          progressionRate,
          deloadRate,
          createdAt: new Date().toISOString(),
          weeks: blockForAPI.weeks
        };

        saveTrainingBlock(blockForStorage);
        navigate(`/block/${nextBlockId}`);
        
        // Show warning but don't block user
        setError('Warning: Saved to local storage only. API unavailable.');
        setTimeout(() => setError(''), 5000);
      }
    } catch (err) {
      setError(`Error generating block: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const getCurrentData = () => {
    return inputMethod === 'csv' ? week1Data : manualWeekData;
  };

  const currentData = getCurrentData();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">
          Create Training Block
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Set up a progressive overload training block
        </p>

        <div className="bg-white rounded-2xl shadow-md p-4 sm:p-8 space-y-8">
          {/* Method Selection */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Input Method</h2>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 1: Upload Week 1 Base Program</h2>
              <p className="text-gray-600 mb-4 text-sm">
                Upload your Week 1 CSV file with format: Day,Exercise,Sets,Reps,BaseLoadMin,BaseLoadMax,RPE
              </p>
              <FileUpload 
                onFileUpload={handleFileUpload}
                onFileSelect={() => setError('')}
              />
              {week1Data && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 font-semibold">
                    ? Week 1 program loaded successfully
                  </p>
                  <p className="text-green-600 text-sm mt-1">
                    {Object.keys(week1Data).length} days found
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Manual Builder Method */}
          {inputMethod === 'manual' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Build Your Week 1 Program</h2>
              
              {/* Days and Weeks Controls */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Days Control */}
                <div className="bg-gray-50 rounded-xl p-4">
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

                {/* Weeks Control */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Number of Weeks
                    </label>
                    <span className="text-lg font-bold text-gray-900">{numWeeks}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRemoveWeek}
                      disabled={numWeeks <= 1}
                      className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                    >
                      −
                    </button>
                    <button
                      onClick={handleAddWeek}
                      disabled={numWeeks >= 10}
                      className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
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
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 font-semibold mb-2">Week 1 Preview:</p>
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
            </div>
          )}

          {/* Block Configuration */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Block Configuration</h2>
            
            {/* Block Length - Only show for CSV mode */}
            {inputMethod === 'csv' && (
              <div className="mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Block Length (weeks)
                    </label>
                    <span className="text-lg font-bold text-gray-900">{blockLength}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBlockLength(Math.max(1, blockLength - 1))}
                      disabled={blockLength <= 1}
                      className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                    >
                      −
                    </button>
                    <button
                      onClick={() => setBlockLength(Math.min(12, blockLength + 1))}
                      disabled={blockLength >= 12}
                      className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Progression Rate */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Weekly Progression Rate: {(progressionRate * 100).toFixed(1)}%
              </label>
              <input
                type="range"
                min="0.05"
                max="0.15"
                step="0.005"
                value={progressionRate}
                onChange={(e) => setProgressionRate(parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5%</span>
                <span>10%</span>
                <span>15%</span>
              </div>
            </div>

            {/* Deload Rate */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Deload Week Percentage: {(deloadRate * 100).toFixed(0)}% of Week 1
              </label>
              <input
                type="range"
                min="0.70"
                max="0.90"
                step="0.01"
                value={deloadRate}
                onChange={(e) => setDeloadRate(parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>70%</span>
                <span>80%</span>
                <span>90%</span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/blocks')}
              className="flex-1 px-6 py-5 bg-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-300 active:bg-gray-400 transition-colors shadow-md min-h-[56px]"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateBlock}
              disabled={!currentData || isGenerating || (inputMethod === 'manual' && !Object.values(manualWeekData).some(day => day.length > 0))}
              className="flex-1 px-6 py-5 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 active:bg-green-800 transition-colors shadow-lg min-h-[56px] disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating Block...' : 'Generate Training Block'}
            </button>
          </div>

          {/* Preview Info */}
          {currentData && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 font-semibold mb-2">Block Preview:</p>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>� Week 1: Base weights {inputMethod === 'csv' ? '(from CSV)' : '(from manual builder)'}</li>
                <li>� Weeks 2-{blockLength - 1}: +{(progressionRate * 100).toFixed(1)}% per week</li>
                <li>� Week {inputMethod === 'manual' ? numWeeks : blockLength}: Deload at {(deloadRate * 100).toFixed(0)}% of Week 1</li>
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
