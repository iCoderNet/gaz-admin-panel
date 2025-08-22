import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Users from '@/pages/Users';
import Azots from '@/pages/Azots';
import Accessories from '@/pages/Accessories';
import Services from '@/pages/Services';
import Promocodes from '@/pages/Promocodes';
import TgMessages from '@/pages/TgMessages';
import Orders from '@/pages/Orders';
import SettingsPage from './pages/Settings';
// import Orders from '@/pages/Orders';
// import Services from '@/pages/Services';
// import Accessories from '@/pages/Accessories';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Users />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/azots"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Azots />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Orders />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/services"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Services />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/accessories"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Accessories />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/promocodes"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Promocodes />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tg-messages"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TgMessages />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SettingsPage />
                  </Layout>
                </ProtectedRoute>
              }
            /> 
            </Routes>
          </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;