import { useEffect, useState, useContext } from 'react';
import API from '../api/axios';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';

const TeamProfile = () => {
  const { user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  
  // Team State
  const [myTeam, setMyTeam] = useState(null);
  const [showTeamManage, setShowTeamManage] = useState(false); // Hidden by default
  const [teamForm, setTeamForm] = useState({ name: '', sportType: 'Futsal', description: '', memberCount: 5 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bookingRes = await API.get('/bookings/mybookings');
        setBookings(bookingRes.data);
        
        const teamRes = await API.get('/teams/my-team');
        if (teamRes.data) setMyTeam(teamRes.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
        const { data } = await API.post('/teams', teamForm);
        setMyTeam(data);
        toast.success('Team Created');
    } catch (error) {
        toast.error('Failed to create team');
    }
  };

  return (
    <div className="page-container">
      <div className="header-section">
        <h1 className="page-title">My Profile</h1>
        {/* Toggle Button for Team Management */}
        <button className="edit-btn" onClick={() => setShowTeamManage(!showTeamManage)}>
            {showTeamManage ? 'Hide Team Settings' : 'Manage My Team'}
        </button>
      </div>

      {/* Booking History (Main Focus) */}
      <div className="profile-section" style={{marginBottom: '2rem'}}>
        <h2>Booking History</h2>
        {bookings.length === 0 ? <p>No bookings found.</p> : (
            <div className="mini-history">
            {bookings.map((b) => (
                <div key={b._id} className="history-item">
                    <div>
                        <strong>{b.court?.name}</strong>
                        <div style={{fontSize: '0.85rem', color: '#aaa'}}>
                            {b.date} | {b.startTime} - {b.endTime}
                        </div>
                    </div>
                    <span className={`status ${b.status.toLowerCase()}`}>{b.status}</span>
                </div>
            ))}
            </div>
        )}
      </div>

      {/* Team Section (Collapsible) */}
      {showTeamManage && (
        <div className="profile-section">
            <h2>Team Management</h2>
            <p style={{color: '#888', marginBottom: '1rem', fontSize: '0.9rem'}}>
                You need a team if you want other players to join you via the "Find A Team" page.
            </p>

            {myTeam ? (
                <div className="team-details">
                    <h3>{myTeam.name} <span className="badge">{myTeam.sportType}</span></h3>
                    <p>{myTeam.description}</p>
                    <p><strong>Squad Size:</strong> {myTeam.memberCount} Players</p>
                    <button disabled className="book-btn" style={{opacity: 0.5, marginTop: '10px'}}>Team Active</button>
                </div>
            ) : (
                <form onSubmit={handleCreateTeam}>
                    <div className="form-group">
                        <label>Team Name</label>
                        <input onChange={e => setTeamForm({...teamForm, name: e.target.value})} required />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Sport</label>
                            <select onChange={e => setTeamForm({...teamForm, sportType: e.target.value})}>
                                <option value="Futsal">Futsal</option>
                                <option value="Cricket">Cricket</option>
                                <option value="Padel">Padel</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Squad Size</label>
                            <input type="number" onChange={e => setTeamForm({...teamForm, memberCount: e.target.value})} required />
                        </div>
                    </div>
                    <button type="submit" className="confirm-btn">Create Team</button>
                </form>
            )}
        </div>
      )}
    </div>
  );
};

export default TeamProfile;