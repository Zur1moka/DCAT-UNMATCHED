import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Ranking from './pages/Ranking';
import TierList from './pages/TierList';
import HonorRanking from './pages/HonorRanking';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <main className="min-h-screen pb-10">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/tierlist" element={<TierList />} />
          <Route path="/honor" element={<HonorRanking />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;