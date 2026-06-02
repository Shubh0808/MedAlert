import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import UserLayout from "./layouts/UserLayout.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import Contacts from "./pages/user/Contacts.jsx";
import Dashboard from "./pages/user/Dashboard.jsx";
import EmergencyHistory from "./pages/user/EmergencyHistory.jsx";
import HospitalFinder from "./pages/user/HospitalFinder.jsx";
import MedicalProfile from "./pages/user/MedicalProfile.jsx";
import MedicalRecords from "./pages/user/MedicalRecords.jsx";
import QRCard from "./pages/user/QRCard.jsx";
import SOSPage from "./pages/user/SOSPage.jsx";

const App = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password/:token" element={<ResetPassword />} />

    <Route
      path="/app"
      element={
        <ProtectedRoute>
          <UserLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<Dashboard />} />
      <Route path="profile" element={<MedicalProfile />} />
      <Route path="contacts" element={<Contacts />} />
      <Route path="sos" element={<SOSPage />} />
      <Route path="hospitals" element={<HospitalFinder />} />
      <Route path="records" element={<MedicalRecords />} />
      <Route path="qr-card" element={<QRCard />} />
      <Route path="history" element={<EmergencyHistory />} />
    </Route>

    <Route
      path="/admin"
      element={
        <ProtectedRoute roles={["admin"]}>
          <AdminLayout />
        </ProtectedRoute>
      }
    >
      <Route index element={<AdminDashboard />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
