import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './components/Login';
import RoomSelection from './components/RoomSelection';
import Bracket from './components/Bracket';
import AdminBracketView from './components/AdminBracketView';
import Leaderboard from './components/Leaderboard';
import GameResults from './components/GameResults';
import PlayoffConfig from './components/PlayoffConfig';
import EmailVerificationNotice from './components/EmailVerificationNotice';
import AdminChecker from './components/AdminChecker';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
  
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  
  if (!user.emailVerified) return <EmailVerificationNotice />;
  
  return (
    <>
      <AdminChecker />
      {children}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/rooms" element={<PrivateRoute><RoomSelection /></PrivateRoute>} />
          <Route path="/bracket/:roomId" element={<PrivateRoute><Bracket /></PrivateRoute>} />
          <Route path="/admin/brackets/:roomId" element={<PrivateRoute><AdminBracketView /></PrivateRoute>} />
          <Route path="/leaderboard/:roomId" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
          <Route path="/game-results/:roomId" element={<PrivateRoute><GameResults /></PrivateRoute>} />
          <Route path="/admin/playoff-config" element={<PrivateRoute><PlayoffConfig /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/rooms" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
