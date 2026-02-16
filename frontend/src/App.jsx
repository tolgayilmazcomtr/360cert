import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import BalancePage from "./pages/BalancePage";
import StudentsPage from "./pages/StudentsPage";
import TrainingProgramsPage from "./pages/TrainingProgramsPage";
import CertificatesPage from "./pages/CertificatesPage";
import CertificateTemplatesPage from "./pages/CertificateTemplatesPage";
import TemplateDesignPage from "./pages/TemplateDesignPage";
import VerificationPage from "./pages/VerificationPage";
import Register from "./pages/Register";
import DealersPage from "./pages/DealersPage";
import FinancePage from "./pages/FinancePage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
import CertificateCreatePage from "./pages/CertificateCreatePage";
import BulkUploadPage from "./pages/BulkUploadPage";

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Yükleniyor...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify/:hash" element={<VerificationPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="balance" element={<BalancePage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="programs" element={<TrainingProgramsPage />} />
        <Route path="certificates" element={<CertificatesPage />} />
        <Route path="certificates/new" element={<CertificateCreatePage />} />
        <Route path="certificates/bulk" element={<BulkUploadPage />} />
        <Route path="templates" element={<CertificateTemplatesPage />} />
        <Route path="templates" element={<CertificateTemplatesPage />} />
        <Route path="templates/:id/design" element={<TemplateDesignPage />} />
        <Route path="dealers" element={<DealersPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        {/* Diğer alt sayfalar buraya eklenecek */}
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
