// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { getProfile, getMatchHistory, getUserQuests, checkIn } from '../services/api';
import { useToast } from '../components/ui/ToastContext';
import ProgressBar from '../components/ui/ProgressBar';

const Dashboard = () => {
  const { showToast } = useToast();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const profileRes = await getProfile();
      setUser(profileRes.data);
      const historyRes = await getMatchHistory(profileRes.data.id);
      setHistory(historyRes.data || []);
    } catch (err) {
      console.error('Lỗi lấy user data:', err);
    }
  };

  const fetchQuests = async () => {
    try {
      const res = await getUserQuests();
      setQuests(res.data || []);
    } catch (err) {
      console.error('Lỗi lấy quests:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchUserData();
      await fetchQuests();
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleCheckIn = async () => {
    try {
      const res = await checkIn();
      showToast(res.data.message, 'success');
      await fetchUserData();
      await fetchQuests();
    } catch (err) {
      showToast(err.response?.data?.error || 'Check-in thất bại', 'error');
    }
  };

  if (loading) return <div className="p-6 text-gray-400 text-center">Đang tải...</div>;
  if (!user) return <div className="p-6 text-gray-400 text-center">Vui lòng đăng nhập</div>;

  const isMaxLevel = user.level >= 10;
  const winrate = user.wins + user.losses > 0 ? Math.round((user.wins / (user.wins + user.losses)) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6 space-y-6">
      {/* User Card */}
      <div className="bg-card-dark/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 sm:p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center text-2xl sm:text-3xl font-black text-black shadow-lg shadow-gold/20 flex-shrink-0">
            {user.username?.charAt(0).toUpperCase() || 'U'}
          </div>

          <div className="flex-1 w-full">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{user.username}</h1>
              <span className="bg-blue-600/80 backdrop-blur px-2 sm:px-3 py-0.5 rounded-full text-xs sm:text-sm font-bold border border-blue-400/30">
                Level {user.level}
              </span>
              <span className="bg-green-600/80 backdrop-blur px-2 sm:px-3 py-0.5 rounded-full text-xs sm:text-sm border border-green-400/30">
                Winrate {winrate}%
              </span>
            </div>

            <div className="flex flex-wrap gap-4 sm:gap-6 mt-2 text-xs sm:text-sm">
              <div><span className="text-gray-400">Thắng:</span> <span className="text-green-400 font-bold">{user.wins}</span></div>
              <div><span className="text-gray-400">Thua:</span> <span className="text-red-400 font-bold">{user.losses}</span></div>
              <div><span className="text-gray-400">🏅 Honor:</span> <span className="text-neon-green font-bold">{user.honor_points}</span></div>
            </div>
          </div>

          {isMaxLevel && (
            <div className="bg-purple-900/30 border border-purple-500/50 rounded-xl px-3 py-1 sm:px-4 sm:py-2 text-center w-full sm:w-auto">
              <p className="text-xs text-gray-300">🎟️ Vé Gacha</p>
              <p className="text-xl sm:text-2xl font-bold text-gold">{user.overcap_tickets || 0}</p>
            </div>
          )}
        </div>

        {/* XP Bar */}
        <div className="mt-4 sm:mt-6">
          {!isMaxLevel ? (
            <ProgressBar
              current={user.xp}
              max={user.nextXp || 8500}
              label={`Tiến trình Level ${user.level} → ${user.level + 1}`}
            />
          ) : (
            <ProgressBar
              current={user.xp}
              max={user.xp + 200}
              label="🏆 Cấp Vô Tận (Overcap)"
              isOvercap
            />
          )}
        </div>

        {/* Quests Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6">
          {quests.map((quest) => (
            <div
              key={quest.id}
              className={`bg-gray-800/50 rounded-xl p-2 sm:p-3 text-center transition-all ${
                quest.completed
                  ? 'opacity-50 cursor-default'
                  : 'hover:scale-105 cursor-pointer border border-green-500/30'
              }`}
              onClick={quest.name === 'Điểm danh hàng ngày' && !quest.completed ? handleCheckIn : undefined}
            >
              <p className="text-[10px] sm:text-xs text-gray-400 line-clamp-1">{quest.name}</p>
              <p className="font-bold text-xs sm:text-sm">
                {quest.completed ? '✅ Đã hoàn thành' : `+${quest.reward_xp}XP`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* History (mobile: card view) */}
      <div className="bg-card-dark/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">🕒 Hoạt động gần đây</h2>
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-400 border-b border-gray-700">
              <tr>
                <th className="text-left py-3 px-2">Thời gian</th>
                <th className="text-left px-2">Tướng</th>
                <th className="text-left px-2">Đối thủ</th>
                <th className="text-left px-2">Kết quả</th>
                <th className="text-right px-2 text-gold">XP</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center text-gray-500">Chưa có trận đấu nào</td></tr>
              ) : (
                history.slice(0, 4).map((item) => {
                  const isWin = item.winner_id === user.id;
                  const myHero = item.player1_id === user.id ? item.player1_hero : item.player2_hero;
                  const opponentName = item.player1_id === user.id ? item.player2_name : item.player1_name;
                  return (
                    <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                      <td className="py-3 px-2 text-gray-400 text-xs">{new Date(item.created_at).toLocaleString()}</td>
                      <td className="px-2 font-semibold">{myHero}</td>
                      <td className="px-2 text-gray-300">{opponentName}</td>
                      <td className="px-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isWin ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                          {isWin ? 'Thắng' : 'Thua'}
                        </span>
                      </td>
                      <td className="text-right px-2 text-gold font-bold">+{item.xp_awarded}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="sm:hidden space-y-3">
          {history.length === 0 ? (
            <p className="text-gray-500 text-center">Chưa có trận đấu nào</p>
          ) : (
            history.slice(0, 4).map((item) => {
              const isWin = item.winner_id === user.id;
              const myHero = item.player1_id === user.id ? item.player1_hero : item.player2_hero;
              const opponentName = item.player1_id === user.id ? item.player2_name : item.player1_name;
              return (
                <div key={item.id} className="bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-white">{myHero}</p>
                      <p className="text-xs text-gray-400">vs {opponentName}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isWin ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                      {isWin ? 'Thắng' : 'Thua'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                    <span className="text-gold font-bold">+{item.xp_awarded} XP</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>  
    </div>
  );
};

export default Dashboard;