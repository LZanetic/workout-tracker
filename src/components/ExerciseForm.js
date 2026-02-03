import { useState, useEffect, useRef } from 'react';
import { getBodyParts, getExercisesByBodyPartAndEquipment, getExerciseNames, getEquipments } from '../services/api';

const INPUT_MODE_DB = 'db';
const INPUT_MODE_FREE = 'free';
const CUSTOM_BODY_PART = 'Custom'; // DB search-by-name (suggestions)
const SEARCH_DEBOUNCE_MS = 400;

function categoryFromApiData(name, bodyPart) {
  const n = (name || '').toLowerCase();
  const b = (bodyPart || '').toLowerCase();
  if (/\bsquat\b|leg press|lunges?|hack squat|front squat|goblet squat|upper legs|lower legs|quad|glute/.test(n) || /upper legs|lower legs|quad|glute|thigh/.test(b)) return 'Squat';
  if (/\bbench\b|press|push-?up|chest press|incline|decline/.test(n) || /chest|upper arms|shoulders/.test(b)) return 'Bench';
  if (/\bdeadlift\b|romanian|rdl|stiff-?leg|back extension|good morning/.test(n) || /back|waist|lower back/.test(b)) return 'Deadlift';
  return 'Accessory';
}

const ExerciseForm = ({ exercise, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Accessory',
    equipment: '',
    sets: '3',
    reps: '10',
    loadMin: '0',
    loadMax: '0',
    rpe: 7,
    tempo: 'Controlled'
  });
  const [bodyParts, setBodyParts] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loadingEquipments, setLoadingEquipments] = useState(false);
  // First step: 'db' = search from database, 'free' = free input (no search), '' = not chosen yet
  const [inputMode, setInputMode] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [exercisesFiltered, setExercisesFiltered] = useState([]);
  const [loadingBodyParts, setLoadingBodyParts] = useState(true);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [customSuggestions, setCustomSuggestions] = useState([]);
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [showCustomSuggestions, setShowCustomSuggestions] = useState(false);

  useEffect(() => {
    setLoadingBodyParts(true);
    getBodyParts().then((list) => {
      setBodyParts(Array.isArray(list) ? list : []);
      setLoadingBodyParts(false);
    });
  }, []);

  // Lazy-load equipments only when user selects a body part (not Custom search-by-name) to reduce initial burst and 429s
  useEffect(() => {
    if (!selectedBodyPart || selectedBodyPart === CUSTOM_BODY_PART) {
      setEquipments([]);
      return;
    }
    setLoadingEquipments(true);
    getEquipments().then((list) => {
      setEquipments(Array.isArray(list) ? list : []);
      setLoadingEquipments(false);
    });
  }, [selectedBodyPart]);

  useEffect(() => {
    if (exercise) {
      setFormData({
        name: exercise.Exercise || '',
        category: exercise.Category || 'Accessory',
        equipment: exercise.Equipment || '',
        sets: exercise.Sets != null ? String(exercise.Sets) : '3',
        reps: exercise.Reps != null ? String(exercise.Reps) : '10',
        loadMin: exercise.BaseLoadMin != null ? String(exercise.BaseLoadMin) : '0',
        loadMax: exercise.BaseLoadMax != null ? String(exercise.BaseLoadMax) : '0',
        rpe: exercise.RPE ?? 7,
        tempo: exercise.Tempo || 'Controlled'
      });
      setInputMode(exercise.Exercise ? INPUT_MODE_FREE : '');
      setSelectedBodyPart(exercise.Exercise ? '' : '');
    }
  }, [exercise]);

  useEffect(() => {
    if (!selectedBodyPart || selectedBodyPart === CUSTOM_BODY_PART || !selectedEquipment) {
      setExercisesFiltered([]);
      return;
    }
    setLoadingExercises(true);
    getExercisesByBodyPartAndEquipment(selectedBodyPart, selectedEquipment).then((list) => {
      setExercisesFiltered(Array.isArray(list) ? list : []);
      setLoadingExercises(false);
    });
  }, [selectedBodyPart, selectedEquipment]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave({
      ...formData,
      sets: parseInt(formData.sets, 10) || 1,
      reps: parseInt(formData.reps, 10) || 10,
      loadMin: parseFloat(formData.loadMin) || 0,
      loadMax: parseFloat(formData.loadMax) || 0,
      rpe: typeof formData.rpe === 'number' ? formData.rpe : (parseFloat(formData.rpe) || 7)
    });
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInputModeChange = (mode) => {
    setInputMode(mode);
    if (mode === INPUT_MODE_FREE) {
      setSelectedBodyPart('');
      setSelectedEquipment('');
      setExercisesFiltered([]);
    } else if (mode === INPUT_MODE_DB) {
      handleChange('name', '');
    }
  };

  const handleBodyPartChange = (value) => {
    setSelectedBodyPart(value);
    setSelectedEquipment('');
    setExercisesFiltered([]);
    if (value !== CUSTOM_BODY_PART) handleChange('name', '');
  };

  const handleEquipmentChange = (value) => {
    setSelectedEquipment(value);
    setExercisesFiltered([]);
    handleChange('equipment', value);
    handleChange('name', '');
  };

  const handleSelectExerciseByType = (e) => {
    const idx = e.target.value;
    if (idx === '' || idx === '-1') return;
    const item = exercisesFiltered[Number(idx)];
    if (item) {
      setFormData((prev) => ({
        ...prev,
        name: item.name,
        category: categoryFromApiData(item.name, item.bodyPart),
        equipment: item.equipment || selectedEquipment || prev.equipment
      }));
    }
  };

  const searchDebounceRef = useRef(null);
  useEffect(() => () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
  }, []);

  const handleCustomNameInput = (value) => {
    handleChange('name', value);
    if (value.trim().length < 2) {
      setCustomSuggestions([]);
      setShowCustomSuggestions(false);
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
      return;
    }
    setShowCustomSuggestions(true);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      searchDebounceRef.current = null;
      setLoadingCustom(true);
      getExerciseNames(value.trim()).then((list) => {
        setCustomSuggestions(Array.isArray(list) ? list : []);
        setLoadingCustom(false);
      });
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleSelectCustomSuggestion = (item) => {
    setFormData(prev => ({
      ...prev,
      name: item.name,
      category: categoryFromApiData(item.name, item.bodyPart),
      equipment: item.equipment || prev.equipment
    }));
    setCustomSuggestions([]);
    setShowCustomSuggestions(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-100">
            {exercise ? 'Edit Exercise' : 'Add Exercise'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-3xl leading-none w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Step 1: How to add the exercise */}
          {!inputMode ? (
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                How do you want to add the exercise?
              </label>
              <select
                value=""
                onChange={(e) => handleInputModeChange(e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-600 rounded-xl focus:outline-none focus:border-amber-500 bg-gray-700 text-gray-100"
                autoFocus
              >
                <option value="">— Choose an option —</option>
                <option value={INPUT_MODE_DB}>Search from database</option>
                <option value={INPUT_MODE_FREE}>Free input (no search)</option>
              </select>
            </div>
          ) : (
            <>
          {/* DB mode: body part → equipment → exercise (or search by name) */}
          {inputMode === INPUT_MODE_DB && (
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Body part *
            </label>
            <select
              value={selectedBodyPart}
              onChange={(e) => handleBodyPartChange(e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-600 rounded-xl focus:outline-none focus:border-amber-500 bg-gray-700 text-gray-100"
            >
              <option value="">— Select body part —</option>
              {bodyParts.map((bp) => (
                <option key={bp} value={bp}>{bp}</option>
              ))}
              <option value={CUSTOM_BODY_PART}>Search by name</option>
            </select>
            {loadingBodyParts && <p className="mt-1 text-sm text-gray-400">Loading body parts...</p>}
          </div>
          )}

          {inputMode === INPUT_MODE_DB && selectedBodyPart && selectedBodyPart !== CUSTOM_BODY_PART && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Equipment *
                </label>
                <select
                  value={selectedEquipment}
                  onChange={(e) => handleEquipmentChange(e.target.value)}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-600 rounded-xl focus:outline-none focus:border-amber-500 bg-gray-700 text-gray-100"
                >
                  <option value="">— Select equipment —</option>
                  {equipments.map((eq) => (
                    <option key={eq} value={eq}>{eq}</option>
                  ))}
                </select>
                {loadingEquipments && <p className="mt-1 text-sm text-gray-400">Loading equipment...</p>}
              </div>
              {selectedEquipment && (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Exercise *
                  </label>
                  <select
                    value={(() => {
                      const i = exercisesFiltered.findIndex((e) => e.name === formData.name);
                      return i >= 0 ? i : -1;
                    })()}
                    onChange={handleSelectExerciseByType}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-600 rounded-xl focus:outline-none focus:border-amber-500 bg-gray-700 text-gray-100"
                  >
                    <option value={-1}>— Select exercise —</option>
                    {exercisesFiltered.map((item, idx) => (
                      <option key={idx} value={idx}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  {loadingExercises && <p className="mt-1 text-sm text-gray-400">Loading exercises...</p>}
                </div>
              )}
            </>
          )}

          {inputMode === INPUT_MODE_DB && selectedBodyPart === CUSTOM_BODY_PART && (
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Exercise name * (with search suggestions)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleCustomNameInput(e.target.value)}
                onBlur={() => setTimeout(() => setShowCustomSuggestions(false), 200)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-600 rounded-xl focus:outline-none focus:border-amber-500 bg-gray-700 text-gray-100"
                placeholder="e.g., Back Squat"
                autoComplete="off"
              />
              {showCustomSuggestions && (
                <ul className="absolute z-10 w-full mt-1 bg-gray-700 border-2 border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {loadingCustom ? (
                    <li className="px-4 py-3 text-gray-400">Searching...</li>
                  ) : customSuggestions.length === 0 ? (
                    <li className="px-4 py-3 text-gray-400">No matches — use the name above</li>
                  ) : (
                    customSuggestions.map((item, idx) => (
                      <li
                        key={idx}
                        role="button"
                        tabIndex={0}
                        onMouseDown={(e) => { e.preventDefault(); handleSelectCustomSuggestion(item); }}
                        className="px-4 py-3 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0"
                      >
                        <span className="font-medium text-gray-100">{item.name}</span>
                        {(item.bodyPart || item.equipment) && (
                          <span className="ml-2 text-sm text-gray-400">
                            {[item.bodyPart, item.equipment].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          )}

          {inputMode === INPUT_MODE_FREE && (
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Exercise name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-600 rounded-xl focus:outline-none focus:border-amber-500 bg-gray-700 text-gray-100"
                placeholder="Enter any exercise name"
                autoComplete="off"
              />
              <p className="mt-1 text-sm text-gray-400">No database search — type any name you like.</p>
            </div>
          )}

          {/* Sets, Reps, Load, etc. - show once input mode and exercise name path are chosen */}
          {(inputMode === INPUT_MODE_FREE || (inputMode === INPUT_MODE_DB && (selectedBodyPart === CUSTOM_BODY_PART || selectedEquipment))) && (
          <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Sets
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.sets ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v !== '' && !/^\d*$/.test(v)) return;
                  handleChange('sets', v);
                }}
                className="w-full px-4 py-3 text-lg border-2 border-gray-600 rounded-xl focus:outline-none focus:border-amber-500 bg-gray-700 text-gray-100"
                placeholder="3"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Reps
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.reps ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v !== '' && !/^\d*$/.test(v)) return;
                  handleChange('reps', v);
                }}
                className="w-full px-4 py-3 text-lg border-2 border-gray-600 rounded-xl focus:outline-none focus:border-amber-500 bg-gray-700 text-gray-100"
                placeholder="10"
              />
            </div>
          </div>

          {/* Load Min/Max Row - text inputs so user can clear and type in one action */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Load Min (kg)
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.loadMin ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v !== '' && !/^\d*\.?\d*$/.test(v)) return;
                    handleChange('loadMin', v);
                  }}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-600 rounded-xl focus:outline-none focus:border-amber-500 bg-gray-700 text-gray-100 pr-12"
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                  kg
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Load Max (kg)
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.loadMax ?? ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v !== '' && !/^\d*\.?\d*$/.test(v)) return;
                    handleChange('loadMax', v);
                  }}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-600 rounded-xl focus:outline-none focus:border-amber-500 bg-gray-700 text-gray-100 pr-12"
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                  kg
                </span>
              </div>
            </div>
          </div>

          {/* RPE */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              RPE: {formData.rpe}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={formData.rpe}
              onChange={(e) => handleChange('rpe', parseFloat(e.target.value))}
              className="w-full h-3 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1</span>
              <span>5.5</span>
              <span>10</span>
            </div>
          </div>

          {/* Tempo */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Tempo
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChange('tempo', 'Explosive')}
                className={`px-4 py-3 rounded-xl font-bold text-lg transition-all min-h-[56px] ${
                  formData.tempo === 'Explosive'
                    ? 'bg-amber-500 text-gray-900 shadow-lg'
                    : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                }`}
              >
                Explosive
              </button>
              <button
                type="button"
                onClick={() => handleChange('tempo', 'Controlled')}
                className={`px-4 py-3 rounded-xl font-bold text-lg transition-all min-h-[56px] ${
                  formData.tempo === 'Controlled'
                    ? 'bg-amber-500 text-gray-900 shadow-lg'
                    : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
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
              className="flex-1 px-4 py-3 bg-gray-600 text-gray-200 rounded-xl font-bold text-lg hover:bg-gray-500 min-h-[56px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-500 min-h-[56px]"
            >
              {exercise ? 'Update' : 'Add'} Exercise
            </button>
          </div>
          </>
          )}
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ExerciseForm;
