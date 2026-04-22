import { useEffect, useState } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';

const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [blockForm, setBlockForm] = useState({ date: '', startTime: '', endTime: '' });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await API.get('/manager/dashboard');
        setData(data);
      } catch (error) { toast.error('Failed to load dashboard'); }
    };
    fetchStats();
  }, []);

  const handleBlock = async (e) => {
    e.preventDefault();
    try {
        await API.post('/manager/block', blockForm);
        toast.success('Blocked Successfully');
        // Refresh page logic here or state update
        const { data } = await API.get('/manager/dashboard');
        setData(data);
    } catch (error) { toast.error('Failed to block'); }
  };

  const handleStatusUpdate = async (id, status) => {
      try {
          await API.put(`/manager/booking/${id}`, { status });
          toast.success(`Booking ${status}`);
          // Refresh data
          const { data } = await API.get('/manager/dashboard');
          setData(data);
      } catch (error) { toast.error('Update failed'); }
  };

  if (!data) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
      <div className="header-section" style={{borderBottom:'2px solid #10b981', paddingBottom:'1rem'}}>
          <div>
            <h1 className="page-title">Manager Portal</h1>
            <p style={{color:'#aaa', marginTop:'5px'}}>Managing: <strong style={{color:'white'}}>{data.courtName}</strong></p>
          </div>
          <span className="badge" style={{background:'rgba(16, 185, 129, 0.2)', color:'#10b981', padding:'10px 20px'}}>ACTIVE</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card" style={{borderColor:'#10b981'}}><h3>Total Revenue</h3><p className="stat-value" style={{color:'#10b981'}}>PKR {data.stats.totalRevenue.toLocaleString()}</p></div>
        <div className="stat-card"><h3>Pending</h3><p className="stat-value" style={{color:'#facc15'}}>{data.stats.pendingRequests}</p></div>
        <div className="stat-card"><h3>Confirmed</h3><p className="stat-value">{data.stats.activeBookings}</p></div>
      </div>

      <div className="dashboard-layout">
        <div className="activity-section">
            <h2 style={{fontSize:'1.2rem', marginBottom:'1rem'}}>Recent Activity</h2>
            <div className="table-container">
                <table className="bookings-table">
                    <thead><tr><th>User</th><th>Date / Time</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                        {data.recentActivity.map(b => (
                            <tr key={b._id}>
                                <td>{b.user ? b.user.name : 'Manual Block'}</td>
                                <td>{b.date}<br/>{b.startTime}</td>
                                <td><span className={`status ${b.status.toLowerCase()}`}>{b.status}</span></td>
                                <td>
                                    {b.status === 'Pending' && b.type === 'Online' && (
                                        <div style={{display:'flex', gap:'5px'}}>
                                            <button onClick={() => handleStatusUpdate(b._id, 'Approved')} style={{background:'#10b981', border:'none', color:'white', padding:'5px 10px', borderRadius:'4px', cursor:'pointer'}} title="Approve">✓</button>
                                            <button onClick={() => handleStatusUpdate(b._id, 'Rejected')} style={{background:'#ef4444', border:'none', color:'white', padding:'5px 10px', borderRadius:'4px', cursor:'pointer'}} title="Reject">✕</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        <div className="block-section">
            <div className="form-container" style={{margin:0, maxWidth:'100%', border:'1px solid #333', padding:'1.5rem'}}>
                <h3 style={{color:'#ef4444'}}>Block Slot</h3>
                <form onSubmit={handleBlock}>
                    <div className="form-group"><label>Date</label><input type="date" onChange={e=>setBlockForm({...blockForm, date:e.target.value})} required /></div>
                    <div className="form-row">
                        <div className="form-group"><label>Start</label><input type="time" onChange={e=>setBlockForm({...blockForm, startTime:e.target.value})} required /></div>
                        <div className="form-group"><label>End</label><input type="time" onChange={e=>setBlockForm({...blockForm, endTime:e.target.value})} required /></div>
                    </div>
                    <button className="confirm-btn" style={{background:'#ef4444'}}>Mark as Taken</button>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};
export default ManagerDashboard;