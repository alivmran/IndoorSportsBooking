import { useEffect, useState } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';

const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  
  // Manual Block State
  const [blockForm, setBlockForm] = useState({ date: '', startTime: '', endTime: '' });

  const fetchStats = async () => {
    try {
      const { data } = await API.get('/manager/dashboard');
      setData(data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleBlock = async (e) => {
    e.preventDefault();
    try {
        await API.post('/manager/block', blockForm);
        toast.success('Time Slot Blocked');
        setBlockForm({ date: '', startTime: '', endTime: '' });
    } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to block');
    }
  };

  if (!data) return <div className="page-container">Loading Dashboard...</div>;

  return (
    <div className="page-container">
      <h1 className="page-title">Manager Dashboard: {data.courtName}</h1>

      {/* Analytics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
            <h3>Total Revenue</h3>
            <p className="stat-value">PKR {data.stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="stat-card">
            <h3>Active Bookings</h3>
            <p className="stat-value">{data.stats.activeBookings}</p>
        </div>
        <div className="stat-card">
            <h3>Pending Requests</h3>
            <p className="stat-value" style={{color: '#facc15'}}>{data.stats.pendingRequests}</p>
        </div>
        <div className="stat-card">
            <h3>Total Bookings</h3>
            <p className="stat-value">{data.stats.totalBookings}</p>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* Left: Recent Activity */}
        <div className="activity-section">
            <h2>Recent Activity</h2>
            <div className="table-container">
                <table className="bookings-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Date / Time</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.recentActivity.map(booking => (
                            <tr key={booking._id}>
                                <td>{booking.user ? booking.user.name : 'Manual Block'}</td>
                                <td>{booking.date} <br/> {booking.startTime}</td>
                                <td><span className={`status ${booking.status.toLowerCase()}`}>{booking.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Right: Manual Block Tool */}
        <div className="block-section">
            <div className="form-container" style={{margin:0, maxWidth:'100%'}}>
                <h2>Block Time Slot</h2>
                <p>Mark a slot as taken for maintenance or offline booking.</p>
                <form onSubmit={handleBlock}>
                    <div className="form-group">
                        <label>Date</label>
                        <input type="date" value={blockForm.date} onChange={e => setBlockForm({...blockForm, date: e.target.value})} required />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                             <label>Start</label>
                             <input type="time" value={blockForm.startTime} onChange={e => setBlockForm({...blockForm, startTime: e.target.value})} required />
                        </div>
                        <div className="form-group">
                             <label>End</label>
                             <input type="time" value={blockForm.endTime} onChange={e => setBlockForm({...blockForm, endTime: e.target.value})} required />
                        </div>
                    </div>
                    <button className="confirm-btn" style={{backgroundColor: '#ef4444'}}>Block Slot</button>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;