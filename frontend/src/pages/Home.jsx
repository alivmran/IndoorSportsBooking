import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';

const Home = () => {
  const [courts, setCourts] = useState([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Admin State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [courtForm, setCourtForm] = useState({ 
    name: '', 
    sportType: 'Padel', 
    pricePerHour: '', 
    priceWeekend: '', 
    description: '',
    location: '' 
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

  const handleDeleteCourt = async (e, id) => {
    e.stopPropagation(); // Prevent navigating to details
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
      setCourtForm({ name: '', sportType: 'Padel', pricePerHour: '', priceWeekend: '', description: '', location: '' });
      setIsEditing(null);
      setShowAdminModal(true);
  };

  const openEditModal = (e, court) => {
      e.stopPropagation(); // Prevent navigating to details
      setCourtForm({
          name: court.name,
          sportType: court.sportType,
          pricePerHour: court.pricePerHour,
          priceWeekend: court.priceWeekend || '',
          description: court.description,
          location: court.location || ''
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
        {/* Safe check for admin user */}
        {user?.isAdmin && (
            <button className="add-btn" onClick={openAddModal}>+ Add New Court</button>
        )}
      </div>

      <div className="courts-grid">
        {courts.map((court) => (
          <div 
            key={court._id} 
            className="card" 
            onClick={() => navigate(`/courts/${court._id}`)} 
            style={{cursor: 'pointer'}}
          >
            <div className="card-header">
                <h3>{court.name}</h3>
                <span className="badge">{court.sportType}</span>
            </div>
            <div className="card-body">
                {court.images && court.images.length > 0 ? (
                  <img src={court.images[0]} alt={court.name} className="court-thumb"/>
                ) : (
                  <div className="placeholder-img">No Image</div>
                )}
                
                <p className="location-tag">📍 {court.location || 'Karachi'}</p>
                <p className="price">${court.pricePerHour} <span className="per-hr">/ hour</span></p>
                <p className="desc">{court.description?.substring(0, 60)}...</p>
            </div>
            <div className="card-footer">
                {user?.isAdmin ? (
                    <>
                        <button onClick={(e) => openEditModal(e, court)} className="edit-btn">Edit</button>
                        <button onClick={(e) => handleDeleteCourt(e, court._id)} className="delete-btn">Delete</button>
                    </>
                ) : (
                    <button className="book-btn">View Details</button>
                )}
            </div>
          </div>
        ))}
      </div>

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
                        <label>Location</label>
                         <input value={courtForm.location} onChange={e=>setCourtForm({...courtForm, location: e.target.value})} />
                    </div>
                </div>
                <div className="form-row">
                     <div className="form-group">
                        <label>Price (Weekday)</label>
                        <input type="number" value={courtForm.pricePerHour} onChange={e=>setCourtForm({...courtForm, pricePerHour: e.target.value})} required />
                    </div>
                    <div className="form-group">
                        <label>Price (Weekend)</label>
                        <input type="number" value={courtForm.priceWeekend} onChange={e=>setCourtForm({...courtForm, priceWeekend: e.target.value})} />
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