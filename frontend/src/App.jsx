// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/ToastContext';
import Login from './pages/Login';
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

const ProtectedLayout = ({ children }) => (
  <>
    <Header />
    <main className="min-h-screen pb-10">{children}</main>
  </>
);

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/history"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <History />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/ranking"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <Ranking />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/tierlist"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <TierList />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/honor"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <HonorRanking />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <AdminPanel />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;