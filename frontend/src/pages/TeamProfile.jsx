import { useEffect, useState, useContext } from 'react';
import API from '../api/axios';
import AuthContext from '../context/AuthContext';

const TeamProfile = () => {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const bookingRes = await API.get('/bookings/mybookings');
        setBookings(bookingRes.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="page-container">
      <div className="header-section">
        <h1 className="page-title">My Profile</h1>
      </div>

      <div className="profile-section">
        <h2>Booking History</h2>
        {bookings.length === 0 ? <p style={{color:'#aaa'}}>No bookings found.</p> : (
            <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
            {bookings.map((b) => (
                <div key={b._id} style={{
                    border:'1px solid var(--border-color)', 
                    padding:'1rem', 
                    borderRadius:'8px',
                    display:'flex', 
                    justifyContent:'space-between',
                    alignItems:'center'
                }}>
                    <div>
                        <h4 style={{color:'white', margin:0}}>{b.court?.name}</h4>
                        <span style={{fontSize: '0.85rem', color: '#aaa'}}>
                            {b.date} | {b.startTime} - {b.endTime}
                        </span>
                    </div>
                    <span className={`badge`} style={{
                        background: b.status === 'Approved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: b.status === 'Approved' ? '#34d399' : '#f87171'
                    }}>
                        {b.status}
                    </span>
                </div>
            ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default TeamProfile;