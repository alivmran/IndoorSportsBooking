import { useContext, useEffect, useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import API from '../api/axios';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { Bell, Menu, X, LogOut, User, LayoutDashboard, Search, ShieldCheck } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isSuperAdmin = user && (user.role === 'admin' || user.isAdmin);
  const isManager = user && user.role === 'manager';
  const isUser = user && user.role === 'user';

  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user && user.token) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const socket = io(apiUrl);
      socket.emit('register', user._id);
      
      socket.on('newNotification', (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        toast.info(notification.message);
      });
      
      socket.on('refreshBookings', () => {
        window.dispatchEvent(new Event('refreshBookings'));
      });
      
      return () => socket.disconnect();
    }
  }, [user]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (user && user.token) {
        try {
          const res = await API.get('/notifications');
          setNotifications(res.data);
          setUnreadCount(res.data.filter(n => !n.isRead).length);
        } catch (error) {
          console.error('Failed to fetch notifications');
        }
      }
    };
    fetchNotifications();
  }, [user]);

  const markAsRead = async (id, link) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      setShowDropdown(false);
      if (link) navigate(link);
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
     try {
        await API.put('/notifications/read-all');
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
     } catch (error) {
        console.error(error);
     }
  };

  const goHome = () => {
      if(isSuperAdmin) navigate('/admin/dashboard');
      else if(isManager) navigate('/manager/dashboard');
      else navigate('/');
  }

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo Section */}
        <div className="logo-section" onClick={goHome}>
          <div className="logo-wrapper">
            <img src="/khelo-logo.png" alt="Logo" className="logo-img" />
          </div>
          <span className="logo-text">KHELO <span className="text-blue">KARACHI</span></span>
        </div>

        {/* Navigation Group (Desktop) */}
        <div className="nav-content">
          <div className={`links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            {isSuperAdmin && (
              <NavLink to="/admin/dashboard" className="nav-item" onClick={closeMobile}>
                <LayoutDashboard size={18} /> Admin Panel
              </NavLink>
            )}

            {isManager && (
              <NavLink to="/manager/dashboard" className="nav-item" onClick={closeMobile}>
                <LayoutDashboard size={18} /> Dashboard
              </NavLink>
            )}

            {(!user || isUser) && (
              <NavLink to="/courts" className="nav-item" onClick={closeMobile}>
                <Search size={18} /> Browse Courts
              </NavLink>
            )}

            {isUser && (
              <>
                <NavLink to="/find-team" className="nav-item" onClick={closeMobile}>
                  <ShieldCheck size={18} /> Find Match
                </NavLink>
                <NavLink to="/profile" className="nav-item" onClick={closeMobile}>
                  <User size={18} /> Profile
                </NavLink>
              </>
            )}

            {user ? (
              <button onClick={() => { handleLogout(); closeMobile(); }} className="logout-btn mobile-only">
                <LogOut size={18} /> Logout
              </button>
            ) : (
              <NavLink to="/login" className="nav-item login-link" onClick={closeMobile}>Login</NavLink>
            )}
          </div>


          {/* Persistent Actions (Bell + Logout + Mobile Menu) */}
          <div className="nav-actions">
            {user && (
              <>
                <div className="notification-wrapper">
                  <button 
                    className={`bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    <Bell size={22} />
                    {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                  </button>
                  
                  {showDropdown && (
                    <div className="notification-dropdown">
                      <div className="dropdown-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && <button onClick={markAllAsRead} className="mark-all-btn">Mark all read</button>}
                      </div>
                      <div className="dropdown-body">
                        {!Array.isArray(notifications) || notifications.length === 0 ? (
                          <div className="no-notifs">
                            <Bell size={32} />
                            <p>All caught up!</p>
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div key={n._id} className={`notification-item ${!n.isRead ? 'unread' : ''}`} onClick={() => markAsRead(n._id, n.link)}>
                              <p>{n.message}</p>
                              <span className="time">{new Date(n.createdAt).toLocaleDateString()}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={handleLogout} className="logout-btn desktop-only">
                  <LogOut size={18} /> Logout
                </button>
              </>
            )}


            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;