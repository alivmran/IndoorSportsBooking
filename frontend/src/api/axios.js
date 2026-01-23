import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

API.interceptors.request.use((req) => {
  if (localStorage.getItem('userInfo')) {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const token = userInfo.token || userInfo; 
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;