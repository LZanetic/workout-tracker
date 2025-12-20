import { useState, useEffect } from 'react';

const ExerciseForm = ({ exercise, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Accessory',
    sets: 3,
    reps: 10,
    loadMin: 0,
    loadMax: 0,
    rpe: 7,
    tempo: 'Controlled'
  });

  useEffect(() => {
    if (exercise) {
      setFormData({
        name: exercise.Exercise || '',
        category: exercise.Category || 'Accessory',
        sets: exercise.Sets || 3,
        reps: exercise.Reps || 10,
        loadMin: exercise.BaseLoadMin || 0,
        loadMax: exercise.BaseLoadMax || 0,
        rpe: exercise.RPE || 7,
        tempo: exercise.Tempo || 'Controlled'
      });
    }
  }, [exercise]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return;
    }
    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {exercise ? 'Edit Exercise' : 'Add Exercise'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl leading-none w-10 h-10 flex items-center justify-center"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Exercise Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Exercise Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
              placeholder="e.g., Back Squat"
              required
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="Squat">Squat</option>
              <option value="Bench">Bench</option>
              <option value="Deadlift">Deadlift</option>
              <option value="Accessory">Accessory</option>
            </select>
          </div>

          {/* Sets and Reps Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sets
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.sets}
                onChange={(e) => handleChange('sets', parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Reps
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.reps}
                onChange={(e) => handleChange('reps', parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500"
                inputMode="numeric"
              />
            </div>
          </div>

          {/* Load Min/Max Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Load Min (kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="2.5"
                  value={formData.loadMin}
                  onChange={(e) => handleChange('loadMin', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 pr-12"
                  inputMode="decimal"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                  kg
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Load Max (kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="2.5"
                  value={formData.loadMax}
                  onChange={(e) => handleChange('loadMax', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 pr-12"
                  inputMode="decimal"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                  kg
                </span>
              </div>
            </div>
          </div>

          {/* RPE */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              RPE: {formData.rpe}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={formData.rpe}
              onChange={(e) => handleChange('rpe', parseFloat(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>5.5</span>
              <span>10</span>
            </div>
          </div>

          {/* Tempo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tempo
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChange('tempo', 'Explosive')}
                className={`px-4 py-3 rounded-xl font-bold text-lg transition-all min-h-[56px] ${
                  formData.tempo === 'Explosive'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Explosive
              </button>
              <button
                type="button"
                onClick={() => handleChange('tempo', 'Controlled')}
                className={`px-4 py-3 rounded-xl font-bold text-lg transition-all min-h-[56px] ${
                  formData.tempo === 'Controlled'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Controlled
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-300 min-h-[56px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 min-h-[56px]"
            >
              {exercise ? 'Update' : 'Add'} Exercise
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExerciseForm;
