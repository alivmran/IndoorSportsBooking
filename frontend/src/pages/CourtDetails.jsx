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
        if (isWeekend && court.priceWeekend) {
            setActivePrice(court.priceWeekend);
        } else {
            setActivePrice(court.pricePerHour);
        }
    }
  }, [date, court]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) {
        toast.info('Please Login to Book a Court');
        navigate('/login');
        return;
    }

    try {
      await API.post('/bookings', {
        courtId: id,
        date,
        startTime,
        endTime
      });
      toast.success('Booking Request Sent!');
      navigate('/profile'); 
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking Failed');
    }
  };

  if (!court) return <div className="loading">Loading Court Details...</div>;

  return (
    <div className="page-container">
        <div className="details-header">
            <h1>{court.name}</h1>
            <span className="badge large">{court.sportType}</span>
        </div>
        
        <div className="details-layout">
            <div className="details-main">
                <div className="gallery-box">
                    {court.images && court.images.length > 0 ? (
                        <img src={court.images[0]} alt="Main" className="main-image"/>
                    ) : (
                        <div className="placeholder-large">No Images Available</div>
                    )}
                </div>
                
                <div className="info-box">
                    <h3>About this Venue</h3>
                    <p className="desc-text">{court.description || 'No description provided.'}</p>
                    
                    <div className="amenities-list">
                        <h4>Amenities</h4>
                        <ul>
                            {court.amenities && court.amenities.length > 0 
                                ? court.amenities.map(a => <li key={a}>{a}</li>) 
                                : <li>Standard Facilities</li>}
                        </ul>
                    </div>

                    <div className="location-box">
                        <h4>📍 Location</h4>
                        <p>{court.location || 'Karachi, Pakistan'}</p>
                    </div>
                </div>
            </div>

            <div className="booking-sidebar">
                <div className="booking-card">
                    <h3>Book Slot</h3>
                    <div className="price-tag">
                        PKR {activePrice} <span>/ hour</span>
                        {activePrice !== court.pricePerHour && <small className="weekend-badge">Weekend Pricing</small>}
                    </div>

                    <form onSubmit={handleBooking}>
                        <div className="form-group">
                            <label>Select Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                        </div>
                        <div className="time-row">
                            <div className="form-group">
                                <label>Start</label>
                                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>End</label>
                                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                            </div>
                        </div>
                        
                        {user ? (
                            <button type="submit" className="book-btn large">Confirm Booking</button>
                        ) : (
                            <button type="button" onClick={() => navigate('/login')} className="book-btn large login-trigger">Login to Book</button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    </div>
  );
};

export default CourtDetails;