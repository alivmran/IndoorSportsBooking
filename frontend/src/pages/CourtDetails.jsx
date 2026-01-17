import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';

const CourtDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [court, setCourt] = useState(null);
  
  // Booking State
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [activePrice, setActivePrice] = useState(0);

  useEffect(() => {
    const fetchCourt = async () => {
      try {
        const { data } = await API.get('/courts');
        const found = data.find(c => c._id === id);
        setCourt(found);
        setActivePrice(found?.pricePerHour || 0);
      } catch (error) {
        console.error(error);
      }
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
    if (!user) {
        // Redundant check, but safe. 
        // The UI below hides the form if !user, but we enforce it here too.
        navigate('/login');
        return;
    }
    
    // ... Existing booking logic ...
    try {
      await API.post('/bookings', { courtId: id, date, startTime, endTime });
      toast.success('Request Sent!');
      navigate('/profile'); 
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  if (!court) return <div className="loading">Loading...</div>;

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
            
            {/* RIGHT SIDE: LOGIC CHANGE HERE */}
            <div className="booking-sidebar">
                <div className="booking-card">
                    <h3>Book Slot</h3>
                    
                    {user ? (
                        /* LOGGED IN: Show Calendar & Form */
                        <form onSubmit={handleBooking}>
                            <div className="price-tag">PKR {activePrice} <span>/ hr</span></div>
                            <div className="form-group">
                                <label>Date</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                            </div>
                            <div className="time-row">
                                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                            </div>
                            <button type="submit" className="book-btn large">Confirm Booking</button>
                        </form>
                    ) : (
                        /* NOT LOGGED IN: Show Login Prompt */
                        <div style={{textAlign:'center', padding:'20px 0'}}>
                            <p style={{marginBottom:'15px', color:'#aaa'}}>Please login to view availability and book courts.</p>
                            <button onClick={() => navigate('/login')} className="book-btn large">Login to Book</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default CourtDetails;