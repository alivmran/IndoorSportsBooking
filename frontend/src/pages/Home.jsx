import { useEffect, useState, useContext } from 'react';
import API from '../api/axios';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';

const Home = () => {
  const [courts, setCourts] = useState([]);
  const { user } = useContext(AuthContext);
  
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [courtForm, setCourtForm] = useState({ 
    name: '', 
    sportType: 'Padel', 
    pricePerHour: '', 
    description: '' 
  });

  const fetchCourts = async () => {
    try {
      const { data } = await API.get('/courts');
      setCourts(data);
    } catch (error) {
      toast.error('Failed to load courts');
    }
  };

  useEffect(() => {
    fetchCourts();
  }, []);

  const handleBooking = async (e) => {
    e.preventDefault();
    try {
      await API.post('/bookings', {
        courtId: selectedCourt,
        date,
        startTime,
        endTime
      });
      toast.success('Booking Request Sent!');
      setSelectedCourt(null);
      setDate('');
      setStartTime('');
      setEndTime('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking Failed');
    }
  };

  const handleDeleteCourt = async (id) => {
    if(window.confirm('Delete court?')){
        try {
            await API.delete(`/courts/${id}`);
            fetchCourts();
            toast.success('Court Deleted');
        } catch (error) {
            toast.error('Failed to delete');
        }
    }
  };

  const handleCourtSubmit = async (e) => {
      e.preventDefault();
      try {
          if(isEditing){
             await API.put(`/courts/${isEditing}`, courtForm);
             toast.success('Court Updated');
          } else {
             await API.post('/courts', courtForm);
             toast.success('Court Added');
          }
          closeAdminModal();
          fetchCourts();
      } catch (error) {
          toast.error('Operation failed');
      }
  };

  const openAddModal = () => {
      setCourtForm({ name: '', sportType: 'Padel', pricePerHour: '', description: '' });
      setIsEditing(null);
      setShowAdminModal(true);
  };

  const openEditModal = (court) => {
      setCourtForm({
          name: court.name,
          sportType: court.sportType,
          pricePerHour: court.pricePerHour,
          description: court.description
      });
      setIsEditing(court._id);
      setShowAdminModal(true);
  };

  const closeAdminModal = () => {
      setShowAdminModal(false);
      setIsEditing(null);
  };

  return (
    <div className="page-container">
      <div className="header-section">
        <h1 className="page-title">Available Courts</h1>
        {user.isAdmin && (
            <button className="add-btn" onClick={openAddModal}>+ Add New Court</button>
        )}
      </div>

      <div className="courts-grid">
        {courts.map((court) => (
          <div key={court._id} className="card">
            <div className="card-header">
                <h3>{court.name}</h3>
                <span className="badge">{court.sportType}</span>
            </div>
            <div className="card-body">
                <p className="price">${court.pricePerHour} <span className="per-hr">/ hour</span></p>
                <p className="desc">{court.description}</p>
            </div>
            <div className="card-footer">
                {user.isAdmin ? (
                    <>
                        <button onClick={() => openEditModal(court)} className="edit-btn">Edit</button>
                        <button onClick={() => handleDeleteCourt(court._id)} className="delete-btn">Delete</button>
                    </>
                ) : (
                    <button className="book-btn" onClick={() => setSelectedCourt(court._id)}>Book Now</button>
                )}
            </div>
          </div>
        ))}
      </div>

      {selectedCourt && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Request Booking</h3>
            <form onSubmit={handleBooking}>
              <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div className="form-row">
                  <div className="form-group">
                      <label>Start Time</label>
                      <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                  </div>
                  <div className="form-group">
                      <label>End Time</label>
                      <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                  </div>
              </div>
              <div className="modal-actions">
                  <button type="submit" className="confirm-btn">Send Request</button>
                  <button type="button" onClick={() => setSelectedCourt(null)} className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdminModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isEditing ? 'Edit Court' : 'Add New Court'}</h3>
            <form onSubmit={handleCourtSubmit}>
                <div className="form-group">
                    <label>Court Name</label>
                    <input value={courtForm.name} onChange={e=>setCourtForm({...courtForm, name: e.target.value})} required />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Sport Type</label>
                        <select value={courtForm.sportType} onChange={e=>setCourtForm({...courtForm, sportType: e.target.value})}>
                            <option value="Padel">Padel</option>
                            <option value="Futsal">Futsal</option>
                            <option value="Cricket">Cricket</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Price ($/hr)</label>
                        <input type="number" value={courtForm.pricePerHour} onChange={e=>setCourtForm({...courtForm, pricePerHour: e.target.value})} required />
                    </div>
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <textarea rows="3" value={courtForm.description} onChange={e=>setCourtForm({...courtForm, description: e.target.value})} />
                </div>
                <div className="modal-actions">
                    <button type="submit" className="confirm-btn">{isEditing ? 'Update Court' : 'Create Court'}</button>
                    <button type="button" onClick={closeAdminModal} className="cancel-btn">Cancel</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;