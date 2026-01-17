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
        <Link to="/courts" className="nav-action">Browse Courts</Link>

        {user ? (
          <>
            {!user.isAdmin && (
              <>
                {/* Changed to Find A Match */}
                <Link to="/find-team" className="nav-action">Find A Match</Link>
                <Link to="/profile" className="nav-action">My Profile</Link>
              </>
            )}
            {user.isAdmin && (
              <>
                <Link to="/admin/bookings" className="nav-action">Manage Bookings</Link>
                <span className="badge" style={{background:'#ef4444', color:'white'}}>Admin</span>
              </>
            )}
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
           <Link to="/login" style={{color:'var(--primary-color)', fontWeight:'600', textDecoration:'none'}}>Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;