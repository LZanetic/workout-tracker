import { useParams, Link } from 'react-router-dom';
import { getTrainingBlock } from '../utils/workoutStorage';

const WeekSelector = () => {
  const { blockId } = useParams();
  const block = getTrainingBlock(parseInt(blockId, 10));

  if (!block) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
          <Link
            to="/blocks"
            className="inline-block mb-6 text-blue-600 hover:text-blue-800 font-medium text-base py-2 px-1 min-h-[44px] flex items-center"
          >
            ← Back to Blocks
          </Link>
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Block not found</h1>
            <p className="text-lg text-gray-600">The requested training block does not exist.</p>
          </div>
        </div>
      </div>
    );
  }

  // Get unique days from all weeks
  const allDays = new Set();
  block.weeks.forEach(week => {
    week.days.forEach(day => {
      allDays.add(day.dayNumber);
    });
  });
  const sortedDays = Array.from(allDays).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
        {/* Navigation */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Link
            to="/blocks"
            className="text-blue-600 hover:text-blue-800 font-medium text-base py-2 px-1 min-h-[44px] flex items-center"
          >
            ← Blocks
          </Link>
        </div>

        {/* Block Header */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Block {block.blockId}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>{block.blockLength} weeks</span>
            <span>•</span>
            <span>Progression: +{(block.progressionRate * 100).toFixed(1)}%/week</span>
            <span>•</span>
            <span>Deload: {(block.deloadRate * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Week Tabs - Sticky */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm mb-6 -mx-4 px-4 pb-3 pt-2">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide py-2">
            {block.weeks.map((week) => {
              const firstDay = week.days.length > 0 ? week.days[0].dayNumber : 1;
              return (
                <Link
                  key={week.weekNumber}
                  to={`/block/${blockId}/week/${week.weekNumber}/day/${firstDay}`}
                  className="flex-shrink-0 px-5 py-3 rounded-xl font-bold text-base transition-all min-h-[44px] flex items-center justify-center bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Week {week.weekNumber}
                  {week.weekNumber === block.blockLength && (
                    <span className="ml-2 text-xs">(Deload)</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Week Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {block.weeks.map((week) => {
            const firstDay = week.days.length > 0 ? week.days[0].dayNumber : 1;
            return (
              <Link
                key={week.weekNumber}
                to={`/block/${blockId}/week/${week.weekNumber}/day/${firstDay}`}
                className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow active:shadow-md"
              >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Week {week.weekNumber}
                </h2>
                {week.weekNumber === block.blockLength && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-semibold">
                    Deload
                  </span>
                )}
                {week.weekNumber === 1 && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold">
                    Base
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-4">
                {week.days.length} {week.days.length === 1 ? 'day' : 'days'}
              </p>
              <div className="text-blue-600 font-semibold">
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

