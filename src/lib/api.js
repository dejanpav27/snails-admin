const BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const getToken = () => localStorage.getItem('snails_token');

export async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (res.status === 401) {
    localStorage.removeItem('snails_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export const login = (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
export const getServices = () => request('/services/all');
export const createService = (data) => request('/services', { method: 'POST', body: JSON.stringify(data) });
export const updateService = (id, data) => request(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteService = (id) => request(`/services/${id}`, { method: 'DELETE' });
export const deleteServicePermanent = (id) => request(`/services/${id}/permanent`, { method: 'DELETE' });
export const getBookings = (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/bookings${qs ? '?' + qs : ''}`); };
export const getBooking = (id) => request(`/bookings/${id}`);
export const createBooking = (data) => request('/bookings', { method: 'POST', body: JSON.stringify(data) });
export const createBookingAdmin = (data) => request('/bookings/admin', { method: 'POST', body: JSON.stringify(data) });
export const updateBookingStatus = (id, status) => request(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const getClients = (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/clients${qs ? '?' + qs : ''}`); };
export const getClient = (id) => request(`/clients/${id}`);
export const createClient = (data) => request('/clients', { method: 'POST', body: JSON.stringify(data) });
export const updateClient = (id, data) => request(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const getNotifications = () => request('/notifications');
export const markNotificationsRead = () => request('/notifications/read', { method: 'POST' });
