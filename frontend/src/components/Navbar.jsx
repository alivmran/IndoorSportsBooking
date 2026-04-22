import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isSuperAdmin = user && (user.role === 'admin' || user.isAdmin);
  const isManager = user && user.role === 'manager';
  const isUser = user && user.role === 'user'; // Or standard user

  const goHome = () => {
      if(isSuperAdmin) navigate('/admin/dashboard');
      else if(isManager) navigate('/manager/dashboard');
      else navigate('/');
  }

  return (
    <nav className="navbar">
      <div className="logo-container" onClick={goHome}>
        <img src="/Artboard1.png" alt="Logo" className="logo-img" />
        <span className="logo-text">SportsBooking</span>
      </div>
      
      <div className="links">
        {/* --- SUPER ADMIN LINKS --- */}
        {isSuperAdmin && (
            <>
                <Link to="/admin/dashboard" className="nav-action">Admin Panel</Link>
                <span className="badge" style={{background:'#ef4444', color:'white'}}>Super Admin</span>
            </>
        )}

        {/* --- MANAGER LINKS --- */}
        {isManager && (
            <>
                <Link to="/manager/dashboard" className="nav-action">Manager Dashboard</Link>
                <span className="badge" style={{background:'#10b981', color:'white'}}>Manager</span>
            </>
        )}

        {/* --- PLAYER LINKS --- */}
        {(!user || isUser) && (
            <Link to="/courts" className="nav-action">Browse Courts</Link>
        )}
        {isUser && (
            <>
                <Link to="/find-team" className="nav-action">Find Match</Link>
                <Link to="/profile" className="nav-action">My Profile</Link>
            </>
        )}

        {/* --- AUTH --- */}
        {user ? (
            <button onClick={handleLogout} style={{marginLeft:'10px'}}>Logout</button>
        ) : (
           <Link to="/login" className="login-link">Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;