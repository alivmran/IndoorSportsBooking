import { useEffect, useState } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';
import TimeSlotPicker from '../components/TimeSlotPicker';

const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [blockDate, setBlockDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [unavailableSlots, setUnavailableSlots] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await API.get('/manager/dashboard');
        setData(data);
      } catch (error) { toast.error('Failed to load dashboard'); }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (blockDate && data && data.courtId) {
        const fetchAvailability = async () => {
            try {
                const res = await API.get(`/bookings/availability?courtId=${data.courtId}&date=${blockDate}`);
                setUnavailableSlots(res.data);
                setSelectedSlots([]);
            } catch(e) { console.error(e); }
        };
        fetchAvailability();
    }
  }, [blockDate, data]);

  const handleBlock = async (e) => {
    e.preventDefault();
    if (selectedSlots.length === 0) {
      toast.error('Please select at least one time slot');
      return;
    }

    const groupTimeSlots = (slotsArray) => {
      const sorted = [...slotsArray].sort();
      const blocks = [];
      let currentStart = sorted[0].split('-')[0];
      let currentEnd = sorted[0].split('-')[1];
      for (let i = 1; i < sorted.length; i++) {
        const [nextStart, nextEnd] = sorted[i].split('-');
        if (currentEnd === nextStart) {
          currentEnd = nextEnd;
        } else {
          blocks.push({ startTime: currentStart, endTime: currentEnd });
          currentStart = nextStart;
          currentEnd = nextEnd;
        }
      }
      blocks.push({ startTime: currentStart, endTime: currentEnd });
      return blocks;
    };

    try {
        const timeBlocks = groupTimeSlots(selectedSlots);
        await API.post('/manager/block', { date: blockDate, timeBlocks });
        toast.success('Blocked Successfully');
        setSelectedSlots([]);
        setBlockDate('');
        const { data } = await API.get('/manager/dashboard');
        setData(data);
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to block'); }
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

      <div className="dashboard-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
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
                    <div className="form-group"><label>Date</label><input type="date" min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]} value={blockDate} onChange={e=>setBlockDate(e.target.value)} required /></div>
                    {blockDate && (
                      <div className="form-group">
                          <label>Select Time Slots</label>
                          <TimeSlotPicker selectedSlots={selectedSlots} onChange={setSelectedSlots} unavailableSlots={unavailableSlots} />
                      </div>
                    )}
                    <button className="confirm-btn" style={{background:'#ef4444'}} disabled={selectedSlots.length === 0}>Mark as Taken</button>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};
export default ManagerDashboard;