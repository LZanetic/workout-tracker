import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Calendar, CheckCircle } from 'lucide-react';
import { getTrainingBlock } from '../utils/workoutStorage';
import { getBlock, getBlockProgress } from '../services/api';
import { getNormalizedDaysArray } from '../utils/blockProgression';

const WeekSelector = () => {
  const { blockId } = useParams();
  const [block, setBlock] = useState(null);
  const [completedWorkouts, setCompletedWorkouts] = useState([]); // { blockId, weekNumber, dayNumber }[]

  useEffect(() => {
    const loadBlock = async () => {
      try {
        // Try API first
        try {
          const apiBlock = await getBlock(parseInt(blockId, 10));
          if (apiBlock) {
            // Transform API format to localStorage format
            const transformedBlock = {
              blockId: apiBlock.id,
              blockLength: apiBlock.blockLength,
              progressionRate: apiBlock.progressionRate,
              deloadRate: apiBlock.deloadRate,
              createdAt: apiBlock.createdAt,
              weeks: apiBlock.weeks
            };
            setBlock(transformedBlock);
            return;
          }
        } catch (apiError) {
          console.warn('API load failed, using localStorage:', apiError);
        }
        // Fallback to localStorage
        const localBlock = getTrainingBlock(parseInt(blockId, 10));
        setBlock(localBlock);
      } catch (err) {
        console.error('Error loading block:', err);
        const localBlock = getTrainingBlock(parseInt(blockId, 10));
        setBlock(localBlock);
      }
    };
    loadBlock();
  }, [blockId]);

  useEffect(() => {
    if (!blockId) return;
    const loadProgress = async () => {
      try {
        const progress = await getBlockProgress(parseInt(blockId, 10));
        setCompletedWorkouts(Array.isArray(progress) ? progress : []);
      } catch (err) {
        console.warn('Could not load block progress:', err);
        setCompletedWorkouts([]);
      }
    };
    loadProgress();
  }, [blockId]);

  if (!block) {
    return (
      <div className="min-h-screen bg-gray-900 pb-24">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-3 sm:pt-6 pb-6 sm:pb-8">
          <Link
            to="/blocks"
            className="inline-flex items-center gap-2 mb-4 text-amber-400 hover:text-amber-300 font-medium text-sm sm:text-base py-2 px-1 min-h-[44px]"
          >
            <ChevronLeft className="w-5 h-5" /> Back to Blocks
          </Link>
          <div className="bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-700 p-5 sm:p-8 text-center">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-100 mb-2">Block not found</h1>
            <p className="text-sm sm:text-lg text-gray-400">The requested training block does not exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const getDaysArray = (week) => getNormalizedDaysArray(week?.days) || [];

  // Completed count per week (from API progress)
  const getCompletedCountForWeek = (weekNumber) =>
    completedWorkouts.filter(
      (w) => w.weekNumber === weekNumber && String(w.blockId) === String(block.blockId)
    ).length;

  return (
    <div className="min-h-screen bg-gray-900 pb-24 w-full max-w-[100vw] overflow-x-hidden">
      <div className="max-w-4xl mx-auto w-full box-border px-2 py-2 sm:px-4 sm:pt-6 sm:pb-8" style={{ paddingLeft: 'max(0.5rem, env(safe-area-inset-left))', paddingRight: 'max(0.5rem, env(safe-area-inset-right))' }}>
        {/* Navigation */}
        <div className="flex flex-wrap gap-1 mb-2 sm:mb-4">
          <Link
            to="/blocks"
            className="text-amber-400 hover:text-amber-300 font-medium text-sm py-1.5 px-1 min-h-[44px] flex items-center gap-1.5 sm:gap-2 sm:text-base"
          >
            <ChevronLeft className="w-5 h-5 shrink-0" /> Back to Blocks
          </Link>
        </div>

        {/* Block Header - scales with viewport */}
        <div className="bg-gray-800 rounded-lg sm:rounded-2xl border border-gray-700 p-3 mb-2 sm:p-6 sm:mb-6">
          <h1 className="text-base sm:text-3xl md:text-4xl font-bold text-gray-100 mb-1 sm:mb-2 flex items-center gap-2 min-w-0">
            <Calendar className="w-5 h-5 sm:w-8 sm:h-8 text-amber-500 shrink-0" />
            <span className="truncate">Block {block.blockId}</span>
          </h1>
          <div className="flex flex-wrap gap-x-1.5 gap-y-0 text-[11px] sm:text-sm text-gray-400">
            <span>{block.blockLength}w</span>
            <span>·</span>
            <span>+{(block.progressionRate * 100).toFixed(1)}%/wk</span>
            <span>·</span>
            <span>Dl {(block.deloadRate * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Week Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          {(block.weeks || []).map((week) => {
            const days = getDaysArray(week);
            const firstDay = days.length > 0 ? days[0].dayNumber : 1;
            return (
              <Link
                key={week.weekNumber}
                to={`/block/${blockId}/week/${week.weekNumber}/day/${firstDay}`}
                className="bg-gray-800 rounded-lg sm:rounded-2xl border border-gray-700 p-5 sm:p-6 hover:border-gray-600 transition-colors active:shadow-md min-h-[7rem] sm:min-h-[8rem] flex flex-col justify-between"
              >
              <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-100 truncate">
                  Week {week.weekNumber}
                </h2>
                {week.weekNumber === block.blockLength && (
                  <span className="px-2 py-1 sm:px-2.5 sm:py-1 bg-amber-500/20 text-amber-400 rounded text-xs sm:text-sm font-semibold border border-amber-500/50 shrink-0">
                    Deload
                  </span>
                )}
                {week.weekNumber === 1 && (
                  <span className="px-2 py-1 sm:px-2.5 sm:py-1 bg-amber-500/20 text-amber-400 rounded text-xs sm:text-sm font-semibold border border-amber-500/50 shrink-0">
                    Base
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm sm:text-base mb-3 sm:mb-4">
                {(() => {
                  const completed = getCompletedCountForWeek(week.weekNumber);
                  const total = days.length;
                  if (total === 0) return `${days.length} ${days.length === 1 ? 'day' : 'days'}`;
                  if (completed === total) {
                    return (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>{completed}/{total} done</span>
                      </span>
                    );
                  }
                  return `${completed}/${total} days completed`;
                })()}
              </p>
              <div className="text-amber-400 font-semibold text-sm sm:text-base">
                View Week →
              </div>
            </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeekSelector;

