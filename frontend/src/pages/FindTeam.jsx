import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';

const FindTeam = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [matchPosts, setMatchPosts] = useState([]);
  
  // Create Post Modal
  const [showModal, setShowModal] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  
  const [postForm, setPostForm] = useState({
    bookingId: '', 
    adHocTeamName: '', 
    mobile: '', 
    mySquadSize: 5,
    opponentSquadSize: 5
  });

  const fetchData = async () => {
    try {
      const { data } = await API.get('/matches/posts');
      setMatchPosts(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreateModal = async () => {
    try {
      const { data } = await API.get('/bookings/mybookings');
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
        <button onClick={() => navigate('/requests')} style={{background: 'linear-gradient(to right, #3b82f6, #2563eb)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', transition: 'transform 0.2s'}} onMouseOver={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}>
           📩 My Requests
        </button>
      </div>

      <div style={{marginBottom: '20px', textAlign:'right'}}>
          <button className="add-btn" onClick={openCreateModal}>+ Create Match Post</button>
      </div>
      <div className="courts-grid">
          {matchPosts.map(post => (
              <div key={post._id} className="card">
                  <div className="card-header">
                      <h3>{post.court?.name}</h3>
                      <span className="badge">{post.court?.facilities?.join(', ') || 'MATCH'}</span>
                  </div>
                  <div className="card-body" style={{background: 'rgba(255,255,255,0.03)', borderTop: '1px solid #333', borderBottom: '1px solid #333'}}>
                      <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px'}}>
                          <div style={{background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', display:'flex', gap:'8px', alignItems:'center'}}>
                              📅 {post.date} &nbsp; ⏰ {post.startTime}
                          </div>
                      </div>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                          <div style={{background:'rgba(0,0,0,0.3)', padding:'10px', borderRadius:'8px', border:'1px solid #222'}}>
                              <p style={{fontSize:'0.8rem', color:'#aaa', margin:0}}>Host Team</p>
                              <p style={{fontWeight:'bold', color:'white', margin:'5px 0 0 0'}}>{post.adHocTeamName}</p>
                              <p style={{fontSize:'0.85rem', color:'#888', margin:0}}>👥 {post.mySquadSize} Players</p>
                          </div>
                          <div style={{background:'rgba(59, 130, 246, 0.1)', padding:'10px', borderRadius:'8px', border:'1px solid rgba(59, 130, 246, 0.2)'}}>
                              <p style={{fontSize:'0.8rem', color:'#60a5fa', margin:0}}>Seeking Opponent</p>
                              <p style={{fontWeight:'bold', color:'white', margin:'5px 0 0 0'}}>Any Team</p>
                              <p style={{fontSize:'0.85rem', color:'#60a5fa', margin:0}}>👥 {post.opponentSquadSize} Players</p>
                          </div>
                      </div>
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
          {matchPosts.length === 0 && <p>No match posts available.</p>}
      </div>

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
                        <label>Temporary Team Name</label>
                        <input required onChange={e => setPostForm({...postForm, adHocTeamName: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label>Mobile Contact</label>
                        <input required onChange={e => setPostForm({...postForm, mobile: e.target.value})} />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Your Squad Size</label>
                        <input type="number" min="1" required 
                            value={postForm.mySquadSize}
                            onChange={e => setPostForm({...postForm, mySquadSize: e.target.value})} 
                        />
                    </div>
                    <div className="form-group">
                        <label>Opponent Squad Size</label>
                        <input type="number" min="1" required 
                            value={postForm.opponentSquadSize}
                            onChange={e => setPostForm({...postForm, opponentSquadSize: e.target.value})} 
                        />
                    </div>
                </div>
                
                <button type="submit" className="confirm-btn">Post Match</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindTeam;