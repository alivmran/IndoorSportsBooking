import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="logo-container">
        <img src="/Artboard1.png" alt="Logo" className="logo-img" />
        <span className="logo-text">SportsBooking</span>
      </div>
      <div className="links">
        {user && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            {!user.isAdmin && <Link to="/mybookings">My Bookings</Link>}
            {user.isAdmin && <Link to="/admin/bookings">Admin Requests</Link>}
            <button onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;