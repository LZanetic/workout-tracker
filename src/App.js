import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WorkoutProvider } from './context/WorkoutContext';
import { initStorage } from './utils/workoutStorage';
import Home from './components/Home';
import DayView from './components/DayView';
import History from './components/History';
import BlockSelector from './components/BlockSelector';
import BlockSetup from './components/BlockSetup';
import WeekSelector from './components/WeekSelector';

function App() {
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    initStorage().then(() => setStorageReady(true));
  }, []);

  if (!storageReady) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  // App lives at /workout-tracker (GitHub Pages and local dev when homepage is set) so Router uses basename
  const pub = process.env.PUBLIC_URL || '';
  const basePath = pub.startsWith('http') ? new URL(pub).pathname.replace(/\/$/, '') : (pub || '').replace(/\/$/, '');
  const basename = basePath || '';

  return (
    <WorkoutProvider>
      <Router basename={basename}>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Legacy routes for backward compatibility */}
          <Route path="/day/:dayNumber" element={<DayView />} />
          {/* New block-based routes */}
          <Route path="/blocks" element={<BlockSelector />} />
          <Route path="/block/setup" element={<BlockSetup />} />
          <Route path="/block/:blockId" element={<WeekSelector />} />
          <Route path="/block/:blockId/week/:weekNumber" element={<DayView />} />
          <Route path="/block/:blockId/week/:weekNumber/day/:dayNumber" element={<DayView />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </Router>
    </WorkoutProvider>
  );
}

export default App;
