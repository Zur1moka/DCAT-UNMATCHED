// src/pages/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import { useToast } from '../components/ui/ToastContext';
import {
  getAllUsers,
  getHeroes,
  createMatch,
  getUserQuests,
  adminCheckIn,
  getExpRanking,
  getHonorRanking,
} from '../service/api';

const AdminPanel = () => {
  const { showToast } = useToast();

  // ===== STATE =====
  const [activeTab, setActiveTab] = useState('checkin');
  const [users, setUsers] = useState([]);
  const [heroes, setHeroes] = useState([]);
  const [quests, setQuests] = useState([]);
  const [expRanking, setExpRanking] = useState([]);
  const [honorRanking, setHonorRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form nhập trận
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

  // ===== FETCH DATA =====
  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, heroesRes, questsRes, expRes, honorRes] = await Promise.all([
        getAllUsers(),
        getHeroes(),
        getUserQuests(),
        getExpRanking(),
        getHonorRanking(),
      ]);
      setUsers(usersRes.data || []);
      setHeroes(heroesRes.data || []);
      setQuests(questsRes.data || []);
      setExpRanking(expRes.data || []);
      setHonorRanking(honorRes.data || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu admin:', err);
      showToast('Không thể tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== HANDLE CHECK-IN =====
  const handleCheckIn = async (userId, username) => {
    try {
      const res = await adminCheckIn(userId);
      showToast(`✅ Check-in thành công cho ${username} (+${res.data.xpAwarded}XP)`, 'success');
      // Refresh danh sách user và quests
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || 'Check-in thất bại';
      showToast(msg, 'error');
    }
  };

  // ===== HANDLE SUBMIT MATCH =====
  const handleSubmitMatch = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createMatch(matchForm);
      const { xpAwarded, honorChange, questsCompleted } = res.data.data || {};
      let msg = `⚔️ Trận đấu đã lưu! XP: +${xpAwarded || 0}`;
      if (honorChange) msg += `, Honor: +${honorChange}`;
      if (questsCompleted && questsCompleted.length > 0) {
        msg += `\n🏆 Nhiệm vụ hoàn thành: ${questsCompleted.join(', ')}`;
      }
      showToast(msg, 'success');
      // Reset form
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
      // Refresh dữ liệu
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || 'Lỗi lưu trận đấu';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ===== HANDLE EXPORT REPORT =====
  const handleExport = (format) => {
    // TODO: Gọi API export (sẽ phát triển sau)
    showToast(`📊 Đang xuất báo cáo ${format.toUpperCase()}... (chức năng đang phát triển)`, 'info');
  };

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 text-lg">Đang tải dữ liệu...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold text-neon-green mb-6 flex items-center gap-2">
        ⚙️ Bảng điều khiển Admin
        <span className="text-sm font-normal text-gray-400 ml-2">
          ({users.length} người chơi)
        </span>
      </h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-700 pb-2">
        {[
          { key: 'checkin', label: '📌 Check-in' },
          { key: 'match', label: '⚔️ Nhập trận' },
          { key: 'quests', label: '📋 Nhiệm vụ' },
          { key: 'report', label: '📊 Báo cáo' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              activeTab === tab.key
                ? 'bg-neon-green/20 text-neon-green border border-neon-green/50'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* =============================== */}
      {/* TAB 1: CHECK-IN */}
      {/* =============================== */}
      {activeTab === 'checkin' && (
        <div className="bg-card-dark/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">📌 Điểm danh người chơi</h2>
            <span className="text-sm text-gray-400">
              Hôm nay: {new Date().toLocaleDateString('vi-VN')}
            </span>
          </div>
          {users.length === 0 ? (
            <p className="text-gray-500">Chưa có người chơi nào.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between bg-gray-800/50 p-3 rounded-xl hover:bg-gray-700/50 transition"
                >
                  <div>
                    <div className="font-medium text-white">{user.username}</div>
                    <div className="text-xs text-gray-400">
                      XP: {user.xp} | Honor: {user.honor_points}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCheckIn(user.id, user.username)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition font-medium"
                  >
                    Check-in
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 text-xs text-gray-500">
            * Mỗi người chơi chỉ được check-in 1 lần/ngày, nhận +50XP.
          </div>
        </div>
      )}

      {/* =============================== */}
      {/* TAB 2: NHẬP TRẬN */}
      {/* =============================== */}
      {activeTab === 'match' && (
        <div className="bg-card-dark/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">⚔️ Nhập kết quả trận đấu</h2>
          <form onSubmit={handleSubmitMatch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Người chơi 1 */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Người chơi 1</label>
                <select
                  value={matchForm.player1Id}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMatchForm((prev) => ({
                      ...prev,
                      player1Id: val,
                      // Nếu winnerId đang là giá trị cũ không hợp lệ, reset
                      winnerId: prev.winnerId && prev.winnerId !== val ? '' : prev.winnerId,
                    }));
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-gold focus:outline-none"
                  required
                >
                  <option value="">-- Chọn --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username}
                    </option>
                  ))}
                </select>
              </div>
              {/* Tướng P1 */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tướng P1</label>
                <select
                  value={matchForm.player1Hero}
                  onChange={(e) => setMatchForm({ ...matchForm, player1Hero: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-gold focus:outline-none"
                  required
                >
                  <option value="">-- Chọn --</option>
                  {heroes.map((h) => (
                    <option key={h.id} value={h.name}>
                      {h.name} (Tier {h.tier})
                    </option>
                  ))}
                </select>
              </div>
              {/* Người chơi 2 */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Người chơi 2</label>
                <select
                  value={matchForm.player2Id}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMatchForm((prev) => ({
                      ...prev,
                      player2Id: val,
                      winnerId: prev.winnerId && prev.winnerId !== val ? '' : prev.winnerId,
                    }));
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-gold focus:outline-none"
                  required
                >
                  <option value="">-- Chọn --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username}
                    </option>
                  ))}
                </select>
              </div>
              {/* Tướng P2 */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tướng P2</label>
                <select
                  value={matchForm.player2Hero}
                  onChange={(e) => setMatchForm({ ...matchForm, player2Hero: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-gold focus:outline-none"
                  required
                >
                  <option value="">-- Chọn --</option>
                  {heroes.map((h) => (
                    <option key={h.id} value={h.name}>
                      {h.name} (Tier {h.tier})
                    </option>
                  ))}
                </select>
              </div>
              {/* Người thắng */}
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Người thắng</label>
                <select
                  value={matchForm.winnerId}
                  onChange={(e) => setMatchForm({ ...matchForm, winnerId: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-gold focus:outline-none"
                  required
                >
                  <option value="">-- Chọn người thắng --</option>
                  {[matchForm.player1Id, matchForm.player2Id]
                    .filter((id) => id !== '')
                    .map((id) => {
                      const user = users.find((u) => u.id === parseInt(id));
                      return user ? (
                        <option key={user.id} value={user.id}>
                          {user.username}
                        </option>
                      ) : null;
                    })}
                </select>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={matchForm.isAdminChallenge}
                  onChange={(e) =>
                    setMatchForm({ ...matchForm, isAdminChallenge: e.target.checked })
                  }
                  className="w-4 h-4 accent-gold"
                />
                Khiêu chiến Admin (+20XP)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={matchForm.isHandicap}
                  onChange={(e) =>
                    setMatchForm({ ...matchForm, isHandicap: e.target.checked })
                  }
                  className="w-4 h-4 accent-gold"
                />
                Kèo chấp Top 4 (+30XP)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={matchForm.isBountyChallenge}
                  onChange={(e) =>
                    setMatchForm({ ...matchForm, isBountyChallenge: e.target.checked })
                  }
                  className="w-4 h-4 accent-gold"
                />
                Thợ Săn Tiền Thưởng (+100XP & +100ELO)
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-neon-green/80 hover:bg-neon-green text-black font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Đang lưu...' : 'Lưu trận đấu'}
            </button>
          </form>
        </div>
      )}

      {/* =============================== */}
      {/* TAB 3: NHIỆM VỤ */}
      {/* =============================== */}
      {activeTab === 'quests' && (
        <div className="bg-card-dark/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">📋 Nhiệm vụ & Thử thách</h2>
          {quests.length === 0 ? (
            <p className="text-gray-500">Chưa có nhiệm vụ nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="text-left py-2 px-3">Nhiệm vụ</th>
                    <th className="text-left py-2 px-3">Mô tả</th>
                    <th className="text-left py-2 px-3">Thưởng</th>
                    <th className="text-left py-2 px-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {quests.map((quest) => (
                    <tr key={quest.id} className="hover:bg-gray-800/30 transition">
                      <td className="py-3 px-3 font-medium text-white">{quest.name}</td>
                      <td className="py-3 px-3 text-gray-400">{quest.description}</td>
                      <td className="py-3 px-3">
                        <span className="text-gold">+{quest.reward_xp}XP</span>
                        {quest.reward_honor > 0 && (
                          <span className="text-neon-green ml-2">+{quest.reward_honor}ELO</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {quest.completed ? (
                          <span className="bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full text-xs font-bold">
                            ✅ Hoàn thành
                          </span>
                        ) : (
                          <span className="bg-yellow-900/40 text-yellow-400 px-2 py-0.5 rounded-full text-xs font-bold">
                            ⏳ Chưa hoàn thành
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 text-xs text-gray-500">
            * Nhiệm vụ được tự động kích hoạt và cập nhật sau mỗi trận đấu hoặc check-in.
          </div>
        </div>
      )}

      {/* =============================== */}
      {/* TAB 4: BÁO CÁO */}
      {/* =============================== */}
      {activeTab === 'report' && (
        <div className="bg-card-dark/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">📊 Xuất báo cáo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
              <h3 className="font-medium text-white">Báo cáo tổng hợp</h3>
              <p className="text-sm text-gray-400 mt-1">Xuất danh sách người chơi, điểm số, cấp độ</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleExport('excel')}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition"
                >
                  Excel
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="px-4 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg transition"
                >
                  CSV
                </button>
              </div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
              <h3 className="font-medium text-white">Báo cáo trận đấu</h3>
              <p className="text-sm text-gray-400 mt-1">Lịch sử tất cả trận đấu</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleExport('excel')}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition"
                >
                  Excel
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="px-4 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg transition"
                >
                  CSV
                </button>
              </div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
              <h3 className="font-medium text-white">Báo cáo nhiệm vụ</h3>
              <p className="text-sm text-gray-400 mt-1">Thống kê hoàn thành nhiệm vụ</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleExport('excel')}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition"
                >
                  Excel
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="px-4 py-1.5 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg transition"
                >
                  CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;