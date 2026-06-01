const BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('snails_token');
}

// FIX: exported so BookingDetail can use it for delete (avoids raw fetch with no 401 handling)
export async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('snails_token');
    window.location.href = '/login';
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

// Auth
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const getMe = () => request('/auth/me');

// Services
export const getServices = () => request('/services/all');
export const createService = (data) => request('/services', { method: 'POST', body: JSON.stringify(data) });
export const updateService = (id, data) => request(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteService = (id) => request(`/services/${id}`, { method: 'DELETE' });
export const deleteServicePermanent = (id) => request(`/services/${id}/permanent`, { method: 'DELETE' });

// Availability — FIX: supports both single serviceId and array of serviceIds
export const getAvailability = (date, serviceId, serviceIds) => {
  if (serviceIds && serviceIds.length > 0) {
    return request(`/availability?date=${date}&service_ids=${serviceIds.join(',')}`);
  }
  return request(`/availability?date=${date}&service_id=${serviceId}`);
};

// Bookings
export const getBookings = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return request(`/bookings${qs ? '?' + qs : ''}`);
};
export const getBooking = (id) => request(`/bookings/${id}`);
export const createBooking = (data) =>
  request('/bookings', { method: 'POST', body: JSON.stringify(data) });
export const createBookingAdmin = (data) =>
  request('/bookings/admin', { method: 'POST', body: JSON.stringify(data) });
export const updateBookingStatus = (id, status) =>
  request(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

// Clients
export const getClients = (search) =>
  request(`/clients${search ? '?search=' + encodeURIComponent(search) : ''}`);
export const getClient = (id) => request(`/clients/${id}`);
export const createClient = (data) =>
  request('/clients', { method: 'POST', body: JSON.stringify(data) });
export const updateClient = (id, data) =>
  request(`/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

// Notifications
export const getNotifications = () => request('/notifications');
export const markAllNotificationsRead = () =>
  request('/notifications/read-all', { method: 'PATCH' });
export const markNotificationRead = (id) =>
  request(`/notifications/${id}/read`, { method: 'PATCH' });
