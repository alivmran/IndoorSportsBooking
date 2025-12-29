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
      <div className="logo-container" onClick={() => navigate('/')}>
        <img src="/Artboard1.png" alt="Logo" className="logo-img" />
        <span className="logo-text">SportsBooking</span>
      </div>
      
      <div className="links">
        {/* THIS IS THE BROWSE COURTS LINK */}
        <Link to="/courts" className="nav-action">Browse Courts</Link>

        {user ? (
          <>
            {!user.isAdmin && (
              <>
                <Link to="/find-team" className="nav-action">Find A Team</Link>
                <Link to="/profile" className="nav-action">Profile</Link>
              </>
            )}
            {user.isAdmin && (
              <>
                <Link to="/admin/bookings" className="nav-action">Manage Bookings</Link>
                <span className="admin-badge">Admin</span>
              </>
            )}
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
           <Link to="/login" className="login-btn">Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;