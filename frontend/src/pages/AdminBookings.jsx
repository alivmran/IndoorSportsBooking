import { useEffect, useState } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);

  const fetchBookings = async () => {
    try {
      const { data } = await API.get('/bookings');
      setBookings(data);
    } catch (error) {
      toast.error('Failed to load bookings');
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatus = async (id, status) => {
      try {
          await API.patch(`/bookings/${id}/status`, { status });
          toast.success(`Booking ${status}`);
          fetchBookings();
      } catch (error) {
          toast.error(error.response?.data?.message || 'Action failed');
      }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Booking Requests</h1>
      <div className="table-container">
        <table className="bookings-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Court</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td>
                    <div className="user-info">
                        <span className="user-name">{b.user?.name}</span>
                        <span className="user-email">{b.user?.email}</span>
                    </div>
                  </td>
                  <td>{b.court?.name}</td>
                  <td>{b.date} <br/> <span className="time-slot">{b.startTime} - {b.endTime}</span></td>
                  <td>
                      <span className={`status ${b.status.toLowerCase()}`}>{b.status}</span>
                  </td>
                  <td>
                      {b.status === 'Pending' ? (
                          <div className="action-buttons">
                              <button onClick={() => handleStatus(b._id, 'Approved')} className="approve-btn">Accept</button>
                              <button onClick={() => handleStatus(b._id, 'Rejected')} className="reject-btn">Deny</button>
                          </div>
                      ) : (
                          <span className="action-done">Completed</span>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminBookings;