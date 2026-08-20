import axios from 'axios';
export const api=axios.create({baseURL:process.env.NEXT_PUBLIC_API_URL||'http://localhost:5000/api'});
api.interceptors.request.use(c=>{if(typeof window!=='undefined'){const t=localStorage.getItem('token');if(t)c.headers.Authorization=`Bearer ${t}`;}return c});
