import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WorkoutProvider } from './context/WorkoutContext';
import Home from './components/Home';
import DayView from './components/DayView';

function App() {
  return (
    <WorkoutProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/day/:dayNumber" element={<DayView />} />
        </Routes>
      </Router>
    </WorkoutProvider>
  );
}

export default App;
