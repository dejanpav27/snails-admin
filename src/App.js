import { useLocation, BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Sidebar      from './components/Sidebar';
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Calendar     from './pages/Calendar';
import Bookings     from './pages/Bookings';
import BookingDetail from './pages/BookingDetail';
import Clients      from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Services     from './pages/Services';
import Schedule     from './pages/Schedule';
import NewBooking   from './pages/NewBooking';
import Analytics    from './pages/Analytics';
import { Spinner }  from './components/UI';

function AnimatedOutlet() {
  const location = useLocation();
  return (
    <main key={location.pathname} className="page-enter" style={{ flex: 1, overflowY: 'auto' }}>
      <Outlet />
    </main>
  );
}

function RequireAuth() {
  const { admin, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Spinner size={32} />
    </div>
  );
  if (!admin) return <Navigate to="/login" replace />;
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <AnimatedOutlet />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route path="/"              element={<Dashboard />} />
            <Route path="/calendar"      element={<Calendar />} />
            <Route path="/bookings"      element={<Bookings />} />
            <Route path="/bookings/:id"  element={<BookingDetail />} />
            <Route path="/clients"       element={<Clients />} />
            <Route path="/clients/:id"   element={<ClientDetail />} />
            <Route path="/services"      element={<Services />} />
            <Route path="/schedule"      element={<Schedule />} />
            <Route path="/new"           element={<NewBooking />} />
            <Route path="/analytics"     element={<Analytics />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
