import { useEffect, useState } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ courts: [], managers: [], stats: {} });
  const [form, setForm] = useState({
    courtName: '', location: '', sportType: 'Futsal', 
    pricePerHour: '', priceWeekend: '', managerName: '', managerEmail: ''
  });

  const fetchData = async () => {
    try {
      const { data } = await API.get('/admin/data');
      setData(data);
    } catch (error) { toast.error('Failed to load admin data'); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/admin/create-court', form);
      toast.success(`Created! Manager Password: ${res.data.manager.password}`);
      setForm({ courtName: '', location: '', sportType: 'Futsal', pricePerHour: '', priceWeekend: '', managerName: '', managerEmail: '' });
      fetchData();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Delete Court & Manager?')) {
        try { await API.delete(`/admin/court/${id}`); toast.success('Deleted'); fetchData(); } 
        catch (error) { toast.error('Failed'); }
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Super Admin Panel</h1>
      
      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card" style={{borderColor: '#3b82f6'}}><h3>Total Courts</h3><p className="stat-value">{data.courts.length}</p></div>
        <div className="stat-card" style={{borderColor: '#10b981'}}><h3>Total Revenue</h3><p className="stat-value">PKR {data.stats?.totalRevenue?.toLocaleString() || 0}</p></div>
        <div className="stat-card"><h3>Total Bookings</h3><p className="stat-value">{data.stats?.totalBookings || 0}</p></div>
      </div>

      <div className="dashboard-layout">
        {/* CREATE FORM */}
        <div className="form-container" style={{margin:0, maxWidth:'100%', textAlign:'left'}}>
            <h2>Add New Facility</h2>
            <form onSubmit={handleCreate}>
                <div className="form-row">
                    <div className="form-group"><label>Court Name</label><input value={form.courtName} onChange={e=>setForm({...form, courtName:e.target.value})} required /></div>
                    <div className="form-group"><label>Sport</label><select value={form.sportType} onChange={e=>setForm({...form, sportType:e.target.value})}><option>Futsal</option><option>Padel</option><option>Cricket</option></select></div>
                </div>
                <div className="form-group"><label>Location</label><input value={form.location} onChange={e=>setForm({...form, location:e.target.value})} required /></div>
                <div className="form-row">
                    <div className="form-group"><label>Price (Weekday)</label><input type="number" value={form.pricePerHour} onChange={e=>setForm({...form, pricePerHour:e.target.value})} required /></div>
                    <div className="form-group"><label>Price (Weekend)</label><input type="number" value={form.priceWeekend} onChange={e=>setForm({...form, priceWeekend:e.target.value})} /></div>
                </div>
                <hr style={{borderColor:'var(--border-color)', margin:'1rem 0'}}/>
                <h3>Assign Manager</h3>
                <div className="form-row">
                    <div className="form-group"><label>Name</label><input value={form.managerName} onChange={e=>setForm({...form, managerName:e.target.value})} required /></div>
                    <div className="form-group"><label>Email</label><input type="email" value={form.managerEmail} onChange={e=>setForm({...form, managerEmail:e.target.value})} required /></div>
                </div>
                <button type="submit" className="confirm-btn">Create System</button>
            </form>
        </div>

        {/* COURT LIST WITH MANAGE BUTTON */}
        <div className="activity-section">
            <h2>Active Facilities</h2>
            <div className="courts-list" style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
                {data.courts.length === 0 && <p style={{color:'#888'}}>No facilities active.</p>}
                {data.courts.map(court => (
                    <div key={court._id} style={{background:'var(--bg-input)', padding:'1rem', borderRadius:'8px', border:'1px solid var(--border-color)'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                            <div>
                                <h3 style={{margin:0, color:'var(--primary-color)'}}>{court.name}</h3>
                                <p style={{fontSize:'0.85rem', color:'#aaa', margin:'5px 0'}}>{court.location} • {court.sportType}</p>
                                <div style={{fontSize:'0.8rem', background:'rgba(255,255,255,0.05)', padding:'5px', borderRadius:'4px', marginTop:'5px'}}>
                                    Manager: <span style={{color:'white'}}>{court.manager?.email || 'Unassigned'}</span>
                                </div>
                            </div>
                            <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                                {/* MANAGE BUTTON */}
                                <button 
                                    onClick={() => navigate(`/courts/${court._id}`)} 
                                    style={{background:'#3b82f6', border:'none', color:'white', padding:'6px 12px', borderRadius:'4px', cursor:'pointer', fontWeight:'600'}}
                                >
                                    Manage
                                </button>
                                {/* DELETE BUTTON */}
                                <button 
                                    onClick={() => handleDelete(court._id)} 
                                    style={{background:'transparent', border:'1px solid #ef4444', color:'#ef4444', padding:'6px 12px', borderRadius:'4px', cursor:'pointer'}}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;