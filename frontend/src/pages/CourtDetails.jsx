import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';
import AdminCourtView from './AdminCourtView';

const CourtDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [court, setCourt] = useState(null);
  
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [activePrice, setActivePrice] = useState(0);

  // --- ROLE CHECKS ---
  
  // 1. ADMIN: Show Admin Control Panel
  if (user && (user.isAdmin || user.role === 'admin')) {
      return (
        <div className="page-container">
            <AdminCourtView courtId={id} />
        </div>
      );
  }

  // 2. MANAGER: Redirect to Dashboard (They manage only their own court)
  useEffect(() => {
      if (user && user.role === 'manager') {
          navigate('/manager/dashboard');
      }
  }, [user, navigate]);

  // --- STANDARD USER LOGIC ---
  useEffect(() => {
    const fetchCourt = async () => {
      try {
        const { data } = await API.get('/courts');
        const found = data.find(c => c._id === id);
        setCourt(found);
        setActivePrice(found?.pricePerHour || 0);
      } catch (error) { console.error(error); }
    };
    fetchCourt();
  }, [id]);

  useEffect(() => {
    if (date && court) {
        const day = new Date(date).getDay();
        const isWeekend = (day === 0 || day === 6); 
        if (isWeekend && court.priceWeekend) setActivePrice(court.priceWeekend);
        else setActivePrice(court.pricePerHour);
    }
  }, [date, court]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    try {
      await API.post('/bookings', { courtId: id, date, startTime, endTime });
      toast.success('Request Sent!');
      navigate('/profile'); 
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  if (!court) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
        <div className="details-header">
            <h1>{court.name}</h1>
            <span className="badge large">{court.sportType}</span>
        </div>
        
        <div className="details-layout">
            <div className="gallery-box">
                {court.images?.[0] ? <img src={court.images[0]} className="main-image"/> : <div className="placeholder-large">No Image</div>}
            </div>
            
            <div className="booking-sidebar">
                <div className="booking-card">
                    <h3>Book Slot</h3>
                    {user ? (
                        <form onSubmit={handleBooking}>
                            <div className="price-tag">PKR {activePrice} <span>/ hr</span></div>
                            <div className="form-group"><label>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} required /></div>
                            <div className="time-row">
                                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                            </div>
                            <button type="submit" className="book-btn large">Confirm Booking</button>
                        </form>
                    ) : (
                        <div style={{textAlign:'center', padding:'20px 0'}}>
                            <p style={{marginBottom:'15px', color:'#aaa'}}>Please login to view availability and book courts.</p>
                            <button onClick={() => navigate('/login')} className="book-btn large">Login to Book</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        <div className="info-box" style={{marginTop:'2rem'}}>
            <h3>About this Venue</h3>
            <p className="desc-text">{court.description}</p>
            <h3>Amenities</h3>
            <div className="amenities-list">
                <ul><li>🚗 Parking</li><li>🚿 Showers</li><li>💡 Floodlights</li><li>☕ Cafe</li></ul>
            </div>
        </div>
    </div>
  );
};

export default CourtDetails;