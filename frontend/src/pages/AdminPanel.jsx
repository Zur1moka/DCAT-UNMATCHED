// src/pages/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { createMatch, getAllUsers, getHeroes } from '../services/api';
import { useToast } from '../components/ui/ToastContext';

const AdminPanel = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('checkin');
  const [users, setUsers] = useState([]);
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [matchForm, setMatchForm] = useState({
    player1Id: '',
    player2Id: '',
    winnerId: '',
    player1Hero: '',
    player2Hero: '',
    isAdminChallenge: false,
    isHandicap: false,
    isBountyChallenge: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, heroesRes] = await Promise.all([
          getAllUsers(),
          getHeroes()
        ]);
        setUsers(usersRes.data || []);
        setHeroes(heroesRes.data || []);
      } catch (err) {
        console.error('Lỗi lấy dữ liệu admin:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCheckin = (player) => {
    showToast(`✅ Check-in thành công cho ${player.username} (+50XP)`, 'success');
  };

  const handleSubmitMatch = async (e) => {
    e.preventDefault();
    try {
      const res = await createMatch(matchForm);
      showToast(`⚔️ Trận đấu đã lưu! XP: +${res.data.data.xpAwarded}`, 'success');
      setMatchForm({
        player1Id: '',
        player2Id: '',
        winnerId: '',
        player1Hero: '',
        player2Hero: '',
        isAdminChallenge: false,
        isHandicap: false,
        isBountyChallenge: false,
      });
    } catch (err) {
      showToast('❌ Lỗi lưu trận đấu: ' + err.response?.data?.error || err.message, 'error');
    }
  };

  if (loading) return <div className="p-6 text-gray-400">Đang tải...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold text-neon-green mb-6 flex items-center gap-2">
        ⚙️ Bảng điều khiển Admin
      </h1>

      <div className="flex gap-2 mb-6 border-b border-gray-700 pb-2 flex-wrap">
        <button
          onClick={() => setActiveTab('checkin')}
          className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'checkin' ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' : 'text-gray-400 hover:text-white'}`}
        >
          📌 Check-in
        </button>
        <button
          onClick={() => setActiveTab('match')}
          className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'match' ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' : 'text-gray-400 hover:text-white'}`}
        >
          ⚔️ Nhập trận
        </button>
        <button
          onClick={() => setActiveTab('quests')}
          className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'quests' ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' : 'text-gray-400 hover:text-white'}`}
        >
          📋 Nhiệm vụ
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'report' ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' : 'text-gray-400 hover:text-white'}`}
        >
          📊 Báo cáo
        </button>
      </div>

      {activeTab === 'checkin' && (
        <div className="bg-card-dark/80 border border-gray-700 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">📌 Điểm danh người chơi</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between bg-gray-800/50 p-3 rounded-xl">
                <span className="font-medium">{user.username}</span>
                <button
                  onClick={() => handleCheckin(user)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition"
                >
                  Check-in
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'match' && (
        <div className="bg-card-dark/80 border border-gray-700 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">⚔️ Nhập kết quả trận đấu</h2>
          <form onSubmit={handleSubmitMatch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Người chơi 1</label>
                <select
                  value={matchForm.player1Id}
                  onChange={(e) => setMatchForm({ ...matchForm, player1Id: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
                  required
                >
                  <option value="">Chọn người chơi</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tướng người chơi 1</label>
                <select
                  value={matchForm.player1Hero}
                  onChange={(e) => setMatchForm({ ...matchForm, player1Hero: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
                  required
                >
                  <option value="">Chọn tướng</option>
                  {heroes.map(h => <option key={h.id} value={h.name}>{h.name} (Tier {h.tier})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Người chơi 2</label>
                <select
                  value={matchForm.player2Id}
                  onChange={(e) => setMatchForm({ ...matchForm, player2Id: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
                  required
                >
                  <option value="">Chọn người chơi</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tướng người chơi 2</label>
                <select
                  value={matchForm.player2Hero}
                  onChange={(e) => setMatchForm({ ...matchForm, player2Hero: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
                  required
                >
                  <option value="">Chọn tướng</option>
                  {heroes.map(h => <option key={h.id} value={h.name}>{h.name} (Tier {h.tier})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Người thắng</label>
                <select
                  value={matchForm.winnerId}
                  onChange={(e) => setMatchForm({ ...matchForm, winnerId: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white"
                  required
                >
                  <option value="">Chọn người thắng</option>
                  {[matchForm.player1Id, matchForm.player2Id].filter(id => id).map(id => {
                    const u = users.find(user => user.id === parseInt(id));
                    return u ? <option key={u.id} value={u.id}>{u.username}</option> : null;
                  })}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={matchForm.isAdminChallenge}
                  onChange={(e) => setMatchForm({ ...matchForm, isAdminChallenge: e.target.checked })}
                  className="w-4 h-4"
                />
                Khiêu chiến Admin (+20XP)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={matchForm.isHandicap}
                  onChange={(e) => setMatchForm({ ...matchForm, isHandicap: e.target.checked })}
                  className="w-4 h-4"
                />
                Kèo chấp Top 4 (+30XP)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={matchForm.isBountyChallenge}
                  onChange={(e) => setMatchForm({ ...matchForm, isBountyChallenge: e.target.checked })}
                  className="w-4 h-4"
                />
                Thợ Săn Tiền Thưởng (+100XP & +100ELO)
              </label>
            </div>

            <button type="submit" className="px-6 py-2 bg-neon-green/80 hover:bg-neon-green text-black font-bold rounded-lg transition">
              Lưu trận đấu
            </button>
          </form>
        </div>
      )}

      {activeTab === 'quests' && (
        <div className="bg-card-dark/80 border border-gray-700 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">📋 Nhiệm vụ chờ phê duyệt</h2>
          <p className="text-gray-400">Chức năng đang phát triển...</p>
        </div>
      )}

      {activeTab === 'report' && (
        <div className="bg-card-dark/80 border border-gray-700 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">📊 Xuất báo cáo</h2>
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition font-medium">
              📥 Xuất Excel
            </button>
            <button className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition font-medium">
              📥 Xuất CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;