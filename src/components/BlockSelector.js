import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTrainingBlocks } from '../utils/workoutStorage';

const BlockSelector = () => {
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    const loadedBlocks = getTrainingBlocks();
    setBlocks(loadedBlocks);
  }, []);

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
              <Link
                key={block.blockId}
                to={`/block/${block.blockId}`}
                className="block bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow active:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
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
                  </div>
                  <div className="text-blue-600 font-semibold text-lg">
                    View Block →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockSelector;

