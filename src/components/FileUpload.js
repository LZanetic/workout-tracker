import { useState } from 'react';

const FileUpload = ({ onFileUpload, onFileSelect }) => {
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      // Clear error when no file is selected
      setError('');
      if (onFileSelect) onFileSelect();
      return;
    }

    // Clear any previous errors immediately when a new file is selected
    setError('');
    // Notify parent to clear its error state
    if (onFileSelect) onFileSelect();

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const csvText = event.target.result;
        onFileUpload(csvText);
      } catch (err) {
        setError(`Error reading file: ${err.message}`);
      }
    };

    reader.onerror = () => {
      setError('Error reading file');
    };

    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-4">
        <label
          htmlFor="csv-upload"
          className="block text-sm font-medium text-gray-300 mb-2"
        >
          Upload Workout CSV File
        </label>
        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-400
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-amber-500 file:text-gray-900
            hover:file:bg-amber-400
            cursor-pointer"
        />
      </div>
      {error && (
        <div className="mt-2 p-3 bg-red-900/30 border border-red-700 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}
      <p className="text-xs text-gray-400 mt-2">
        Expected format: Day,Exercise,Sets,Reps,BaseLoadMin,BaseLoadMax,RPE
      </p>
    </div>
  );
};

export default FileUpload;

