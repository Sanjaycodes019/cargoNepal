import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Trucks from './pages/Trucks';
import TruckDetail from './pages/TruckDetail';
import Dashboard from './pages/Dashboard';
import NewBooking from './pages/NewBooking';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import Footer from './components/Footer';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/trucks" element={<Trucks />} />
            <Route path="/trucks/:id" element={<TruckDetail />} />

            {/* Customer Routes */}
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/new-booking"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <NewBooking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/profile"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Owner Routes */}
            <Route
              path="/owner/dashboard"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <OwnerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/profile"
              element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Redirect old dashboard route */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Navigate to="/customer/dashboard" replace />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

