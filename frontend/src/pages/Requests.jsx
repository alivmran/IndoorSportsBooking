import { useEffect, useState } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';

const Requests = () => {
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    try {
      const { data } = await API.get('/matches/requests/inbox');
      setRequests(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleResponse = async (id, status) => {
    try {
      await API.put(`/matches/requests/${id}`, { status });
      toast.success(`Request ${status}`);
      fetchRequests();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Inbox / Requests</h1>
      
      {requests.length === 0 ? <p>No pending requests.</p> : (
          <div className="requests-list">
              {requests.map(req => (
                  <div key={req._id} className="req-card">
                      <div className="req-info">
                          {req.type === 'CHALLENGE' ? (
                              <>
                                  <h3>⚔️ Challenge Received</h3>
                                  <p><strong>{req.sender.name}</strong> wants to challenge your team.</p>
                                  <p style={{fontSize:'0.9rem', color:'#888'}}>
                                    For Match at: {req.matchPost?.court?.name}
                                  </p>
                              </>
                          ) : (
                              <>
                                  <h3>👤 Join Request</h3>
                                  <p><strong>{req.sender.name}</strong> wants to join your team <strong>{req.team?.name}</strong>.</p>
                              </>
                          )}
                      </div>
                      <div className="req-actions">
                          <button className="accept-btn" onClick={() => handleResponse(req._id, 'ACCEPTED')}>Accept</button>
                          <button className="reject-btn" onClick={() => handleResponse(req._id, 'REJECTED')}>Reject</button>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default Requests;