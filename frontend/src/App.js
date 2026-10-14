import './App.css';
import React from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider, useAuth } from './context/AuthContext';
import { roomAPI } from './api';

import Home from './pages/Home';
import Platforms from './pages/Platforms';
import CalendarPage from './pages/Calendar';
import Profile from './pages/Profile';
import ProfileSettings from './pages/ProfileSettings';
import About from './pages/About';
import HowItWorks from './pages/HowItWorks';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ContestDetail from './pages/ContestDetail';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Practice Rooms
import PracticeRooms from './pages/PracticeRooms';
import RoomLobby from './pages/RoomLobby';
import LiveRoom from './pages/LiveRoom';
import RoomSummary from './pages/RoomSummary';

// Brain Gym Games
import BrainGymHome from './pages/BrainGymHome';
import ComplexityGame from './pages/ComplexityGame';
import DebugGame from './pages/DebugGame';
import BrainGymLeaderboard from './pages/BrainGymLeaderboard';
import BrainGymProfilePage from './pages/BrainGymProfilePage';

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function App() {
  return (
    <>
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <div className="app-shell flex min-h-screen flex-col text-slate-100">
            <Navbar />
            <main className="app-main flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="/contest/:id" element={<ContestDetail />} />
                <Route path="/platforms" element={<Platforms />} />
                <Route path="/calendar" element={<RequireAuth><CalendarPage /></RequireAuth>} />
                <Route path="/dashboard" element={<RequireAuth><Profile /></RequireAuth>} />
                <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                <Route path="/profile/settings" element={<RequireAuth><ProfileSettings /></RequireAuth>} />
                <Route path="/about" element={<About />} />
                {/* Unlisted: reachable via URL and the About page link only — intentionally not in Navbar/Footer */}
                <Route path="/how-it-works" element={<HowItWorks />} />
                {/* Unlisted: reachable via URL, About page, and Footer's Community & Legal column — intentionally not in Navbar */}
                <Route path="/contact" element={<Contact />} />
                {/* Unlisted: reachable via URL and Footer's Legal column only — intentionally not in Navbar */}
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/register" element={<Register />} />

                {/* Practice Rooms */}
                <Route path="/rooms" element={<RequireAuth><PracticeRooms /></RequireAuth>} />
                <Route path="/rooms/:id/lobby" element={<RequireAuth><RoomLobby /></RequireAuth>} />
                <Route path="/rooms/:id/live" element={<RequireAuth><LiveRoom /></RequireAuth>} />
                <Route path="/rooms/:id/summary" element={<RequireAuth><RoomSummary /></RequireAuth>} />
                <Route path="/rooms/join/:code" element={<RequireAuth><JoinRedirect /></RequireAuth>} />

                {/* Brain Gym Games */}
                <Route path="/games" element={<RequireAuth><BrainGymHome /></RequireAuth>} />
                <Route path="/games/complexity" element={<RequireAuth><ComplexityGame /></RequireAuth>} />
                <Route path="/games/debug" element={<RequireAuth><DebugGame /></RequireAuth>} />
                <Route path="/games/complexity/leaderboard" element={<RequireAuth><BrainGymLeaderboard /></RequireAuth>} />
                <Route path="/profile/brain-gym" element={<RequireAuth><BrainGymProfilePage /></RequireAuth>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
      <Toaster />
    </>
  );
}

/**
 * Handles /rooms/join/:code — joins the room and redirects to lobby.
 */
function JoinRedirect() {
  const { code } = useParams();
  const navigate = useNavigate();

  React.useEffect(() => {
    roomAPI.joinByCode(code)
      .then(({ data }) => navigate(`/rooms/${data.id}/lobby`, { replace: true }))
      .catch(() => navigate('/rooms', { replace: true }));
  }, [code, navigate]);

  return <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Joining room...</div>;
}

export default App;
