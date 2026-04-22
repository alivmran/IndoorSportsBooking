import { useEffect, useState, useContext } from 'react';
import API from '../api/axios';
import AuthContext from '../context/AuthContext';

const TeamProfile = () => {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [matchHistory, setMatchHistory] = useState({ hosted: [], challenged: [] });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const bookingRes = await API.get('/bookings/mybookings');
        setBookings(bookingRes.data);
        
        const matchRes = await API.get('/matches/history');
        setMatchHistory(matchRes.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  const allMatches = [...matchHistory.hosted, ...matchHistory.challenged];
  const todayStr = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  const handleDeleteBooking = async (id) => {
    if(window.confirm('Are you sure you want to cancel this booking request?')) {
        try {
            await API.delete(`/bookings/${id}`);
            setBookings(bookings.filter(b => b._id !== id));
            toast.success('Booking request cancelled.');
        } catch(error) {
            toast.error('Failed to cancel booking.');
        }
    }
  };

  return (
    <div className="page-container">
      <div className="header-section">
        <h1 className="page-title">My Profile</h1>
      </div>

      <div className="profile-section">
        <h2>Booking History</h2>
        {bookings.length === 0 ? <p style={{color:'#aaa'}}>No bookings found.</p> : (
            <div className="courts-grid">
            {bookings.map((b) => (
                <div key={b._id} className="card">
                    <div className="card-header">
                        <h3>{b.court?.name}</h3>
                        <span className={`badge`} style={{
                            background: b.status === 'Approved' ? 'rgba(16, 185, 129, 0.2)' : b.status === 'Rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(250, 204, 21, 0.2)',
                            color: b.status === 'Approved' ? '#34d399' : b.status === 'Rejected' ? '#f87171' : '#facc15'
                        }}>
                            {b.status}
                        </span>
                    </div>
                    <div className="card-body">
                        <p style={{color: '#aaa', margin:0, display:'flex', alignItems:'center', gap:'5px'}}>📅 {b.date}</p>
                        <p style={{color: '#aaa', margin:'5px 0 0 0', display:'flex', alignItems:'center', gap:'5px'}}>⏰ {b.startTime}</p>
                        <p style={{color: 'white', fontWeight:'bold', marginTop:'15px', fontSize:'1.2rem'}}>PKR {b.totalPrice}</p>
                        {b.status === 'Pending' && (
                            <button onClick={() => handleDeleteBooking(b._id)} style={{marginTop:'15px', width:'100%', background:'rgba(239, 68, 68, 0.1)', color:'#ef4444', border:'1px solid rgba(239, 68, 68, 0.3)', padding:'8px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>
                                Cancel Request
                            </button>
                        )}
                    </div>
                </div>
            ))}
            </div>
        )}
      </div>

      <div className="profile-section" style={{marginTop: '3rem'}}>
        <h2>Match History</h2>
        {allMatches.length === 0 ? <p style={{color:'#aaa'}}>No played matches found.</p> : (
            <div className="courts-grid">
            {allMatches.map((match, i) => (
                <div key={match._id || i} className="card">
                    <div className="card-header">
                        <h3>{match.court?.name}</h3>
                        <span className={`badge`} style={{ 
                            background: match.date < todayStr ? 'rgba(59, 130, 246, 0.2)' : 'rgba(250, 204, 21, 0.2)', 
                            color: match.date < todayStr ? '#60a5fa' : '#facc15' 
                        }}>
                            {match.date < todayStr ? 'PLAYED' : 'UPCOMING'}
                        </span>
                    </div>
                    <div className="card-body">
                        <p style={{color: '#aaa', margin:0, display:'flex', alignItems:'center', gap:'5px'}}>📅 {match.date}</p>
                        <p style={{color: '#aaa', margin:'5px 0 0 0', display:'flex', alignItems:'center', gap:'5px'}}>⏰ {match.startTime}</p>
                        <div style={{marginTop:'15px', padding:'10px', background:'rgba(255,255,255,0.05)', borderRadius:'8px'}}>
                            <p style={{margin:0, fontSize:'0.85rem', color:'#888'}}>Host Team</p>
                            <p style={{margin:0, color:'white', fontWeight:'bold'}}>{match.adHocTeamName}</p>
                        </div>
                    </div>
                </div>
            ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default TeamProfile;