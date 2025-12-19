import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WorkoutProvider } from './context/WorkoutContext';
import Home from './components/Home';
import DayView from './components/DayView';
import History from './components/History';
import BlockSelector from './components/BlockSelector';
import BlockSetup from './components/BlockSetup';
import WeekSelector from './components/WeekSelector';

function App() {
  return (
    <WorkoutProvider>
      <Router>
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
