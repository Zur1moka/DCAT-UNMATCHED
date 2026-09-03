import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/ToastContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Ranking from './pages/Ranking';
import TierList from './pages/TierList';
import HonorRanking from './pages/HonorRanking';
import AdminPanel from './pages/AdminPanel';
import Header from './components/layout/Header';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <>
                  <Header />
                  <main className="min-h-screen pb-10"><Dashboard /></main>
                </>
              </PrivateRoute>
            }
          />
          <Route
            path="/history"
            element={
              <PrivateRoute>
                <>
                  <Header />
                  <main className="min-h-screen pb-10"><History /></main>
                </>
              </PrivateRoute>
            }
          />
          <Route
            path="/ranking"
            element={
              <PrivateRoute>
                <>
                  <Header />
                  <main className="min-h-screen pb-10"><Ranking /></main>
                </>
              </PrivateRoute>
            }
          />
          <Route
            path="/tierlist"
            element={
              <PrivateRoute>
                <>
                  <Header />
                  <main className="min-h-screen pb-10"><TierList /></main>
                </>
              </PrivateRoute>
            }
          />
          <Route
            path="/honor"
            element={
              <PrivateRoute>
                <>
                  <Header />
                  <main className="min-h-screen pb-10"><HonorRanking /></main>
                </>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <>
                  <Header />
                  <main className="min-h-screen pb-10"><AdminPanel /></main>
                </>
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;