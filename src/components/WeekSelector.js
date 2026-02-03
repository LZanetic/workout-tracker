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
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
          <Link
            to="/blocks"
            className="inline-flex items-center gap-2 mb-6 text-amber-400 hover:text-amber-300 font-medium text-base py-2 px-1 min-h-[44px]"
          >
            <ChevronLeft className="w-5 h-5" /> Back to Blocks
          </Link>
          <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-8 text-center">
            <h1 className="text-4xl font-bold text-gray-100 mb-2">Block not found</h1>
            <p className="text-lg text-gray-400">The requested training block does not exist.</p>
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
    <div className="min-h-screen bg-gray-900 pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
        {/* Navigation */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Link
            to="/blocks"
            className="text-amber-400 hover:text-amber-300 font-medium text-base py-2 px-1 min-h-[44px] flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" /> Back to Blocks
          </Link>
        </div>

        {/* Block Header */}
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-2 flex items-center gap-3">
            <Calendar className="w-9 h-9 text-amber-500" />
            Block {block.blockId}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <span>{block.blockLength} weeks</span>
            <span>•</span>
            <span>Progression: +{(block.progressionRate * 100).toFixed(1)}%/week</span>
            <span>•</span>
            <span>Deload: {(block.deloadRate * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Week Tabs - Sticky */}
        <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 shadow-sm mb-6 -mx-4 px-4 pb-3 pt-2">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide py-2">
            {(block.weeks || []).map((week) => {
              const days = getDaysArray(week);
              const firstDay = days.length > 0 ? days[0].dayNumber : 1;
              const completed = getCompletedCountForWeek(week.weekNumber);
              const total = days.length;
              const allDone = total > 0 && completed === total;
              return (
                <Link
                  key={week.weekNumber}
                  to={`/block/${blockId}/week/${week.weekNumber}/day/${firstDay}`}
                  className={`flex-shrink-0 px-5 py-3 rounded-xl font-bold text-base transition-all min-h-[44px] flex items-center justify-center gap-1.5 ${
                    allDone ? 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/40 border border-emerald-500/50' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Week {week.weekNumber}
                  {total > 0 && <span className="text-xs opacity-80">({completed}/{total})</span>}
                  {week.weekNumber === block.blockLength && (
                    <span className="ml-1 text-xs">(Deload)</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Week Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(block.weeks || []).map((week) => {
            const days = getDaysArray(week);
            const firstDay = days.length > 0 ? days[0].dayNumber : 1;
            return (
              <Link
                key={week.weekNumber}
                to={`/block/${blockId}/week/${week.weekNumber}/day/${firstDay}`}
                className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6 hover:border-gray-600 transition-colors active:shadow-md"
              >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-100">
                  Week {week.weekNumber}
                </h2>
                {week.weekNumber === block.blockLength && (
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-semibold border border-amber-500/50">
                    Deload
                  </span>
                )}
                {week.weekNumber === 1 && (
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-semibold border border-amber-500/50">
                    Base
                  </span>
                )}
              </div>
              <p className="text-gray-400 mb-4">
                {(() => {
                  const completed = getCompletedCountForWeek(week.weekNumber);
                  const total = days.length;
                  if (total === 0) return `${days.length} ${days.length === 1 ? 'day' : 'days'}`;
                  if (completed === total) {
                    return (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                        {completed}/{total} days completed
                      </span>
                    );
                  }
                  return `${completed}/${total} days completed`;
                })()}
              </p>
              <div className="text-amber-400 font-semibold flex items-center gap-1">
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

