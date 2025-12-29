import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Courts from './pages/Home'; 
import CourtDetails from './pages/CourtDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import TeamProfile from './pages/TeamProfile';
import FindTeam from './pages/FindTeam';
import AdminBookings from './pages/AdminBookings';
import ProtectedRoute from './components/ProtectedRoute';
import Requests from './pages/Requests';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  return (
    <div className="app-wrapper">
      <Navbar />
      <div className="container main-content">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Public Access to Courts */}
          <Route path="/courts" element={<Courts />} />
          <Route path="/courts/:id" element={<CourtDetails />} />

          {/* Protected Routes - Now redirects to /login if not authenticated */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <TeamProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/find-team" 
            element={
              <ProtectedRoute>
                <FindTeam />
              </ProtectedRoute>
            } 
          />
          <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
          <Route 
            path="/admin/bookings" 
            element={
              <ProtectedRoute>
                <AdminBookings />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
      <ToastContainer />
    </div>
  );
}

export default App;