import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData.name, formData.email, formData.password);
      navigate('/'); 
    } catch (error) {
      toast.error('Registration failed. Try again.');
    }
  };

  return (
    <div className="page-container">
      <div className="form-container">
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Name" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            required 
          />
          <input 
            type="email" 
            placeholder="Email" 
            value={formData.email} 
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={formData.password} 
            onChange={(e) => setFormData({...formData, password: e.target.value})} 
            required 
          />
          <button type="submit">Register & Login</button>
        </form>
        
        <p className="form-footer-text">
          Already have an account? 
          <Link to="/login" className="form-link">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;