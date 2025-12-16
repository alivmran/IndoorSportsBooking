import { createContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('userInfo');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const navigate = useNavigate();

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    sessionStorage.setItem('userInfo', JSON.stringify(data));
    sessionStorage.setItem('token', data.token);
    setUser(data);
    navigate('/dashboard'); 
  };

  const register = async (name, email, password, isAdmin, adminCode) => {
    const { data } = await API.post('/auth/signup', { 
      name, email, password, isAdmin, adminCode 
    });
    sessionStorage.setItem('userInfo', JSON.stringify(data));
    sessionStorage.setItem('token', data.token);
    setUser(data);
    navigate('/dashboard'); 
  };

  const logout = () => {
    sessionStorage.removeItem('userInfo');
    sessionStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;