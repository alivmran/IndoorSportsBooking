import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { toast } from 'react-toastify';
import TimeSlotPicker from '../components/TimeSlotPicker';

const parseHour = (timeString, fallback) => {
  if (!timeString || typeof timeString !== 'string') return fallback;
  const [h] = timeString.split(':').map(Number);
  if (Number.isNaN(h)) return fallback;
  return h;
};

const AdminCourtView = ({ courtId }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); 
  const [editForm, setEditForm] = useState({});
  const [blockForm, setBlockForm] = useState({ date: '', facility: '', timeBlocks: [] });
  const [unavailableSlots, setUnavailableSlots] = useState([]);
  const hourOptions = Array.from({ length: 25 }, (_, h) => `${h.toString().padStart(2, '0')}:00`);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await API.get(`/admin/court/${courtId}/stats`);
        setData(data);
        setEditForm({
            name: data.court.name,
            location: data.court.location,
            facilities: data.court.facilities || [],
            amenities: data.court.amenities || [],
            googleMapLink: data.court.googleMapLink || '',
            paymentBank: data.court.paymentBank || '',
            paymentAccountTitle: data.court.paymentAccountTitle || '',
            paymentAccountNumber: data.court.paymentAccountNumber || '',
            advanceRequired: data.court.advanceRequired || 0,
            pricePerHour: data.court.pricePerHour,
            priceWeekend: data.court.priceWeekend,
            description: data.court.description,
            operationalStartTime: data.court.operationalStartTime || '00:00',
            operationalEndTime: data.court.operationalEndTime || '24:00'
        });
        setBlockForm((prev) => ({ ...prev, facility: data.court.facilities?.[0] || '' }));
      } catch (err) {
        toast.error('Failed to load court data.');
      }
    };
    if(courtId) fetchData(); 
  }, [courtId]);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!blockForm.date || !blockForm.facility) return;
      try {
        const { data: slots } = await API.get(`/bookings/availability?courtId=${courtId}&date=${blockForm.date}&facility=${blockForm.facility}`);
        setUnavailableSlots(slots);
        setBlockForm((prev) => ({ ...prev, timeBlocks: [] }));
      } catch {
        toast.error('Failed to load availability');
      }
    };
    fetchAvailability();
  }, [blockForm.date, blockForm.facility, courtId]);

  const handleUpdate = async (e) => {
      e.preventDefault();
      try {
        await API.put(`/admin/court/${courtId}`, editForm);
        toast.success('Updated');
      } 
      catch (error) { toast.error('Update failed'); }
  };

  const toggleEditFacility = (facility) => {
    setEditForm((prev) => {
      const current = prev.facilities || [];
      const next = current.includes(facility) ? current.filter((f) => f !== facility) : [...current, facility];
      return { ...prev, facilities: next.length ? next : current };
    });
  };

  const toggleEditAmenity = (amenity) => {
    setEditForm((prev) => {
      const current = prev.amenities || [];
      if (current.includes(amenity)) return { ...prev, amenities: current.filter((a) => a !== amenity) };
      if (current.length >= 5) return prev;
      return { ...prev, amenities: [...current, amenity] };
    });
  };

  const handleBlock = async (e) => {
      e.preventDefault();
      const grouped = (() => {
        const sorted = [...blockForm.timeBlocks].sort();
        if (!sorted.length) return [];
        const blocks = [];
        let currentStart = sorted[0].split('-')[0];
        let currentEnd = sorted[0].split('-')[1];
        for (let i = 1; i < sorted.length; i++) {
          const [nextStart, nextEnd] = sorted[i].split('-');
          if (currentEnd === nextStart) currentEnd = nextEnd;
          else {
            blocks.push({ startTime: currentStart, endTime: currentEnd });
            currentStart = nextStart;
            currentEnd = nextEnd;
          }
        }
        blocks.push({ startTime: currentStart, endTime: currentEnd });
        return blocks;
      })();

      if (!grouped.length) {
        toast.error('Select at least one time slot');
        return;
      }
      try {
        await API.post('/admin/block-slot', { courtId, facility: blockForm.facility, date: blockForm.date, timeBlocks: grouped });
        toast.success('Blocked');
      } 
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
                    <div className="form-group"><label>Location</label><input value={editForm.location || ''} onChange={e=>setEditForm({...editForm, location:e.target.value})} /></div>
                    <div className="form-group"><label>Google Maps Link / Embed URL</label><input value={editForm.googleMapLink || ''} onChange={e=>setEditForm({...editForm, googleMapLink:e.target.value})} /></div>
                    <div className="form-group">
                      <label>Facilities</label>
                      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(110px, 1fr))', gap:'8px'}}>
                        {['Futsal', 'Padel', 'Cricket'].map((f) => (
                          <button key={f} type="button" onClick={() => toggleEditFacility(f)} style={{
                            border:'1px solid',
                            borderColor:(editForm.facilities || []).includes(f) ? '#3b82f6' : '#334155',
                            background:(editForm.facilities || []).includes(f) ? 'rgba(59,130,246,0.2)' : '#111827',
                            color:(editForm.facilities || []).includes(f) ? '#bfdbfe' : '#cbd5e1',
                            borderRadius:'8px', padding:'8px', cursor:'pointer', fontWeight:'700'
                          }}>{f}</button>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Amenities (up to 5)</label>
                      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))', gap:'8px'}}>
                        {['Parking', 'Showers', 'Cafe', 'Floodlights', 'Changing Room'].map((a) => (
                          <button key={a} type="button" onClick={() => toggleEditAmenity(a)} style={{
                            border:'1px solid',
                            borderColor:(editForm.amenities || []).includes(a) ? '#10b981' : '#334155',
                            background:(editForm.amenities || []).includes(a) ? 'rgba(16,185,129,0.2)' : '#111827',
                            color:(editForm.amenities || []).includes(a) ? '#a7f3d0' : '#cbd5e1',
                            borderRadius:'8px', padding:'8px', cursor:'pointer', fontWeight:'700'
                          }}>{a}</button>
                        ))}
                      </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Weekday Price</label><input value={editForm.pricePerHour} onChange={e=>setEditForm({...editForm, pricePerHour:e.target.value})} /></div>
                        <div className="form-group"><label>Weekend Price</label><input value={editForm.priceWeekend} onChange={e=>setEditForm({...editForm, priceWeekend:e.target.value})} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Payment Bank</label><input value={editForm.paymentBank || ''} onChange={e=>setEditForm({...editForm, paymentBank:e.target.value})} /></div>
                        <div className="form-group"><label>Account Title</label><input value={editForm.paymentAccountTitle || ''} onChange={e=>setEditForm({...editForm, paymentAccountTitle:e.target.value})} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Account Number</label><input value={editForm.paymentAccountNumber || ''} onChange={e=>setEditForm({...editForm, paymentAccountNumber:e.target.value})} /></div>
                        <div className="form-group"><label>Advance Required (PKR)</label><input type="number" value={editForm.advanceRequired || 0} onChange={e=>setEditForm({...editForm, advanceRequired:e.target.value})} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                          <label>Operational Start</label>
                          <select value={editForm.operationalStartTime || '00:00'} onChange={e=>setEditForm({...editForm, operationalStartTime:e.target.value})}>
                            {hourOptions.slice(0, 24).map((h) => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Operational End</label>
                          <select value={editForm.operationalEndTime || '24:00'} onChange={e=>setEditForm({...editForm, operationalEndTime:e.target.value})}>
                            {hourOptions.slice(1).map((h) => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </div>
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
                    <div className="form-group"><label>Facility</label><select value={blockForm.facility} onChange={e=>setBlockForm({...blockForm, facility:e.target.value})}>{(data.court.facilities || []).map((f) => <option key={f} value={f}>{f}</option>)}</select></div>
                    <div className="form-group"><label>Date</label><input type="date" onChange={e=>setBlockForm({...blockForm, date:e.target.value})} required/></div>
                    {blockForm.date && (
                      <div className="form-group">
                        <label>Select Time Slots</label>
                        <TimeSlotPicker
                          selectedSlots={blockForm.timeBlocks}
                          onChange={(slots) => setBlockForm((prev) => ({ ...prev, timeBlocks: slots }))}
                          unavailableSlots={unavailableSlots}
                          startHour={parseHour(data.court.operationalStartTime, 0)}
                          endHour={parseHour(data.court.operationalEndTime, 24)}
                          selectedDate={blockForm.date}
                        />
                      </div>
                    )}
                    <button className="confirm-btn" style={{background:'#ef4444'}}>Confirm Block</button>
                </form>
            </div>
        )}
    </div>
  );
};

export default AdminCourtView;