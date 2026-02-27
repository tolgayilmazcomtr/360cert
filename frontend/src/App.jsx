import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import BalancePage from "./pages/BalancePage";
import StudentsPage from "./pages/StudentsPage";
import TrainingProgramsPage from "./pages/TrainingProgramsPage";
import CertificatesPage from "./pages/CertificatesPage";
import CertificateTypesPage from "./pages/CertificateTypesPage";
import CertificateTemplatesPage from "./pages/CertificateTemplatesPage";
import TemplateDesignPage from "./pages/TemplateDesignPage";
import VerificationPage from "./pages/VerificationPage";
import LandingPage from "./pages/LandingPage";
import DealerApplicationPage from "./pages/DealerApplicationPage";
import Register from "./pages/Register";
import PublicLayout from "./components/PublicLayout";
import CertificateVerificationPage from "./pages/CertificateVerificationPage";
import DynamicPage from "./pages/DynamicPage";
import ContactPage from "./pages/ContactPage";
import PublicTrainingsPage from "./pages/PublicTrainingsPage";
import DealersPage from "./pages/DealersPage";
import FinancePage from "./pages/FinancePage";
import TransactionsPage from "./pages/TransactionsPage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
import CertificateCreatePage from "./pages/CertificateCreatePage";
import BulkUploadPage from "./pages/BulkUploadPage";
import PackagesPage from "./pages/PackagesPage";
import PaymentHistoryPage from "./pages/PaymentHistoryPage";
import ProfilePage from "./pages/ProfilePage";
import AdminProfilePage from "./pages/AdminProfilePage";
import AdminUsersPage from "./pages/AdminUsersPage";
import PagesPage from "./pages/PagesPage";
import AccreditationsPage from "./pages/AccreditationsPage";

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
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/apply-dealer" element={<DealerApplicationPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/sertifika-dogrula" element={<CertificateVerificationPage />} />
        <Route path="/programs" element={<PublicTrainingsPage />} />
        <Route path="/:slug" element={<DynamicPage />} />
      </Route>

      {/* Standalone Auth / Verification Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify/:hash" element={<VerificationPage />} />

      {/* Dashboard Routes are now under /dashboard or simply as the main protected layer */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="balance" element={<BalancePage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="programs" element={<TrainingProgramsPage />} />
        <Route path="certificates" element={<CertificatesPage />} />
        <Route path="certificates/new" element={<CertificateCreatePage />} />
        <Route path="certificates/bulk" element={<BulkUploadPage />} />
        <Route path="templates" element={<CertificateTemplatesPage />} />
        <Route path="templates/:id/design" element={<TemplateDesignPage />} />
        <Route path="certificate-types" element={<CertificateTypesPage />} />
        <Route path="dealers" element={<DealersPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="payment-history" element={<PaymentHistoryPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="admin/profile" element={<AdminProfilePage />} />
        <Route path="admin/users" element={<AdminUsersPage />} />
        <Route path="pages" element={<PagesPage />} />
        <Route path="accreditations" element={<AccreditationsPage />} />
        {/* Diğer alt sayfalar buraya eklenecek */}
      </Route>

      {/* Legacy Fallback for dashboard base paths if they omit /dashboard (optional, but a catchall redirect is safer) */}
      <Route path="*" element={<Navigate to="/" replace />} />
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
