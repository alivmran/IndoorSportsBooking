import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';

const FindTeam = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('match'); 
  
  const [matchPosts, setMatchPosts] = useState([]);
  const [teams, setTeams] = useState([]);
  
  // Create Post Modal
  const [showModal, setShowModal] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  
  // New Form State with Checkbox Logic
  const [postForm, setPostForm] = useState({
    bookingId: '', 
    teamName: '', 
    mobile: '', 
    lookingForPlayers: false,
    playersNeeded: 1, // Default if checked
    opponentSize: 5   // Default if unchecked
  });

  const fetchData = async () => {
    try {
      if(activeTab === 'match') {
          // Tab 1: Show posts looking for TEAMS (Opponents)
          const { data } = await API.get('/matches/posts');
          // Filter: lookingForPlayers === false
          setMatchPosts(data.filter(p => !p.lookingForPlayers));
      } else {
          // Tab 2: Show Teams AND Posts looking for PLAYERS
          const teamRes = await API.get('/teams/find-match');
          const postRes = await API.get('/matches/posts');
          
          const soloPosts = postRes.data.filter(p => p.lookingForPlayers);
          setTeams(teamRes.data);
          setMatchPosts(soloPosts); // Re-using state var for display
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  const openCreateModal = async () => {
    try {
      const { data } = await API.get('/bookings/mybookings');
      // Fix: Filter only APPROVED bookings
      const approved = data.filter(b => b.status === 'Approved');
      
      if(approved.length === 0) {
          toast.info("You need an Approved booking to create a post.");
          return;
      }
      
      setMyBookings(approved);
      setShowModal(true);
    } catch (error) {
      toast.error('Could not load bookings');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      await API.post('/matches/posts', postForm);
      toast.success('Post Created!');
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  const sendRequest = async (type, targetId) => {
    try {
      await API.post('/matches/requests', { type, targetId });
      toast.success('Request Sent!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="page-container">
      <div className="header-section">
        <h1 className="page-title">Find A Match</h1>
        <button className="inbox-btn" onClick={() => navigate('/requests')}>
           📩 My Requests
        </button>
      </div>

      <div className="match-tabs">
        <button className={`tab-btn ${activeTab === 'match' ? 'active' : ''}`} onClick={() => setActiveTab('match')}>
            Find Opponent (Teams)
        </button>
        <button className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
            Join a Team / Match (Solo)
        </button>
      </div>

      {activeTab === 'match' ? (
        <>
            <div style={{marginBottom: '20px', textAlign:'right'}}>
                <button className="add-btn" onClick={openCreateModal}>+ Create Match Post</button>
            </div>
            <div className="courts-grid">
                {matchPosts.map(post => (
                    <div key={post._id} className="card">
                        <div className="card-header">
                            <h3>{post.court?.name}</h3>
                            <span className="badge">{post.court?.sportType}</span>
                        </div>
                        <div className="card-body">
                            <p style={{color: '#4ade80', fontWeight:'bold'}}>{post.date} @ {post.startTime}</p>
                            <p className="desc" style={{marginTop:'10px'}}>
                                <strong>Team:</strong> {post.teamName} <br/>
                                <strong>Looking For:</strong> Opponent Team ({post.opponentSize} players)
                            </p>
                        </div>
                        <div className="card-footer">
                            {post.user._id !== user._id && (
                                <button className="book-btn" onClick={() => sendRequest('CHALLENGE', post._id)}>
                                    Challenge Team
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {matchPosts.length === 0 && <p>No matches looking for opponents.</p>}
            </div>
        </>
      ) : (
        <div className="courts-grid">
             {/* 1. Show Permanent Teams */}
             {teams.map(team => (
                 <div key={team._id} className="card">
                     <div className="card-header">
                         <h3>{team.name}</h3>
                         <span className="badge">{team.sportType}</span>
                     </div>
                     <div className="card-body">
                         <p className="desc">Permanent Team</p>
                         <p>{team.description}</p>
                         <p><strong>Squad:</strong> {team.memberCount} Players</p>
                     </div>
                     <div className="card-footer">
                         {team.captain !== user._id && (
                             <button className="book-btn" onClick={() => sendRequest('JOIN', team._id)}>
                                 Request to Join Team
                             </button>
                         )}
                     </div>
                 </div>
             ))}

             {/* 2. Show One-off Matches looking for players */}
             {matchPosts.map(post => (
                 <div key={post._id} className="card" style={{borderColor: '#10b981'}}>
                     <div className="card-header">
                         <h3>{post.court?.name}</h3>
                         <span className="badge">MATCH</span>
                     </div>
                     <div className="card-body">
                         <p style={{color: '#4ade80'}}>{post.date} @ {post.startTime}</p>
                         <p className="desc"><strong>Team:</strong> {post.teamName}</p>
                         <p><strong>Needs:</strong> {post.playersNeeded} Player(s)</p>
                     </div>
                     <div className="card-footer">
                         {post.user._id !== user._id && (
                             <button className="book-btn" style={{background:'#10b981'}} onClick={() => sendRequest('JOIN', post._id)}>
                                 Join Match as Solo
                             </button>
                         )}
                     </div>
                 </div>
             ))}
             
             {teams.length === 0 && matchPosts.length === 0 && <p>No teams or matches looking for players.</p>}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal" onClick={() => setShowModal(false)}>×</button>
            <h3>Create Match Post</h3>
            <form onSubmit={handleCreatePost}>
                <div className="form-group">
                    <label>Select Booking (Approved Only)</label>
                    <select required onChange={e => setPostForm({...postForm, bookingId: e.target.value})}>
                        <option value="">-- Choose Booking --</option>
                        {myBookings.map(b => (
                            <option key={b._id} value={b._id}>
                                {b.court.name} - {b.date} ({b.startTime})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Team Name</label>
                        <input required onChange={e => setPostForm({...postForm, teamName: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label>Mobile</label>
                        <input required onChange={e => setPostForm({...postForm, mobile: e.target.value})} />
                    </div>
                </div>

                {/* New Checkbox Logic */}
                <div className="form-group checkbox-group">
                    <input type="checkbox" 
                        checked={postForm.lookingForPlayers} 
                        onChange={e => setPostForm({...postForm, lookingForPlayers: e.target.checked})} 
                    />
                    <label>Are you looking for extra players (Solo)?</label>
                </div>

                {postForm.lookingForPlayers ? (
                    <div className="form-group">
                        <label>How many players do you need?</label>
                        <input type="number" min="1" required 
                            value={postForm.playersNeeded}
                            onChange={e => setPostForm({...postForm, playersNeeded: e.target.value})} 
                        />
                    </div>
                ) : (
                     <div className="form-group">
                        <label>Opponent Team Size (e.g., 5v5)</label>
                        <input type="number" min="1" required 
                            value={postForm.opponentSize}
                            onChange={e => setPostForm({...postForm, opponentSize: e.target.value})} 
                        />
                    </div>
                )}
                
                <button type="submit" className="confirm-btn">Post Match</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindTeam;