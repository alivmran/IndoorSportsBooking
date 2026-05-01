import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';

const to12Hour = (time24 = '00:00') => {
  const [hourRaw] = time24.split(':').map(Number);
  const hour = Number.isNaN(hourRaw) ? 0 : hourRaw;
  const normalized = hour % 24;
  const suffix = normalized >= 12 ? 'PM' : 'AM';
  const hour12 = normalized % 12 || 12;
  return `${hour12}:00 ${suffix}`;
};

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

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (user && user.role === 'manager') {
      navigate('/manager/dashboard');
    } else if (user && (user.role === 'admin' || user.isAdmin)) {
      navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const { data } = await API.get(`/courts?page=${page}&limit=10&search=${search}&facility=${filterType}`);
        if (data.courts) {
            setFilteredCourts(data.courts);
            setTotalPages(data.pages);
        } else {
            setFilteredCourts(data); // fallback if it returns array directly somehow
        }
      } catch {
        toast.error('Failed to load courts');
      }
    };
    
    const delayDebounceFn = setTimeout(() => {
      fetchCourts();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [page, search, filterType]);

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
                <span className="badge">{(court.facilities || []).join(', ')}</span>
            </div>
            <div className="card-body">
                {court.images && court.images.length > 0 ? (
                  <img src={court.images[0]} alt={court.name} className="court-thumb"/>
                ) : (
                  <div className="placeholder-img">No Image</div>
                )}
                
                <p className="location-tag">📍 {court.location || 'Karachi'}</p>
                <p style={{ margin:'6px 0 0 0', color:'#93c5fd', fontSize:'0.85rem', fontWeight:'600' }}>
                  🕒 Open: {to12Hour(court.operationalStartTime || '00:00')} - {to12Hour(court.operationalEndTime || '24:00')}
                </p>
                <p className="price">PKR {court.pricePerHour} <span className="per-hr">/ hour</span></p>
            </div>
            <div className="card-footer">
                 <button className="book-btn">View Details</button>
            </div>
          </div>
        ))}
        {filteredCourts.length === 0 && <p style={{color:'#888'}}>No courts found.</p>}
      </div>

      {totalPages > 1 && (
        <div style={{display:'flex', justifyContent:'center', gap:'10px', marginTop:'2rem'}}>
          <button 
            disabled={page === 1} 
            onClick={() => setPage(p => p - 1)}
            style={{padding:'8px 16px', background:'var(--bg-card)', border:'1px solid var(--border-color)', color:'white', borderRadius:'6px', cursor: page === 1 ? 'not-allowed' : 'pointer'}}
          >
            Previous
          </button>
          <span style={{padding:'8px', color:'var(--text-secondary)'}}>Page {page} of {totalPages}</span>
          <button 
            disabled={page === totalPages} 
            onClick={() => setPage(p => p + 1)}
            style={{padding:'8px 16px', background:'var(--bg-card)', border:'1px solid var(--border-color)', color:'white', borderRadius:'6px', cursor: page === totalPages ? 'not-allowed' : 'pointer'}}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;