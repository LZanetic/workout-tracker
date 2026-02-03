import { Plus } from 'lucide-react';

const DayBuilder = ({
  dayNumber,
  exercises,
  onAddExercise,
  onEditExercise,
  onDeleteExercise,
  onMoveExercise
}) => {
  return (
    <div className="border-2 border-gray-600 rounded-xl p-4 sm:p-6 bg-gray-700/30">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-100">
          Day {dayNumber}
        </h3>
        <span className="text-sm text-gray-400 font-semibold">
          {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
        </span>
      </div>

      {/* Exercises List */}
      {exercises.length > 0 && (
        <div className="space-y-3 mb-4">
          {exercises.map((exercise, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-xl p-4 border border-gray-600 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h4 className="font-bold text-lg text-gray-100 truncate">
                      {exercise.Exercise}
                    </h4>
                    {exercise.Category && (
                      <span className="px-2 py-1 text-xs font-semibold bg-amber-500/20 text-amber-400 rounded-full whitespace-nowrap border border-amber-500/50">
                        {exercise.Category}
                      </span>
                    )}
                    {exercise.Equipment && (
                      <span className="px-2 py-1 text-xs font-semibold bg-gray-600 text-gray-300 rounded-full whitespace-nowrap">
                        {exercise.Equipment}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                    <span className="font-semibold">
                      {exercise.Sets} × {exercise.Reps}
                    </span>
                    {(exercise.BaseLoadMin || exercise.BaseLoadMax) && (
                      <span>
                        {exercise.BaseLoadMin === exercise.BaseLoadMax
                          ? `${exercise.BaseLoadMin}kg`
                          : `${exercise.BaseLoadMin || 0}-${exercise.BaseLoadMax || 0}kg`}
                      </span>
                    )}
                    {exercise.RPE && (
                      <span>RPE {exercise.RPE}</span>
                    )}
                    {exercise.Tempo && (
                      <span className="px-2 py-0.5 bg-gray-600 rounded text-xs text-gray-300">
                        {exercise.Tempo}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {/* Move Up/Down */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => onMoveExercise(index, 'up')}
                      disabled={index === 0}
                      className="w-8 h-8 flex items-center justify-center bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold transition-colors"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => onMoveExercise(index, 'down')}
                      disabled={index === exercises.length - 1}
                      className="w-8 h-8 flex items-center justify-center bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold transition-colors"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </div>
                  
                  {/* Edit/Delete */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEditExercise(index)}
                      className="w-8 h-8 flex items-center justify-center bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 border border-amber-500/50 text-sm font-bold transition-colors"
                      aria-label="Edit"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this exercise?')) {
                          onDeleteExercise(index);
                        }
                      }}
                      className="w-8 h-8 flex items-center justify-center bg-red-900/40 text-red-300 rounded-lg hover:bg-red-800/50 border border-red-700/50 text-sm font-bold transition-colors"
                      aria-label="Delete"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Exercise Button */}
      <button
        onClick={onAddExercise}
        className="w-full px-4 py-4 bg-amber-500 text-gray-900 rounded-xl font-bold text-lg hover:bg-amber-400 active:bg-amber-600 transition-colors shadow-md min-h-[56px] flex items-center justify-center gap-2"
      >
        <Plus className="w-6 h-6" />
        <span>Add Exercise</span>
      </button>

      {/* Empty State */}
      {exercises.length === 0 && (
        <p className="text-center text-gray-400 text-sm mt-2 mb-4">
          No exercises yet. Tap "Add Exercise" to get started.
        </p>
      )}
    </div>
  );
};

export default DayBuilder;
