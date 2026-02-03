import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutList, Home, History, Plus, Trash2, ArrowRight, Dumbbell } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { getTrainingBlocks, deleteTrainingBlock, clearWorkoutsByDay } from '../utils/workoutStorage';
import { getAllBlocks, deleteBlock, getBlockProgress } from '../services/api';

const sortBlocksNewestFirst = (list) => {
  return [...list].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : (a.blockId ?? a.id) ?? 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : (b.blockId ?? b.id) ?? 0;
    return bTime - aTime; // newest first
  });
};

const BlockSelector = () => {
  const { standaloneBlockId, setStandaloneBlockId, setWorkoutsByDay } = useWorkout();
  const [blocks, setBlocks] = useState([]);
  const [blockProgress, setBlockProgress] = useState({}); // { blockId: completedWorkoutCount }
  const [error, setError] = useState('');

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
          setBlocks(sortBlocksNewestFirst(transformedBlocks));
        } catch (apiError) {
          console.warn('API load failed, using localStorage:', apiError);
          const loadedBlocks = getTrainingBlocks();
          setBlocks(sortBlocksNewestFirst(loadedBlocks));
        }
      } catch (err) {
        console.error('Error loading blocks:', err);
        const loadedBlocks = getTrainingBlocks();
        setBlocks(sortBlocksNewestFirst(loadedBlocks));
      }
    };
    loadBlocks();
  }, []);

  useEffect(() => {
    if (blocks.length === 0) return;
    const loadProgress = async () => {
      const progressMap = {};
      await Promise.all(
        blocks.map(async (block) => {
          const id = block.blockId ?? block.id;
          if (id == null) return;
          try {
            const progress = await getBlockProgress(Number(id));
            progressMap[id] = Array.isArray(progress) ? progress.length : 0;
          } catch {
            progressMap[id] = 0;
          }
        })
      );
      setBlockProgress(progressMap);
    };
    loadProgress();
  }, [blocks]);

  const handleDeleteBlock = async (blockId, e) => {
    e.preventDefault();
    e.stopPropagation();
    const idNum = Number(blockId);
    const isStandalone = standaloneBlockId != null && (blockId === standaloneBlockId || idNum === standaloneBlockId);
    const label = isStandalone ? 'My Workouts' : `Block ${blockId}`;
    if (window.confirm(`Are you sure you want to delete ${label}? This action cannot be undone.`)) {
      try {
        await deleteBlock(blockId);
        deleteTrainingBlock(blockId);
        if (isStandalone) {
          // Clear both localStorage keys so refresh shows no standalone/available days
          clearWorkoutsByDay();       // 'workouts_by_day'
          setStandaloneBlockId(null); // 'workout_standalone_block_id'
          setWorkoutsByDay({});       // context so Home "Available Days" disappears
        }
        const apiBlocks = await getAllBlocks();
        const transformedBlocks = apiBlocks.map(block => ({
          blockId: block.id,
          blockLength: block.blockLength,
          progressionRate: block.progressionRate,
          deloadRate: block.deloadRate,
          createdAt: block.createdAt,
          weeks: block.weeks
        }));
        setBlocks(sortBlocksNewestFirst(transformedBlocks));
        setBlockProgress(prev => {
          const next = { ...prev };
          delete next[blockId];
          return next;
        });
      } catch (apiError) {
        setError(apiError.message || 'Failed to delete block. Is the backend running?');
        setTimeout(() => setError(''), 5000);
        // Still remove the block from UI and clear standalone/localStorage so it doesn't persist
        setBlocks(prev => prev.filter(b => Number(b.blockId ?? b.id) !== idNum));
        setBlockProgress(prev => {
          const next = { ...prev };
          delete next[idNum];
          delete next[blockId];
          return next;
        });
        if (isStandalone) {
          clearWorkoutsByDay();
          setStandaloneBlockId(null);
          setWorkoutsByDay({});
        }
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
    <div className="min-h-screen bg-gray-900 pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
        {/* Navigation Links */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Link
            to="/"
            className="text-amber-400 hover:text-amber-300 font-medium text-base py-2 px-1 min-h-[44px] flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Home
          </Link>
          <Link
            to="/history"
            className="text-gray-300 hover:text-gray-200 font-medium text-base py-2 px-1 min-h-[44px] flex items-center gap-2"
          >
            <History className="w-5 h-5" />
            History
          </Link>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 rounded-xl text-red-300">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-100 mb-2 flex items-center gap-3">
              <LayoutList className="w-10 h-10 text-amber-500" />
              Training Blocks
            </h1>
            <p className="text-lg text-gray-400">
              {blocks.length} {blocks.length === 1 ? 'block' : 'blocks'} available
            </p>
          </div>
          <Link
            to="/block/setup"
            className="px-6 py-3 bg-amber-500 text-gray-900 rounded-xl font-bold text-base hover:bg-amber-400 transition-colors shadow-md min-h-[48px] flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Block
          </Link>
        </div>

        {blocks.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8 text-center">
            <Dumbbell className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-xl text-gray-400 mb-4">No training blocks created yet</p>
            <p className="text-gray-500 mb-6">Create your first training block to get started!</p>
            <Link
              to="/block/setup"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-gray-900 rounded-xl font-bold text-base hover:bg-amber-400 transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
              Create Training Block
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {[...blocks]
              .sort((a, b) => {
                const aId = a.blockId ?? a.id;
                const bId = b.blockId ?? b.id;
                if (standaloneBlockId == null) return 0;
                if (aId === standaloneBlockId) return -1;
                if (bId === standaloneBlockId) return 1;
                return 0;
              })
              .map((block) => {
              const id = block.blockId ?? block.id;
              const isStandalone = standaloneBlockId != null && id === standaloneBlockId;
              return (
              <div
                key={id}
                className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6 hover:border-gray-600 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <Link
                    to={`/block/${id}`}
                    className="flex-1"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-gray-100">
                        {isStandalone ? 'My Workouts' : `Block ${id}`}
                      </h2>
                      {isStandalone ? (
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-semibold border border-amber-500/50">
                          Standalone
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-semibold border border-amber-500/50">
                          {block.blockLength} weeks
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 mb-2">
                      Created: {formatDate(block.createdAt)}
                    </p>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-500 items-center">
                      {!isStandalone && (
                        <>
                          <span>Progression: +{(block.progressionRate * 100).toFixed(1)}%/week</span>
                          <span>•</span>
                          <span>Deload: {(block.deloadRate * 100).toFixed(0)}%</span>
                        </>
                      )}
                      {(blockProgress[id] ?? 0) > 0 && (
                        <>
                          {!isStandalone && <span>•</span>}
                          <span className="text-emerald-400 font-semibold">
                            {(blockProgress[id] ?? 0)} workout{(blockProgress[id] ?? 0) === 1 ? '' : 's'} completed
                          </span>
                        </>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/block/${id}`}
                      className="text-amber-400 font-semibold text-lg hover:text-amber-300 flex items-center gap-1"
                    >
                      {isStandalone ? 'View Workouts' : 'View Block'}
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={(e) => handleDeleteBlock(id, e)}
                      className="px-4 py-2 bg-red-900/40 text-red-300 rounded-lg text-sm font-semibold hover:bg-red-800/50 border border-red-700/50 transition-colors min-h-[44px] flex items-center gap-2"
                      aria-label={isStandalone ? 'Delete standalone workouts' : 'Delete block'}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );})}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockSelector;

