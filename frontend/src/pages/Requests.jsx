import { useEffect, useState } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';

const Requests = () => {
  const [activeTab, setActiveTab] = useState('inbox');
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  const fetchInbox = async () => {
    try {
      const { data } = await API.get('/matches/requests/inbox');
      setRequests(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSent = async () => {
    try {
      const { data } = await API.get('/matches/requests/sent');
      setSentRequests(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (activeTab === 'inbox') fetchInbox();
    else fetchSent();
  }, [activeTab]);

  const handleResponse = async (id, status) => {
    try {
      await API.put(`/matches/requests/${id}`, { status });
      toast.success(`Request ${status}`);
      fetchInbox();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">My Requests</h1>

      <div className="match-tabs">
        <button className={`tab-btn ${activeTab === 'inbox' ? 'active' : ''}`} onClick={() => setActiveTab('inbox')}>
            Inbox (Received)
        </button>
        <button className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`} onClick={() => setActiveTab('sent')}>
            Sent Challenges
        </button>
      </div>
      
      {activeTab === 'inbox' ? (
          requests.length === 0 ? <p>No pending requests.</p> : (
              <div className="courts-grid">
                  {requests.map(req => (
                      <div key={req._id} className="card">
                          <div className="card-header">
                              <h3>⚔️ Challenge Received</h3>
                              <span className="badge" style={{background:'rgba(250, 204, 21, 0.2)', color:'#facc15'}}>Pending</span>
                          </div>
                          <div className="card-body">
                              <p style={{margin:0, color:'white'}}><strong>{req.sender.name}</strong> challenged your team.</p>
                              <p style={{marginTop:'10px', fontSize:'0.9rem', color:'#aaa'}}>
                                Court: <strong style={{color:'#fff'}}>{req.matchPost?.court?.name}</strong>
                              </p>
                          </div>
                          <div className="card-footer" style={{display:'flex', gap:'10px', padding:'15px'}}>
                              <button onClick={() => handleResponse(req._id, 'ACCEPTED')} style={{flex:1, background:'#10b981', color:'white', border:'none', padding:'10px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>Accept</button>
                              <button onClick={() => handleResponse(req._id, 'REJECTED')} style={{flex:1, background:'rgba(239, 68, 68, 0.2)', color:'#ef4444', border:'none', padding:'10px', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>Reject</button>
                          </div>
                      </div>
                  ))}
              </div>
          )
      ) : (
          sentRequests.length === 0 ? <p>You haven't sent any challenges.</p> : (
              <div className="courts-grid">
                  {sentRequests.map(req => (
                      <div key={req._id} className="card">
                          <div className="card-header">
                              <h3>⚔️ Sent Challenge</h3>
                              <span className={`badge`} style={{
                                  background: req.status === 'ACCEPTED' ? 'rgba(16, 185, 129, 0.2)' : req.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(250, 204, 21, 0.2)',
                                  color: req.status === 'ACCEPTED' ? '#34d399' : req.status === 'REJECTED' ? '#f87171' : '#facc15'
                              }}>
                                  {req.status}
                              </span>
                          </div>
                          <div className="card-body">
                              <p style={{margin:0, color:'#aaa'}}>Host: <strong style={{color:'white'}}>{req.matchPost?.adHocTeamName}</strong></p>
                              <p style={{marginTop:'10px', fontSize:'0.9rem', color:'#888'}}>
                                {req.matchPost?.court?.name} <br/> {req.matchPost?.date} at {req.matchPost?.startTime}
                              </p>
                              {req.status === 'ACCEPTED' && (
                                  <div style={{marginTop:'15px', padding:'12px', background:'rgba(16, 185, 129, 0.15)', borderRadius:'8px', border:'1px solid #10b981'}}>
                                      <strong style={{color:'#10b981', display:'block', marginBottom:'5px'}}>Match Accepted! 🎉</strong>
                                      <span style={{color:'white', fontSize:'0.95rem'}}>Host Contact: <strong>{req.matchPost?.mobile}</strong></span>
                                  </div>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          )
      )}
    </div>
  );
};

export default Requests;