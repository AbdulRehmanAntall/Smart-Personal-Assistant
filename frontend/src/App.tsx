import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './app/context/AuthContext';
import { useAuth } from './app/context/useAuth';
import { ThemeProvider } from './app/context/ThemeContext';
import Layout from './app/components/Layout';
// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import GoogleOAuthCallbackPage from './pages/GoogleOAuthCallbackPage';
// Protected Pages
import DashboardPage from './pages/DashboardPage';
import JobFinderPage from './pages/JobFinderPage';
import AvailabilityManagerPage from './pages/AvailabilityManagerPage';
import CalendarPage from './pages/CalendarPage';
import DailyNewsPage from './pages/DailyNewsPage';
import SmartEmailPage from './pages/SmartEmailPage';
import ClassroomPendingWorkPage from './pages/ClassroomPendingWorkPage';
import SettingsPage from './pages/SettingsPage';
function FullscreenLoader({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 px-6">
      <div className="text-slate-900 dark:text-slate-100 text-base">
        {label}
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullscreenLoader label="Loading your session..." />;
  }

  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <FullscreenLoader label="Starting app..." />;
  return isAuthenticated ? <Navigate to="/dashboard" /> : <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />
      <Route path="/oauth/google" element={<GoogleOAuthCallbackPage />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/job-finder" element={<ProtectedRoute><JobFinderPage /></ProtectedRoute>} />
      <Route path="/availability" element={<ProtectedRoute><AvailabilityManagerPage /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/news" element={<ProtectedRoute><DailyNewsPage /></ProtectedRoute>} />
      <Route path="/email" element={<ProtectedRoute><SmartEmailPage /></ProtectedRoute>} />
      <Route path="/classroom" element={<ProtectedRoute><ClassroomPendingWorkPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}