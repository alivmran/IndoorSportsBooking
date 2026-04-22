import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';
import AdminCourtView from './AdminCourtView';
import TimeSlotPicker from '../components/TimeSlotPicker';

const CourtDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [court, setCourt] = useState(null);
  
  const [date, setDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [activePrice, setActivePrice] = useState(0);
  const [unavailableSlots, setUnavailableSlots] = useState([]);

  // --- MANAGER LOGIC ---
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

        const fetchAvailability = async () => {
            try {
                const { data } = await API.get(`/bookings/availability?courtId=${court._id}&date=${date}`);
                setUnavailableSlots(data);
                setSelectedSlots([]); // Clear when date changes
            } catch(e) { console.error(e); }
        };
        fetchAvailability();
    }
  }, [date, court]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    if (selectedSlots.length === 0) {
      toast.error('Please select at least one time slot');
      return;
    }

    const groupTimeSlots = (slotsArray) => {
      const sorted = [...slotsArray].sort();
      const blocks = [];
      let currentStart = sorted[0].split('-')[0];
      let currentEnd = sorted[0].split('-')[1];
      for (let i = 1; i < sorted.length; i++) {
        const [nextStart, nextEnd] = sorted[i].split('-');
        if (currentEnd === nextStart) {
          currentEnd = nextEnd;
        } else {
          blocks.push({ startTime: currentStart, endTime: currentEnd });
          currentStart = nextStart;
          currentEnd = nextEnd;
        }
      }
      blocks.push({ startTime: currentStart, endTime: currentEnd });
      return blocks;
    };

    try {
      const timeBlocks = groupTimeSlots(selectedSlots);
      const totalPrice = activePrice * selectedSlots.length;
      await API.post('/bookings', { courtId: id, date, timeBlocks, totalPrice });
      toast.success('Request Sent!');
      navigate('/profile'); 
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  // --- ADMIN LOGIC ---
  // If admin, hijack the view to show the Admin Control Panel
  if (user && (user.isAdmin || user.role === 'admin')) {
      return (
        <div className="page-container">
            <AdminCourtView courtId={id} />
        </div>
      );
  }

  if (!court) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
        <div className="details-header">
            <h1>{court.name}</h1>
            <span className="badge large">{court.sportType}</span>
        </div>
        
        <div className="details-layout">
          <div className="left-column">
            <div className="gallery-box">
                {court.images?.[0] ? <img src={court.images[0]} className="main-image"/> : <div className="placeholder-large">No Image</div>}
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
            
            <div className="booking-sidebar">
                <div className="booking-card">
                    {user ? (
                        <div className="book-slot-container">
                            <div className="book-slot-header">
                                <h3>Book Slot</h3>
                                <div className="price-display">PKR {activePrice * (selectedSlots.length || 1)} <span>{selectedSlots.length > 0 ? '/ total' : '/ hr'}</span></div>
                            </div>
                            <form onSubmit={handleBooking}>
                                <div className="form-group">
                                    <label>Date</label>
                                    <input type="date" min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]} value={date} onChange={e => setDate(e.target.value)} required />
                                </div>
                                {date && (
                                    <div className="form-group">
                                        <label>Select Time Slots</label>
                                        <TimeSlotPicker selectedSlots={selectedSlots} onChange={setSelectedSlots} unavailableSlots={unavailableSlots} />
                                    </div>
                                )}
                                <button type="submit" className="book-btn large confirm-btn-styled" disabled={selectedSlots.length === 0}>Confirm Booking</button>
                            </form>
                        </div>
                    ) : (
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