import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';

// Farmer Pages
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import FarmManagement from './pages/farmer/FarmManagement';
import FarmDetail from './pages/farmer/FarmDetail';
import CropCatalog from './pages/farmer/CropCatalog';
import CropRecommendation from './pages/farmer/CropRecommendation';
import YieldPrediction from './pages/farmer/YieldPrediction';
import FertilizerRecommendation from './pages/farmer/FertilizerRecommendation';
import WeatherDashboard from './pages/farmer/WeatherDashboard';
import MarketPrices from './pages/farmer/MarketPrices';
import FarmerMarketplace from './pages/farmer/FarmerMarketplace';
import ProcurementBooking from './pages/farmer/ProcurementBooking';
import DiseaseDetection from './pages/farmer/DiseaseDetection';
import FarmerSupport from './pages/farmer/FarmerSupport';

// Buyer Pages
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import BuyerProfile from './pages/buyer/BuyerProfile';
import BuyerMarketplace from './pages/buyer/BuyerMarketplace';
import BuyerOrders from './pages/buyer/BuyerOrders';
import BuyerSupport from './pages/buyer/BuyerSupport';

// Notifications Page
import Notifications from './pages/Notifications';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCropsCatalog from './pages/admin/AdminCropsCatalog';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';
import AdminComplaints from './pages/admin/AdminComplaints';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Farmer Protected Routes */}
          <Route
            path="/farmer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <DashboardLayout>
                  <FarmerDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/farms"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <DashboardLayout>
                  <FarmManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/farms/:farmId"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <DashboardLayout>
                  <FarmDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/crops"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <DashboardLayout>
                  <CropCatalog />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/recommendation"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <DashboardLayout>
                  <CropRecommendation />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/yield"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <DashboardLayout>
                  <YieldPrediction />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/fertilizer"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <DashboardLayout>
                  <FertilizerRecommendation />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/disease"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <DashboardLayout>
                  <DiseaseDetection />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/weather"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <DashboardLayout>
                  <WeatherDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/market-prices"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <DashboardLayout>
                  <MarketPrices />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/marketplace"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <DashboardLayout>
                  <FarmerMarketplace />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/procurement"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <DashboardLayout>
                  <ProcurementBooking />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer/support"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'admin']}>
                <DashboardLayout>
                  <FarmerSupport />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Buyer Protected Routes */}
          <Route
            path="/buyer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                <DashboardLayout>
                  <BuyerDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/profile"
            element={
              <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                <DashboardLayout>
                  <BuyerProfile />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/market-prices"
            element={
              <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                <DashboardLayout>
                  <MarketPrices />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/marketplace"
            element={
              <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                <DashboardLayout>
                  <BuyerMarketplace />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/orders"
            element={
              <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                <DashboardLayout>
                  <BuyerOrders />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/support"
            element={
              <ProtectedRoute allowedRoles={['buyer', 'admin']}>
                <DashboardLayout>
                  <BuyerSupport />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Shared Notifications Route */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={['farmer', 'buyer', 'admin']}>
                <DashboardLayout>
                  <Notifications />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/crops"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminCropsCatalog />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminUsers />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminReports />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <AdminComplaints />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
