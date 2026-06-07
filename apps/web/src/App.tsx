import { Routes, Route } from 'react-router-dom';
import './App.css';
import AuthGuard from './components/AuthGuard';
import Navbar from './components/Navbar';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Assessment from './pages/Assessment';
import Profile from './pages/Profile';
import Plan from './pages/Plan';
import WorkoutDetail from './pages/WorkoutDetail';
import WorkoutPlayer from './pages/WorkoutPlayer';
import Feedback from './pages/Feedback';
import History from './pages/History';
import Measurements from './pages/Measurements';
import Achievements from './pages/Achievements';
import Settings from './pages/Settings';
import Exercises from './pages/Exercises';
import Report from './pages/Report';
import Goals from './pages/Goals';
import Buddy from './pages/Buddy';
import InstallPrompt from './components/InstallPrompt';

function App() {
  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <Navbar />
      <InstallPrompt />
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
        <Route path="/assessment" element={<AuthGuard><Assessment /></AuthGuard>} />
        <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
        <Route path="/plan" element={<AuthGuard><Plan /></AuthGuard>} />
        <Route path="/workout/:id" element={<AuthGuard><WorkoutDetail /></AuthGuard>} />
        <Route path="/play/:id" element={<AuthGuard><WorkoutPlayer /></AuthGuard>} />
        <Route path="/feedback" element={<AuthGuard><Feedback /></AuthGuard>} />
        <Route path="/history" element={<AuthGuard><History /></AuthGuard>} />
        <Route path="/measurements" element={<AuthGuard><Measurements /></AuthGuard>} />
        <Route path="/achievements" element={<AuthGuard><Achievements /></AuthGuard>} />
        <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />
        <Route path="/exercises" element={<AuthGuard><Exercises /></AuthGuard>} />
        <Route path="/report" element={<AuthGuard><Report /></AuthGuard>} />
        <Route path="/goals" element={<AuthGuard><Goals /></AuthGuard>} />
        <Route path="/buddy" element={<AuthGuard><Buddy /></AuthGuard>} />
      </Routes>
    </div>
  );
}

export default App;
