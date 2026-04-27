import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import AuthContext from '../context/AuthContext';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [featuredCourts, setFeaturedCourts] = useState([]);

  useEffect(() => {
    if (user && user.role === 'manager') {
      navigate('/manager/dashboard');
    } else if (user && (user.role === 'admin' || user.isAdmin)) {
      navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await API.get('/courts');
        setFeaturedCourts(data.slice(0, 4)); 
      } catch {
        console.error('Error fetching courts');
      }
    };
    fetchFeatured();
  }, []);

  const handleNav = (path) => {
    if(!user) navigate('/login');
    else navigate(path);
  };

  return (
    <div className="page-container">
      <div className="hero-banner">
        <h1>Welcome to Khello Karachi</h1>
        <p>Your sports booking and matchmaking platform in Karachi.</p>
      </div>

      {/* RESTORED: Side by Side Action Cards */}
      <div className="action-grid">
        <div className="action-card" onClick={() => handleNav('/courts')}>
          <h3>Book A Court</h3>
          <p>Find and reserve the perfect ground for your match.</p>
        </div>
        <div className="action-card" onClick={() => handleNav('/find-team')}>
          <h3>Find A Team</h3>
          <p>Challenge local teams with your own team lineup.</p>
        </div>
        <div className="action-card" onClick={() => handleNav('/profile')}>
          <h3>Profile & Team</h3>
          <p>View bookings, refunds, and match history.</p>
        </div>
      </div>

      <h2 className="section-title">Featured Courts</h2>
      <div className="courts-grid">
        {featuredCourts.map((court) => (
          <div key={court._id} className="card" onClick={() => navigate(`/courts/${court._id}`)}>
             <div className="card-header">
                <h3>{court.name}</h3>
                <span className="badge">{(court.facilities || []).join(', ')}</span>
            </div>
            <div className="card-body">
                {court.images && court.images.length > 0 ? (
                  <img src={court.images[0]} alt={court.name} className="court-thumb"/>
                ) : (
                  <div className="placeholder-img">No Image</div>
                )}
                <p className="location-tag">📍 {court.location || 'Karachi'}</p>
                <p className="price">PKR {court.pricePerHour} <span className="per-hr">/ hour</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Landing;