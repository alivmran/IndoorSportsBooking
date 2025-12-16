import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';

const Register = () => {
  const { register } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCode, setAdminCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password, isAdmin, adminCode);
      toast.success('Registration successful!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="form-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
        />
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        
        <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
            <input 
                type="checkbox" 
                checked={isAdmin} 
                onChange={(e) => setIsAdmin(e.target.checked)} 
                style={{ width: 'auto', margin: '0 10px 0 0' }}
            />
            <label>Register as Admin</label>
        </div>

        {isAdmin && (
            <input 
                type="password" 
                placeholder="Enter Admin Secret Code" 
                value={adminCode} 
                onChange={(e) => setAdminCode(e.target.value)} 
                required 
            />
        )}

        <button type="submit">Register & Login</button>
      </form>
      <p style={{marginTop: '15px', textAlign: 'center'}}>
        Already have an account? <Link to="/">Login here</Link>
      </p>
    </div>
  );
};

export default Register;