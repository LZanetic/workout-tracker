import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, LayoutList, History, PenLine, Calendar } from 'lucide-react';
import { getWorkoutLogs, getTrainingBlock } from '../utils/workoutStorage';

const Home = () => {
  const [currentWeek, setCurrentWeek] = useState(null);

  useEffect(() => {
    const logs = getWorkoutLogs();
    if (logs.length > 0) {
      const sortedLogs = logs.sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      const mostRecent = sortedLogs[0];
      if (mostRecent.blockId && mostRecent.week) {
        const block = getTrainingBlock(mostRecent.blockId);
        if (block) {
          const isDeload = mostRecent.week === block.blockLength;
          setCurrentWeek({
            blockId: mostRecent.blockId,
            week: mostRecent.week,
            isDeload,
            blockLength: block.blockLength
          });
        }
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6 md:p-8 text-center">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-100 flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <Dumbbell className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500" />
            Workout Tracker
          </h1>
          <p className="text-gray-400 mb-8">
            Choose how you want to train
          </p>

          <div className="grid gap-4 sm:grid-cols-1 sm:max-w-md mx-auto">
            <Link
              to="/blocks"
              className="group flex items-center gap-4 p-5 bg-gray-700 hover:bg-amber-500 rounded-2xl border border-gray-600 hover:border-amber-500 transition-colors text-left"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-500/20 group-hover:bg-amber-600 flex items-center justify-center transition-colors">
                <LayoutList className="w-6 h-6 text-amber-500 group-hover:text-gray-900 transition-colors" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-100 group-hover:text-gray-900 transition-colors">Blocks</h2>
                <p className="text-sm text-gray-400 group-hover:text-gray-800 transition-colors">Multi-week programs with progression and deload</p>
              </div>
            </Link>

            <Link
              to="/plan"
              className="group flex items-center gap-4 p-5 bg-gray-700 hover:bg-amber-500 rounded-2xl border border-gray-600 hover:border-amber-500 transition-colors text-left"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-500/20 group-hover:bg-amber-600 flex items-center justify-center transition-colors">
                <PenLine className="w-6 h-6 text-amber-500 group-hover:text-gray-900 transition-colors" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-100 group-hover:text-gray-900 transition-colors">My Workout Plan</h2>
                <p className="text-sm text-gray-400 group-hover:text-gray-800 transition-colors">Simple day-based plan (Day 1, Day 2, …)</p>
              </div>
            </Link>

            <Link
              to="/history"
              className="group flex items-center gap-4 p-5 bg-gray-700 hover:bg-amber-500 rounded-2xl border border-gray-600 hover:border-amber-500 transition-colors text-left"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-500/20 group-hover:bg-amber-600 flex items-center justify-center transition-colors">
                <History className="w-6 h-6 text-amber-500 group-hover:text-gray-900 transition-colors" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-100 group-hover:text-gray-900 transition-colors">History</h2>
                <p className="text-sm text-gray-400 group-hover:text-gray-800 transition-colors">View and manage completed workouts</p>
              </div>
            </Link>
          </div>
        </div>

        {currentWeek && (
          <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Current Week
            </h2>
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to={`/block/${currentWeek.blockId}/week/${currentWeek.week}/day/1`}
                className="px-4 py-2 bg-amber-500 text-gray-900 rounded-xl text-base font-semibold hover:bg-amber-400 transition-colors"
              >
                Block {currentWeek.blockId} – Week {currentWeek.week}
              </Link>
              {currentWeek.isDeload && (
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-semibold border border-amber-500/50">
                  Deload Week
                </span>
              )}
              {currentWeek.week < currentWeek.blockLength && (
                <span className="text-sm text-gray-400">
                  {currentWeek.blockLength - currentWeek.week} week{currentWeek.blockLength - currentWeek.week !== 1 ? 's' : ''} remaining
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
