import { useEffect, useState } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';
import TimeSlotPicker from '../components/TimeSlotPicker';
import { CSVLink } from 'react-csv';
import {
  LayoutDashboard,
  Download,
  Calendar,
  Banknote,
  Clock,
  ChevronRight,
  CheckCircle2,
  XCircle,
  MessageCircle,
  ShieldAlert,
  CreditCard,
  Ban
} from 'lucide-react';

const parseHour = (timeString, fallback) => {
  if (!timeString || typeof timeString !== 'string') return fallback;
  const [h] = timeString.split(':').map(Number);
  if (Number.isNaN(h)) return fallback;
  return h;
};

const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [blockDate, setBlockDate] = useState('');
  const [blockFacility, setBlockFacility] = useState('');
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [unavailableSlots, setUnavailableSlots] = useState([]);
  const [refundTidByBooking, setRefundTidByBooking] = useState({});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await API.get('/manager/dashboard');
        setData(data);
        setBlockFacility(data?.court?.facilities?.[0] || '');
      } catch (error) { toast.error('Failed to load dashboard'); }
    };
    fetchStats();
    window.addEventListener('refreshBookings', fetchStats);
    return () => window.removeEventListener('refreshBookings', fetchStats);
  }, []);

  useEffect(() => {
    if (blockDate && blockFacility && data && data.courtId) {
      const fetchAvailability = async () => {
        try {
          const res = await API.get(`/bookings/availability?courtId=${data.courtId}&date=${blockDate}&facility=${blockFacility}`);
          setUnavailableSlots(res.data);
          setSelectedSlots([]);
        } catch (e) { console.error(e); }
      };
      fetchAvailability();
    }
  }, [blockDate, data, blockFacility]);

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
      await API.post('/manager/block', { date: blockDate, facility: blockFacility, timeBlocks });
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
      const { data } = await API.get('/manager/dashboard');
      setData(data);
    } catch (error) { toast.error('Update failed'); }
  };

  const handleRescheduleResponse = async (id, accept) => {
    try {
      await API.put(`/bookings/${id}/reschedule-response`, { accept });
      toast.success(accept ? 'Reschedule Approved' : 'Reschedule Rejected');
      const { data } = await API.get('/manager/dashboard');
      setData(data);
    } catch (error) { toast.error('Update failed'); }
  };

  const submitRefundClaim = async (bookingId) => {
    const refundTransactionId = refundTidByBooking[bookingId];
    if (!refundTransactionId) {
      toast.error('Enter refund transaction ID first');
      return;
    }
    try {
      await API.put(`/bookings/${bookingId}/complete-refund`, { refundTransactionId });
      toast.success('Refund marked as claimed');
      const { data } = await API.get('/manager/dashboard');
      setData(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit refund');
    }
  };

  if (!data) return <div className="page-container">Loading...</div>;

  return (
    <div className="page-container">
      {/* Header Section */}
      <div className="header-section" style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
        padding: '2rem',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background element */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(59, 130, 246, 0.05)', filter: 'blur(60px)', borderRadius: '50%' }}></div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>
            <LayoutDashboard color="#3b82f6" size={28} />
            Manager Portal
          </h1>
          <p style={{ color: '#9ca3af', marginTop: '12px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            Managing: <span style={{ color: 'white', fontWeight: '700' }}>{data.courtName}</span>
            <span style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }}></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></span>
              Active
            </span>
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {data.approvedBookings && (
            <CSVLink
              data={data.approvedBookings.map(b => ({
                Date: b.date,
                Time: `${b.startTime} - ${b.endTime}`,
                Customer: b.user ? b.user.name : 'Manual Block',
                Facility: b.facility,
                Revenue: b.totalPrice || 0
              }))}
              filename={"revenue-report.csv"}
              style={{
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 24px',
                fontSize: '0.9rem',
                borderRadius: '14px',
                color: '#fff',
                fontWeight: '700',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <Download size={20} /> Export Revenue Data
            </CSVLink>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
          <Banknote size={20} style={{ color: '#10b981', marginBottom: '8px' }} />
          <h3>Total Revenue</h3>
          <p className="stat-value" style={{ color: '#10b981', fontSize: '1.5rem' }}>PKR {data.stats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%)', borderColor: 'rgba(251, 191, 36, 0.2)' }}>
          <Clock size={20} style={{ color: '#fbbf24', marginBottom: '8px' }} />
          <h3>Pending</h3>
          <p className="stat-value" style={{ color: '#fbbf24', fontSize: '1.5rem' }}>{data.stats.pendingRequests}</p>
        </div>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
          <CheckCircle2 size={20} style={{ color: '#60a5fa', marginBottom: '8px' }} />
          <h3>Confirmed</h3>
          <p className="stat-value" style={{ color: '#60a5fa', fontSize: '1.5rem' }}>{data.stats.activeBookings}</p>
        </div>
      </div>

      <div className="dashboard-layout" style={{ marginTop: '2rem' }}>
        <div className="activity-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}><Calendar size={20} color="#3b82f6" /> Recent Activity</h2>
          </div>
          <div style={{ display: 'grid', gap: '16px' }}>
            {data.recentActivity.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <p style={{ color: '#6b7280' }}>No recent activity to show.</p>
              </div>
            ) : (
              data.recentActivity.map((b) => (
                <div key={b._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.25rem', transition: 'transform 0.2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
                        <ChevronRight size={20} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>{b.user ? b.user.name : 'Manual Block'}</h4>
                        <p style={{ margin: '4px 0', color: '#93c5fd', fontSize: '0.85rem', fontWeight: '600' }}>{b.facility}</p>
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} /> {b.date} <Clock size={14} style={{ marginLeft: '4px' }} /> {b.startTime} - {b.endTime}
                        </p>
                      </div>
                    </div>
                    <span className={`status ${b.status.toLowerCase().replace(/\s+/g, '-')}`} style={{ borderRadius: '8px', padding: '6px 12px', fontSize: '0.75rem', fontWeight: '800' }}>{b.status}</span>
                  </div>

                  {b.status === 'Pending' && b.type === 'Online' && (
                    <div style={{ marginTop: '1.25rem', padding: '1.25rem', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '14px', background: 'rgba(16,185,129,0.03)' }}>
                      <div style={{ fontSize: '0.9rem', color: '#d1fae5', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <CreditCard size={18} /> Payment Proof
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '10px' }}>
                          <small style={{ color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Amount Paid</small>
                          <span style={{ fontWeight: '700' }}>PKR {b.advancePaid || 0}</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '10px' }}>
                          <small style={{ color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Sender Name</small>
                          <span style={{ fontWeight: '700' }}>{b.senderName || '-'}</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '10px' }}>
                          <small style={{ color: '#9ca3af', display: 'block', marginBottom: '4px' }}>TID (last 4)</small>
                          <span style={{ fontWeight: '700' }}>{b.transactionIdShort || '-'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleStatusUpdate(b._id, 'Approved')} style={{ flex: 1, background: '#10b981', border: 'none', color: 'white', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <CheckCircle2 size={18} /> Approve
                        </button>
                        <button onClick={() => handleStatusUpdate(b._id, 'Rejected')} style={{ flex: 1, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <XCircle size={18} /> Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {b.status === 'Reschedule Requested' && (
                    <div style={{ marginTop: '1.25rem', padding: '1.25rem', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '14px', background: 'rgba(245,158,11,0.03)' }}>
                      <div style={{ fontSize: '0.9rem', color: '#fcd34d', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Calendar size={18} /> Reschedule Request
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', marginBottom: '1.25rem' }}>
                        <p style={{ margin: 0, fontSize: '0.95rem' }}>
                          New Date: <span style={{ fontWeight: '700', color: 'white' }}>{b.rescheduleDetails?.date}</span><br />
                          New Time: <span style={{ fontWeight: '700', color: 'white' }}>{b.rescheduleDetails?.startTime} - {b.rescheduleDetails?.endTime}</span>
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleRescheduleResponse(b._id, true)} style={{ flex: 1, background: '#10b981', border: 'none', color: 'white', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800' }}>Approve</button>
                        <button onClick={() => handleRescheduleResponse(b._id, false)} style={{ flex: 1, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800' }}>Reject</button>
                      </div>
                    </div>
                  )}

                  {b.status === 'Refund Pending' && (
                    <div style={{ marginTop: '1.25rem', padding: '1.25rem', border: '1px solid rgba(250,204,21,0.2)', borderRadius: '14px', background: 'rgba(250,204,21,0.03)' }}>
                      <div style={{ fontSize: '0.95rem', color: '#fef3c7', lineHeight: '1.7', marginBottom: '15px' }}>
                        <div style={{ marginBottom: '8px', color: '#fbbf24', fontWeight: '800', fontSize: '0.8rem', letterSpacing: '0.5px' }}>PAYMENT DETAILS</div>
                        Refund Amount: <strong style={{ color: 'white' }}>PKR {b.advancePaid || 0}</strong><br />
                        Bank: <strong style={{ color: 'white' }}>{b.refundBankName}</strong><br />
                        Title: <strong style={{ color: 'white' }}>{b.refundAccountTitle}</strong><br />
                        Acc #: <strong style={{ color: 'white' }}>{b.refundAccountNumber}</strong>
                      </div>

                      {/* Refund Steps */}
                      <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px', border: '1px dashed rgba(245, 158, 11, 0.25)', marginBottom: '15px' }}>
                        <p style={{ margin: '0 0 10px 0', fontSize: '0.82rem', color: '#fbbf24', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldAlert size={14} /> REFUND PROCESS STEPS:
                        </p>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#e5e7eb', lineHeight: '1.4' }}>
                          <strong style={{ color: 'white' }}>Step 1:</strong> Send refund to the account above.
                        </p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#e5e7eb', lineHeight: '1.4' }}>
                          <strong style={{ color: 'white' }}>Step 2:</strong> Send payment screenshot to <strong style={{ color: '#fbbf24' }}>{b.refundContactNumber}</strong> via WhatsApp.
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {b.refundContactNumber && (
                          <a href={`https://wa.me/${b.refundContactNumber}`} target="_blank" rel="noreferrer" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', padding: '10px', borderRadius: '10px', textAlign: 'center', fontSize: '0.85rem', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <MessageCircle size={18} /> Message User on WhatsApp
                          </a>
                        )}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <input
                            placeholder="Refund Transaction ID"
                            value={refundTidByBooking[b._id] || ''}
                            onChange={(e) => setRefundTidByBooking((prev) => ({ ...prev, [b._id]: e.target.value }))}
                            style={{
                              flex: '1',
                              minWidth: '150px',
                              background: 'rgba(255,255,255,0.07)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              borderRadius: '10px',
                              padding: '10px 14px',
                              color: 'white',
                              fontSize: '0.9rem',
                              outline: 'none'
                            }}
                          />
                          <button onClick={() => submitRefundClaim(b._id)} style={{ background: '#3b82f6', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '800' }}>Submit</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {b.status === 'Disputed' && (
                    <div style={{ marginTop: '1.25rem', color: '#fca5a5', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <ShieldAlert size={20} style={{ flexShrink: 0 }} />
                      <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5' }}>User reported missing funds. Khelo Support will contact you via email shortly.</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="block-section" style={{ marginTop: '2rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
              <Ban className="text-red" size={24} />
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f87171' }}>Block Slot (Offline)</h3>
            </div>
            <form onSubmit={handleBlock}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Facility</label>
                  <select 
                    value={blockFacility} 
                    onChange={e => setBlockFacility(e.target.value)} 
                    required 
                    style={{ 
                      background: 'rgba(255,255,255,0.05)', 
                      borderRadius: '10px', 
                      padding: '12px',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.1)',
                      width: '100%'
                    }}
                  >
                    {(data.court?.facilities || []).map((f) => (
                      <option key={f} value={f} style={{ background: '#1a1a1a', color: 'white' }}>{f}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Date</label>
                  <input type="date" min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]} value={blockDate} onChange={e => setBlockDate(e.target.value)} required style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px' }} />
                </div>
              </div>
              {blockDate && (
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '10px', display: 'block' }}>Select Time Slots</label>
                  <TimeSlotPicker
                    selectedSlots={selectedSlots}
                    onChange={setSelectedSlots}
                    unavailableSlots={unavailableSlots}
                    startHour={parseHour(data.court?.operationalStartTime, 0)}
                    endHour={parseHour(data.court?.operationalEndTime, 24)}
                    selectedDate={blockDate}
                  />
                </div>
              )}
              <button className="confirm-btn" style={{ background: '#ef4444', width: '100%', padding: '14px', borderRadius: '12px', marginTop: '1.5rem', fontWeight: '800' }} disabled={selectedSlots.length === 0}>
                Mark as Taken
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ManagerDashboard;
