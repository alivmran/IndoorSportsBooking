import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';

const Home = () => {
  const [courts, setCourts] = useState([]);
  const [filteredCourts, setFilteredCourts] = useState([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Filter State
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Admin State (Keep existing)
  const [showAdminModal, setShowAdminModal] = useState(false);
  // ... (keep admin state and handlers from previous code if needed, simplified here for brevity of the new feature) ...

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const { data } = await API.get('/courts');
        setCourts(data);
        setFilteredCourts(data);
      } catch (error) {
        toast.error('Failed to load courts');
      }
    };
    fetchCourts();
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = courts;

    // 1. Filter by Sport Type
    if (filterType !== 'All') {
        result = result.filter(court => court.sportType === filterType);
    }

    // 2. Filter by Search Name
    if (search) {
        result = result.filter(court => 
            court.name.toLowerCase().includes(search.toLowerCase())
        );
    }

    setFilteredCourts(result);
  }, [search, filterType, courts]);

  return (
    <div className="page-container">
      <div className="header-section">
        <h1 className="page-title">Available Courts</h1>
      </div>

      {/* FILTER SECTION */}
      <div className="filter-section">
        <input 
            type="text" 
            placeholder="Search by court name..." 
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
        <div style={{display:'flex', gap:'10px'}}>
            {['All', 'Futsal', 'Padel', 'Cricket'].map(type => (
                <button 
                    key={type}
                    className={`filter-btn ${filterType === type ? 'active' : ''}`}
                    onClick={() => setFilterType(type)}
                >
                    {type}
                </button>
            ))}
        </div>
      </div>

      <div className="courts-grid">
        {filteredCourts.map((court) => (
          <div 
            key={court._id} 
            className="card" 
            onClick={() => navigate(`/courts/${court._id}`)} 
          >
            <div className="card-header">
                <h3>{court.name}</h3>
                <span className="badge">{court.sportType}</span>
            </div>
            <div className="card-body">
                {court.images && court.images.length > 0 ? (
                  <img src={court.images[0]} alt={court.name} className="court-thumb"/>
                ) : (
                  <div className="placeholder-img">No Image</div>
                )}
                
                <p className="location-tag">📍 {court.location || 'Karachi'}</p>
                <p className="price">${court.pricePerHour} <span className="per-hr">/ hour</span></p>
            </div>
            <div className="card-footer">
                 <button className="book-btn">View Details</button>
            </div>
          </div>
        ))}
        {filteredCourts.length === 0 && <p style={{color:'#888'}}>No courts found.</p>}
      </div>
    </div>
  );
};

export default Home;