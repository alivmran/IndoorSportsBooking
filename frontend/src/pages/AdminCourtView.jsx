import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { toast } from 'react-toastify';

const AdminCourtView = ({ courtId }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); 
  const [editForm, setEditForm] = useState({});
  const [blockForm, setBlockForm] = useState({ date: '', startTime: '', endTime: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await API.get(`/admin/court/${courtId}/stats`);
        setData(data);
        setEditForm({
            name: data.court.name,
            location: data.court.location,
            pricePerHour: data.court.pricePerHour,
            priceWeekend: data.court.priceWeekend,
            description: data.court.description
        });
      } catch (err) {
        toast.error('Failed to load court data.');
      }
    };
    if(courtId) fetchData(); 
  }, [courtId]);

  const handleUpdate = async (e) => {
      e.preventDefault();
      try { await API.put(`/admin/court/${courtId}`, editForm); toast.success('Updated'); } 
      catch (error) { toast.error('Update failed'); }
  };

  const handleBlock = async (e) => {
      e.preventDefault();
      try { await API.post('/admin/block-slot', { ...blockForm, courtId }); toast.success('Blocked'); } 
      catch (error) { toast.error('Block failed'); }
  };

  if (!data) return <div style={{padding:'2rem', color:'white', textAlign:'center'}}>Loading Admin View...</div>;

  return (
    <div className="admin-view-container">
        {/* HEADER WITH BACK BUTTON */}
        <div className="header-section" style={{alignItems:'flex-start', borderBottom:'1px solid #333', paddingBottom:'1rem'}}>
            <div>
                <button 
                    onClick={() => window.location.href = '/admin/dashboard'} 
                    style={{marginBottom:'10px', background:'#333', border:'none', color:'white', padding:'5px 15px', borderRadius:'4px', cursor:'pointer'}}
                >
                    ← Back to Dashboard
                </button>
                <h1 className="page-title">Admin Command: {data.court.name}</h1>
            </div>
            <span className="badge" style={{background:'#3b82f6', color:'white'}}>SUPER ADMIN</span>
        </div>

        {/* TABS */}
        <div className="match-tabs">
            <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>📊 Analytics</button>
            <button className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>📅 Bookings</button>
            <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>⚙️ Settings</button>
            <button className={`tab-btn ${activeTab === 'block' ? 'active' : ''}`} onClick={() => setActiveTab('block')}>🚫 Block Time</button>
        </div>

        {activeTab === 'overview' && (
            <div className="stats-grid">
                <div className="stat-card"><h3>Revenue</h3><p className="stat-value">PKR {data.stats.totalRevenue.toLocaleString()}</p></div>
                <div className="stat-card"><h3>Users</h3><p className="stat-value">{data.stats.uniqueUserCount}</p></div>
                <div className="stat-card"><h3>Bookings</h3><p className="stat-value">{data.stats.totalBookings}</p></div>
                <div className="stat-card"><h3>Cancelled</h3><p className="stat-value" style={{color:'#ef4444'}}>{data.stats.canceledBookings}</p></div>
            </div>
        )}

        {activeTab === 'bookings' && (
            <div className="table-container">
                <table className="bookings-table">
                    <thead><tr><th>User</th><th>Date</th><th>Type</th><th>Status</th></tr></thead>
                    <tbody>
                        {data.bookings.map(b => (
                            <tr key={b._id}>
                                <td>{b.user ? <strong>{b.user.name}</strong> : 'Admin Block'}</td>
                                <td>{b.date} <br/> {b.startTime} - {b.endTime}</td>
                                <td>{b.type}</td>
                                <td><span className={`status ${b.status.toLowerCase()}`}>{b.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="form-container" style={{margin:'0 auto', maxWidth:'600px'}}>
                <form onSubmit={handleUpdate}>
                    <div className="form-group"><label>Name</label><input value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} /></div>
                    <div className="form-row">
                        <div className="form-group"><label>Weekday Price</label><input value={editForm.pricePerHour} onChange={e=>setEditForm({...editForm, pricePerHour:e.target.value})} /></div>
                        <div className="form-group"><label>Weekend Price</label><input value={editForm.priceWeekend} onChange={e=>setEditForm({...editForm, priceWeekend:e.target.value})} /></div>
                    </div>
                    <div className="form-group"><label>Description</label><textarea rows="4" value={editForm.description} onChange={e=>setEditForm({...editForm, description:e.target.value})} /></div>
                    <button className="confirm-btn">Save Changes</button>
                </form>
            </div>
        )}

        {activeTab === 'block' && (
            <div className="form-container" style={{margin:'0 auto', maxWidth:'500px', borderColor:'#ef4444'}}>
                <h2 style={{color:'#ef4444'}}>Block Slot</h2>
                <form onSubmit={handleBlock}>
                    <div className="form-group"><label>Date</label><input type="date" onChange={e=>setBlockForm({...blockForm, date:e.target.value})} required/></div>
                    <div className="form-row">
                        <div className="form-group"><label>Start</label><input type="time" onChange={e=>setBlockForm({...blockForm, startTime:e.target.value})} required/></div>
                        <div className="form-group"><label>End</label><input type="time" onChange={e=>setBlockForm({...blockForm, endTime:e.target.value})} required/></div>
                    </div>
                    <button className="confirm-btn" style={{background:'#ef4444'}}>Confirm Block</button>
                </form>
            </div>
        )}
    </div>
  );
};

export default AdminCourtView;