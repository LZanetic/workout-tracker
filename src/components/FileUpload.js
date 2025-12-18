import { useState } from 'react';

const FileUpload = ({ onFileUpload }) => {
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setError('');
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
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Upload Workout CSV File
        </label>
        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            cursor-pointer"
        />
      </div>
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      <p className="text-xs text-gray-500 mt-2">
        Expected format: Day,Exercise,Sets,Reps,LoadMin,LoadMax,RPE
      </p>
    </div>
  );
};

export default FileUpload;

