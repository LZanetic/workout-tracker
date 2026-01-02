import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTrainingBlocks, deleteTrainingBlock } from '../utils/workoutStorage';
import { getAllBlocks, deleteBlock } from '../services/api';

const BlockSelector = () => {
  const [blocks, setBlocks] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadBlocks = async () => {
      try {
        // Try API first
        try {
          const apiBlocks = await getAllBlocks();
          // Transform API format (id) to localStorage format (blockId)
          const transformedBlocks = apiBlocks.map(block => ({
            blockId: block.id,
            blockLength: block.blockLength,
            progressionRate: block.progressionRate,
            deloadRate: block.deloadRate,
            createdAt: block.createdAt,
            weeks: block.weeks
          }));
          setBlocks(transformedBlocks);
        } catch (apiError) {
          console.warn('API load failed, using localStorage:', apiError);
          // Fallback to localStorage
          const loadedBlocks = getTrainingBlocks();
          setBlocks(loadedBlocks);
        }
      } catch (err) {
        console.error('Error loading blocks:', err);
        // Fallback to localStorage
        const loadedBlocks = getTrainingBlocks();
        setBlocks(loadedBlocks);
      }
    };
    loadBlocks();
  }, []);

  const handleDeleteBlock = async (blockId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete Block ${blockId}? This action cannot be undone.`)) {
      try {
        // Try API delete first
        try {
          await deleteBlock(blockId);
        } catch (apiError) {
          console.warn('API delete failed, continuing with localStorage delete:', apiError);
          // Continue with localStorage delete even if API fails for backward compatibility
        }
        // Also delete from localStorage for backward compatibility
        deleteTrainingBlock(blockId);
        // Reload blocks from API (or localStorage if API failed)
        try {
          const apiBlocks = await getAllBlocks();
          const transformedBlocks = apiBlocks.map(block => ({
            blockId: block.id,
            blockLength: block.blockLength,
            progressionRate: block.progressionRate,
            deloadRate: block.deloadRate,
            createdAt: block.createdAt,
            weeks: block.weeks
          }));
          setBlocks(transformedBlocks);
        } catch (apiError) {
          // Fallback to localStorage
          const updatedBlocks = getTrainingBlocks();
          setBlocks(updatedBlocks);
        }
      } catch (err) {
        setError('Failed to delete block: ' + err.message);
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
        {/* Navigation Links */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-800 font-medium text-base py-2 px-1 min-h-[44px] flex items-center"
          >
            ← Home
          </Link>
          <Link
            to="/history"
            className="text-blue-600 hover:text-blue-800 font-medium text-base py-2 px-1 min-h-[44px] flex items-center"
          >
            History
          </Link>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">
              Training Blocks
            </h1>
            <p className="text-lg text-gray-600">
              {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'} available
            </p>
          </div>
          <Link
            to="/block/setup"
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold text-base hover:bg-green-700 transition-colors shadow-md min-h-[48px]"
          >
            + New Block
          </Link>
        </div>

        {blocks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <p className="text-xl text-gray-600 mb-4">No training blocks created yet</p>
            <p className="text-gray-500 mb-6">Create your first training block to get started!</p>
            <Link
              to="/block/setup"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-xl font-bold text-base hover:bg-green-700 transition-colors shadow-md"
            >
              Create Training Block
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {blocks.map((block) => (
              <div
                key={block.blockId}
                className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <Link
                    to={`/block/${block.blockId}`}
                    className="flex-1"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Block {block.blockId}
                      </h2>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold">
                        {block.blockLength} weeks
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">
                      Created: {formatDate(block.createdAt)}
                    </p>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                      <span>Progression: +{(block.progressionRate * 100).toFixed(1)}%/week</span>
                      <span>•</span>
                      <span>Deload: {(block.deloadRate * 100).toFixed(0)}%</span>
                    </div>
                  </Link>
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/block/${block.blockId}`}
                      className="text-blue-600 font-semibold text-lg hover:text-blue-800"
                    >
                      View Block →
                    </Link>
                    <button
                      onClick={(e) => handleDeleteBlock(block.blockId, e)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors min-h-[44px]"
                      aria-label="Delete block"
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

export default BlockSelector;

