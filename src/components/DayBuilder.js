const DayBuilder = ({
  dayNumber,
  exercises,
  onAddExercise,
  onEditExercise,
  onDeleteExercise,
  onMoveExercise
}) => {
  return (
    <div className="border-2 border-gray-200 rounded-xl p-4 sm:p-6 bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
          Day {dayNumber}
        </h3>
        <span className="text-sm text-gray-500 font-semibold">
          {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
        </span>
      </div>

      {/* Exercises List */}
      {exercises.length > 0 && (
        <div className="space-y-3 mb-4">
          {exercises.map((exercise, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-lg text-gray-900 truncate">
                      {exercise.Exercise}
                    </h4>
                    {exercise.Category && (
                      <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full whitespace-nowrap">
                        {exercise.Category}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
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
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
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
                      className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => onMoveExercise(index, 'down')}
                      disabled={index === exercises.length - 1}
                      className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </div>
                  
                  {/* Edit/Delete */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEditExercise(index)}
                      className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-bold"
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
                      className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-bold"
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
        className="w-full px-4 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-md min-h-[56px] flex items-center justify-center gap-2"
      >
        <span className="text-2xl">+</span>
        <span>Add Exercise</span>
      </button>

      {/* Empty State */}
      {exercises.length === 0 && (
        <p className="text-center text-gray-500 text-sm mt-2 mb-4">
          No exercises yet. Tap "Add Exercise" to get started.
        </p>
      )}
    </div>
  );
};

export default DayBuilder;
