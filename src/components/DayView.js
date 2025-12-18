import { useParams, Link } from 'react-router-dom';
import { useWorkout } from '../context/WorkoutContext';

const DayView = () => {
  const { workoutsByDay } = useWorkout();
  const { dayNumber } = useParams();
  const day = parseInt(dayNumber, 10);
  
  if (!workoutsByDay) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
          <Link
            to="/"
            className="inline-block mb-6 text-blue-600 hover:text-blue-800 font-medium text-base py-2 px-1 min-h-[44px] flex items-center"
          >
            ← Back to Upload
          </Link>
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">No workout data</h1>
            <p className="text-lg text-gray-600">Please upload a CSV file first.</p>
          </div>
        </div>
      </div>
    );
  }
  
  const exercises = workoutsByDay[day] || [];
  const allDays = Object.keys(workoutsByDay)
    .map(d => parseInt(d, 10))
    .sort((a, b) => a - b);

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* Day Tabs - Sticky at top */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide py-3">
              {allDays.map((d) => (
                <Link
                  key={d}
                  to={`/day/${d}`}
                  className={`flex-shrink-0 px-5 py-3 rounded-xl font-bold text-base transition-all min-h-[44px] flex items-center justify-center ${
                    d === day
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                  }`}
                >
                  Day {d}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
          <Link
            to="/"
            className="inline-block mb-6 text-blue-600 hover:text-blue-800 font-medium text-base py-2 px-1 min-h-[44px] flex items-center"
          >
            ← Back to Upload
          </Link>
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Day {day}</h1>
            <p className="text-lg text-gray-600">No exercises found for this day.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Day Tabs - Sticky at top with backdrop blur for better visibility */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide py-3">
            {allDays.map((d) => (
              <Link
                key={d}
                to={`/day/${d}`}
                className={`flex-shrink-0 px-5 py-3 rounded-xl font-bold text-base transition-all min-h-[44px] flex items-center justify-center ${
                  d === day
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                }`}
              >
                Day {d}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 pb-8">
        {/* Back to Upload Link - Larger touch target */}
        <Link
          to="/"
          className="inline-block mb-6 text-blue-600 hover:text-blue-800 font-medium text-base py-2 px-1 min-h-[44px] flex items-center"
        >
          ← Back to Upload
        </Link>

        {/* Day Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">Day {day}</h1>
          <p className="text-lg text-gray-600">{exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}</p>
        </div>

        {/* Exercise Cards - Larger spacing and touch targets */}
        <div className="space-y-6">
          {exercises.map((exercise, index) => {
            const loadRange = exercise.LoadMin && exercise.LoadMax
              ? `${exercise.LoadMin}-${exercise.LoadMax} kg`
              : exercise.LoadMin
              ? `${exercise.LoadMin} kg`
              : exercise.LoadMax
              ? `${exercise.LoadMax} kg`
              : null;

            return (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 sm:p-8 active:shadow-lg transition-all min-h-[120px]"
              >
                {/* Exercise Name - Much larger on mobile */}
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 leading-tight">
                  {exercise.Exercise}
                </h2>

                {/* Exercise Details - Stacked on mobile, larger fonts */}
                <div className="space-y-5 sm:grid sm:grid-cols-3 sm:gap-6 sm:space-y-0">
                  {/* Target */}
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Target
                    </span>
                    <span className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                      {exercise.Sets} sets × {exercise.Reps} reps
                    </span>
                  </div>

                  {/* Load Range */}
                  {loadRange && (
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Load Range
                      </span>
                      <span className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                        {loadRange}
                      </span>
                    </div>
                  )}

                  {/* RPE */}
                  {exercise.RPE && (
                    <div className="flex flex-col">
                      <span className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        RPE
                      </span>
                      <span className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                        {exercise.RPE}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DayView;

