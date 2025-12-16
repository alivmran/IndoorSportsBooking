import { useEffect, useState } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [editBooking, setEditBooking] = useState(null);
  const [form, setForm] = useState({ date: '', startTime: '', endTime: '' });

  const fetchBookings = async () => {
    try {
      const { data } = await API.get('/bookings/mybookings');
      setBookings(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleDelete = async (id) => {
      if(window.confirm('Cancel this booking request?')){
        try {
            await API.delete(`/bookings/${id}`);
            toast.success('Booking Cancelled');
            fetchBookings();
        } catch (error) {
            toast.error('Failed to cancel');
        }
      }
  };

  const handleUpdate = async (e) => {
      e.preventDefault();
      try {
          await API.put(`/bookings/${editBooking}`, form);
          toast.success('Booking Request Updated');
          setEditBooking(null);
          fetchBookings();
      } catch (error) {
          toast.error('Failed to update');
      }
  };

  const openEdit = (b) => {
      setEditBooking(b._id);
      setForm({ date: b.date, startTime: b.startTime, endTime: b.endTime });
  };

  return (
    <div className="page-container">
      <h1 className="page-title">My Bookings</h1>
      <div className="table-container">
        <table className="bookings-table">
            <thead>
                <tr>
                <th>Court</th>
                <th>Date/Time</th>
                <th>Status</th>
                <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {bookings.map((b) => (
                <tr key={b._id}>
                    <td>{b.court?.name}</td>
                    <td>{b.date} <br/> <span style={{fontSize:'0.9rem', color:'#aaa'}}>{b.startTime} - {b.endTime}</span></td>
                    <td>
                        <span className={`status ${b.status.toLowerCase()}`}>{b.status}</span>
                    </td>
                    <td>
                        <div className="action-buttons">
                            <button onClick={() => openEdit(b)} disabled={b.status !== 'Pending'} className="edit-btn">Update</button>
                            <button onClick={() => handleDelete(b._id)} className="delete-btn">Delete</button>
                        </div>
                    </td>
                </tr>
                ))}
            </tbody>
        </table>
      </div>

        {editBooking && (
            <div className="modal-overlay">
                <div className="modal-content">
                    <h3>Update Booking</h3>
                    <form onSubmit={handleUpdate}>
                        <div className="form-group">
                            <label>Date</label>
                            <input type="date" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} required/>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Start Time</label>
                                <input type="time" value={form.startTime} onChange={e=>setForm({...form, startTime: e.target.value})} required/>
                            </div>
                            <div className="form-group">
                                <label>End Time</label>
                                <input type="time" value={form.endTime} onChange={e=>setForm({...form, endTime: e.target.value})} required/>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button type="submit" className="confirm-btn">Save Changes</button>
                            <button type="button" onClick={()=>setEditBooking(null)} className="cancel-btn">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default MyBookings;