import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api', 
});

API.interceptors.request.use((req) => {
  if (sessionStorage.getItem('token')) {
    req.headers.Authorization = `Bearer ${sessionStorage.getItem('token')}`;
  }
  return req;
});

export default API;