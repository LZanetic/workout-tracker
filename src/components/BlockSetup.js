import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from './FileUpload';
import { parseBlockCSV } from '../utils/blockCsvParser';
import { generateBlockWeeks } from '../utils/blockProgression';
import { saveTrainingBlock } from '../utils/workoutStorage';

const BlockSetup = () => {
  const navigate = useNavigate();
  const [week1Data, setWeek1Data] = useState(null);
  const [blockLength, setBlockLength] = useState(5);
  const [progressionRate, setProgressionRate] = useState(0.075);
  const [deloadRate, setDeloadRate] = useState(0.85);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileUpload = (csvText) => {
    try {
      const parsed = parseBlockCSV(csvText);
      setWeek1Data(parsed);
      setError('');
    } catch (err) {
      setError(err.message);
      setWeek1Data(null);
    }
  };

  const handleGenerateBlock = () => {
    if (!week1Data) {
      setError('Please upload Week 1 CSV file first');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // Generate all weeks
      const weeks = generateBlockWeeks(week1Data, blockLength, progressionRate, deloadRate);

      // Get next block ID
      const existingBlocks = JSON.parse(localStorage.getItem('training_blocks') || '[]');
      const nextBlockId = existingBlocks.length > 0 
        ? Math.max(...existingBlocks.map(b => b.blockId)) + 1 
        : 1;

      // Create block object
      const block = {
        blockId: nextBlockId,
        blockLength,
        progressionRate,
        deloadRate,
        createdAt: new Date().toISOString(),
        weeks: weeks.map(week => ({
          weekNumber: week.weekNumber,
          days: Object.keys(week.days).map(dayNum => ({
            dayNumber: parseInt(dayNum, 10),
            exercises: week.days[dayNum]
          }))
        }))
      };

      // Save block
      saveTrainingBlock(block);

      // Navigate to block view
      navigate(`/block/${nextBlockId}`);
    } catch (err) {
      setError(`Error generating block: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">
          Create Training Block
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Set up a progressive overload training block
        </p>

        <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 space-y-8">
          {/* Step 1: Upload Week 1 CSV */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 1: Upload Week 1 Base Program</h2>
            <p className="text-gray-600 mb-4 text-sm">
              Upload your Week 1 CSV file with format: Day,Exercise,Sets,Reps,BaseLoadMin,BaseLoadMax,RPE
            </p>
            <FileUpload onFileUpload={handleFileUpload} />
            {week1Data && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-semibold">
                  ✓ Week 1 program loaded successfully
                </p>
                <p className="text-green-600 text-sm mt-1">
                  {Object.keys(week1Data).length} days found
                </p>
              </div>
            )}
          </div>

          {/* Step 2: Block Configuration */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Step 2: Configure Block</h2>
            
            {/* Block Length */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Block Length (weeks)
              </label>
              <div className="flex gap-3">
                {[4, 5, 6].map(length => (
                  <button
                    key={length}
                    onClick={() => setBlockLength(length)}
                    className={`flex-1 px-4 py-3 rounded-xl font-bold text-lg transition-all min-h-[56px] ${
                      blockLength === length
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {length} weeks
                  </button>
                ))}
              </div>
            </div>

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

          {/* Generate Button */}
          <button
            onClick={handleGenerateBlock}
            disabled={!week1Data || isGenerating}
            className="w-full px-6 py-5 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 active:bg-green-800 transition-colors shadow-lg min-h-[56px] disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating Block...' : 'Generate Training Block'}
          </button>

          {/* Preview Info */}
          {week1Data && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 font-semibold mb-2">Block Preview:</p>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Week 1: Base weights (from CSV)</li>
                <li>• Weeks 2-{blockLength - 1}: +{(progressionRate * 100).toFixed(1)}% per week</li>
                <li>• Week {blockLength}: Deload at {(deloadRate * 100).toFixed(0)}% of Week 1</li>
                <li>• Weights rounded to nearest 2.5kg</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockSetup;

