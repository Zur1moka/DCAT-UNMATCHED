// frontend/src/pages/AdminPanel.jsx
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
  exportUsers,
  exportMatches,
  exportRanking,
  createHero,
  updateHero,
  deleteHero,
  getAllMatches,
  deleteMatch,
  getRewards,
  createReward,
  updateReward,
  deleteReward,
  getPendingQuests,
  approveQuest,
  getOverviewStats,
  getLevelDistribution,
  exportUsersExcel,
  exportMatchesExcel,
  exportRankingExcel,
} from '../services/api';
import { useSocket } from '../hooks/useSocket';
import AdminStats from './AdminStats';

const AdminPanel = () => {
  const { showToast } = useToast();
  const socket = useSocket();

  // ===== STATE =====
  const [activeTab, setActiveTab] = useState('checkin');
  const [users, setUsers] = useState([]);
  const [heroes, setHeroes] = useState([]);
  const [quests, setQuests] = useState([]);
  const [matches, setMatches] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [pendingQuests, setPendingQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ===== Form states =====
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

  // Form quản lý tướng
  const [heroForm, setHeroForm] = useState({
    id: null,
    name: '',
    tier: 'B',
    bonus_multiplier: 100,
  });
  const [editingHero, setEditingHero] = useState(false);

  // Form quản lý phần thưởng
  const [rewardForm, setRewardForm] = useState({
    id: null,
    name: '',
    description: '',
    condition_type: 'xp',
    condition_value: '',
    reward_type: 'ticket',
    reward_value: '',
    image: '',
    is_active: 1,
  });
  const [editingReward, setEditingReward] = useState(false);

  // ===== FETCH DATA =====
  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        usersRes,
        heroesRes,
        questsRes,
        matchesRes,
        rewardsRes,
        pendingRes,
      ] = await Promise.all([
        getAllUsers(),
        getHeroes(),
        getUserQuests(),
        getAllMatches(),
        getRewards(),
        getPendingQuests(),
      ]);
      setUsers(usersRes.data || []);
      setHeroes(heroesRes.data || []);
      setQuests(questsRes.data || []);
      setMatches(matchesRes.data || []);
      setRewards(rewardsRes.data || []);
      setPendingQuests(pendingRes.data || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu admin:', err);
      showToast('Không thể tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===== SOCKET REALTIME =====
  useEffect(() => {
    if (!socket) return;
    socket.on('newMatch', () => fetchData());
    socket.on('matchDeleted', () => fetchData());
    return () => {
      socket.off('newMatch');
      socket.off('matchDeleted');
    };
  }, [socket]);

  // ===== CHECK-IN =====
  const handleCheckIn = async (userId, username) => {
    try {
      const res = await adminCheckIn(userId);
      showToast(`✅ Check-in thành công cho ${username} (+${res.data.xpAwarded}XP)`, 'success');
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || 'Check-in thất bại';
      showToast(msg, 'error');
    }
  };

  // ===== NHẬP TRẬN =====
  const handleSubmitMatch = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createMatch(matchForm);
      const { xpAwarded, honorChange, questsCompleted } = res.data.data || {};
      let msg = `⚔️ Trận đấu đã lưu! XP: +${xpAwarded || 0}`;
      if (honorChange) msg += `, Honor: +${honorChange}`;
      if (questsCompleted && questsCompleted.length > 0) {
        msg += `\n🏆 Nhiệm vụ: ${questsCompleted.join(', ')}`;
      }
      showToast(msg, 'success');
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
      await fetchData();
    } catch (err) {
      const msg = err.response?.data?.error || 'Lỗi lưu trận đấu';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ===== QUẢN LÝ TƯỚNG =====
  const handleHeroSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingHero) {
        await updateHero(heroForm.id, heroForm);
        showToast(`✅ Đã cập nhật tướng ${heroForm.name}`, 'success');
      } else {
        await createHero(heroForm);
        showToast(`✅ Đã thêm tướng ${heroForm.name}`, 'success');
      }
      setHeroForm({ id: null, name: '', tier: 'B', bonus_multiplier: 100 });
      setEditingHero(false);
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi lưu tướng', 'error');
    }
  };

  const handleEditHero = (hero) => {
    setHeroForm({
      id: hero.id,
      name: hero.name,
      tier: hero.tier,
      bonus_multiplier: hero.bonus_multiplier,
    });
    setEditingHero(true);
  };

  const handleDeleteHero = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tướng ${name}?`)) return;
    try {
      await deleteHero(id);
      showToast(`✅ Đã xóa tướng ${name}`, 'success');
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi xóa tướng', 'error');
    }
  };

  // ===== QUẢN LÝ TRẬN =====
  const handleDeleteMatch = async (id) => {
    if (!window.confirm(`Bạn có chắc muốn xóa trận đấu #${id}? Điểm của người chơi sẽ bị hoàn tác.`)) return;
    try {
      await deleteMatch(id);
      showToast(`✅ Đã xóa trận đấu #${id}`, 'success');
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi xóa trận', 'error');
    }
  };

  // ===== QUẢN LÝ PHẦN THƯỞNG =====
  const handleRewardSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReward) {
        await updateReward(rewardForm.id, rewardForm);
        showToast(`✅ Đã cập nhật phần thưởng ${rewardForm.name}`, 'success');
      } else {
        await createReward(rewardForm);
        showToast(`✅ Đã thêm phần thưởng ${rewardForm.name}`, 'success');
      }
      setRewardForm({
        id: null,
        name: '',
        description: '',
        condition_type: 'xp',
        condition_value: '',
        reward_type: 'ticket',
        reward_value: '',
        image: '',
        is_active: 1,
      });
      setEditingReward(false);
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi lưu phần thưởng', 'error');
    }
  };

  const handleEditReward = (reward) => {
    setRewardForm({
      id: reward.id,
      name: reward.name,
      description: reward.description || '',
      condition_type: reward.condition_type || 'xp',
      condition_value: reward.condition_value || '',
      reward_type: reward.reward_type || 'ticket',
      reward_value: reward.reward_value || '',
      image: reward.image || '',
      is_active: reward.is_active !== undefined ? reward.is_active : 1,
    });
    setEditingReward(true);
  };

  const handleDeleteReward = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa phần thưởng ${name}?`)) return;
    try {
      await deleteReward(id);
      showToast(`✅ Đã xóa phần thưởng ${name}`, 'success');
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi xóa phần thưởng', 'error');
    }
  };

  // ===== PHÊ DUYỆT NHIỆM VỤ =====
  const handleApproveQuest = async (userQuestId, status) => {
    try {
      await approveQuest(userQuestId, status);
      showToast(`✅ Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} nhiệm vụ`, 'success');
      await fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi xử lý duyệt nhiệm vụ', 'error');
    }
  };

  // ===== XUẤT BÁO CÁO =====
  const handleExport = async (type, format = 'csv') => {
    try {
      let response;
      let fileName = '';
      const date = new Date().toISOString().split('T')[0];
      if (format === 'excel') {
        switch (type) {
          case 'users':
            response = await exportUsersExcel();
            fileName = `danh_sach_nguoi_choi_${date}.xlsx`;
            break;
          case 'matches':
            response = await exportMatchesExcel();
            fileName = `lich_su_tran_dau_${date}.xlsx`;
            break;
          case 'ranking':
            response = await exportRankingExcel();
            fileName = `bang_xep_hang_${date}.xlsx`;
            break;
          default:
            showToast('Loại báo cáo không hợp lệ', 'error');
            return;
        }
      } else {
        switch (type) {
          case 'users':
            response = await exportUsers();
            fileName = `danh_sach_nguoi_choi_${date}.csv`;
            break;
          case 'matches':
            response = await exportMatches();
            fileName = `lich_su_tran_dau_${date}.csv`;
            break;
          case 'ranking':
            response = await exportRanking();
            fileName = `bang_xep_hang_${date}.csv`;
            break;
          default:
            showToast('Loại báo cáo không hợp lệ', 'error');
            return;
        }
      }
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast(`✅ Đã xuất báo cáo: ${fileName}`, 'success');
    } catch (err) {
      showToast('Lỗi xuất báo cáo: ' + (err.response?.data?.error || err.message), 'error');
    }
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
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-neon-green mb-4 sm:mb-6 flex items-center gap-2 flex-wrap">
        ⚙️ Bảng điều khiển Admin
        <span className="text-sm font-normal text-gray-400 ml-2">
          ({users.length} người chơi)
        </span>
      </h1>

      {/* Tabs - responsive scroll */}
      <div className="flex flex-nowrap md:flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-gray-700 pb-2 overflow-x-auto scrollbar-hide">
        {[
          { key: 'checkin', label: '📌 Check-in' },
          { key: 'match', label: '⚔️ Nhập trận' },
          { key: 'heroes', label: '🛡️ Tướng' },
          { key: 'manage-matches', label: '📋 Trận' },
          { key: 'rewards', label: '🎁 Thưởng' },
          { key: 'approvals', label: '✅ Duyệt' },
          { key: 'quests', label: '📋 Nhiệm vụ' },
          { key: 'stats', label: '📊 Thống kê' },
          { key: 'report', label: '📊 Báo cáo' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all text-xs sm:text-sm font-medium whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-neon-green/20 text-neon-green border border-neon-green/50'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== TAB CHECK-IN ===== */}
      {activeTab === 'checkin' && (
        <div className="bg-card-dark/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-white">📌 Điểm danh người chơi</h2>
            <span className="text-xs sm:text-sm text-gray-400">
              Hôm nay: {new Date().toLocaleDateString('vi-VN')}
            </span>
          </div>
          {users.length === 0 ? (
            <p className="text-gray-500">Chưa có người chơi nào.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between bg-gray-800/50 p-2 sm:p-3 rounded-xl hover:bg-gray-700/50 transition"
                >
                  <div>
                    <div className="font-medium text-white text-sm sm:text-base">{user.username}</div>
                    <div className="text-[10px] sm:text-xs text-gray-400">
                      XP: {user.xp} | Honor: {user.honor_points}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCheckIn(user.id, user.username)}
                    className="px-2 sm:px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs sm:text-sm rounded-lg transition font-medium"
                  >
                    Check-in
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-gray-500">
            * Mỗi người chơi chỉ được check-in 1 lần/ngày, nhận +50XP.
          </div>
        </div>
      )}

      {/* ===== TAB NHẬP TRẬN ===== */}
      {activeTab === 'match' && (
        <div className="bg-card-dark/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">⚔️ Nhập kết quả trận đấu</h2>
          <form onSubmit={handleSubmitMatch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm text-gray-400 mb-1">Người chơi 1</label>
                <select
                  value={matchForm.player1Id}
                  onChange={(e) =>
                    setMatchForm({
                      ...matchForm,
                      player1Id: e.target.value,
                      winnerId:
                        matchForm.winnerId && matchForm.winnerId !== e.target.value ? '' : matchForm.winnerId,
                    })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-gold focus:outline-none text-sm"
                  required
                >
                  <option value="">-- Chọn --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-gray-400 mb-1">Tướng P1</label>
                <select
                  value={matchForm.player1Hero}
                  onChange={(e) => setMatchForm({ ...matchForm, player1Hero: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-gold focus:outline-none text-sm"
                  required
                >
                  <option value="">-- Chọn --</option>
                  {heroes.map((h) => (
                    <option key={h.id} value={h.name}>{h.name} (Tier {h.tier})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-gray-400 mb-1">Người chơi 2</label>
                <select
                  value={matchForm.player2Id}
                  onChange={(e) =>
                    setMatchForm({
                      ...matchForm,
                      player2Id: e.target.value,
                      winnerId:
                        matchForm.winnerId && matchForm.winnerId !== e.target.value ? '' : matchForm.winnerId,
                    })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-gold focus:outline-none text-sm"
                  required
                >
                  <option value="">-- Chọn --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm text-gray-400 mb-1">Tướng P2</label>
                <select
                  value={matchForm.player2Hero}
                  onChange={(e) => setMatchForm({ ...matchForm, player2Hero: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-gold focus:outline-none text-sm"
                  required
                >
                  <option value="">-- Chọn --</option>
                  {heroes.map((h) => (
                    <option key={h.id} value={h.name}>{h.name} (Tier {h.tier})</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm text-gray-400 mb-1">Người thắng</label>
                <select
                  value={matchForm.winnerId}
                  onChange={(e) => setMatchForm({ ...matchForm, winnerId: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:border-gold focus:outline-none text-sm"
                  required
                >
                  <option value="">-- Chọn người thắng --</option>
                  {[matchForm.player1Id, matchForm.player2Id]
                    .filter((id) => id !== '')
                    .map((id) => {
                      const user = users.find((u) => u.id === parseInt(id));
                      return user ? <option key={user.id} value={user.id}>{user.username}</option> : null;
                    })}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 sm:gap-4 pt-2">
              {[
                { key: 'isAdminChallenge', label: 'Khiêu chiến Admin (+20XP)' },
                { key: 'isHandicap', label: 'Kèo chấp Top 4 (+30XP)' },
                { key: 'isBountyChallenge', label: 'Thợ Săn Tiền Thưởng (+100XP & +100ELO)' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-xs sm:text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={matchForm[key]}
                    onChange={(e) => setMatchForm({ ...matchForm, [key]: e.target.checked })}
                    className="w-4 h-4 accent-gold"
                  />
                  {label}
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-4 sm:px-6 py-2 bg-neon-green/80 hover:bg-neon-green text-black font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {submitting ? 'Đang lưu...' : 'Lưu trận đấu'}
            </button>
          </form>
        </div>
      )}

      {/* ===== TAB QUẢN LÝ TƯỚNG ===== */}
      {activeTab === 'heroes' && (
        <div className="bg-card-dark/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">🛡️ Quản lý tướng</h2>

          <form onSubmit={handleHeroSubmit} className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-800/50 rounded-xl">
            <div className="flex-1 min-w-[120px] sm:min-w-[150px]">
              <label className="block text-xs sm:text-sm text-gray-400">Tên tướng</label>
              <input
                type="text"
                value={heroForm.name}
                onChange={(e) => setHeroForm({ ...heroForm, name: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white focus:border-gold focus:outline-none text-sm"
                placeholder="Tên tướng"
                required
              />
            </div>
            <div className="w-24 sm:w-32">
              <label className="block text-xs sm:text-sm text-gray-400">Tier</label>
              <select
                value={heroForm.tier}
                onChange={(e) => setHeroForm({ ...heroForm, tier: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white focus:border-gold focus:outline-none text-sm"
              >
                {['S', 'A', 'B', 'C', 'D'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="w-24 sm:w-32">
              <label className="block text-xs sm:text-sm text-gray-400">Hệ số %</label>
              <select
                value={heroForm.bonus_multiplier}
                onChange={(e) => setHeroForm({ ...heroForm, bonus_multiplier: parseInt(e.target.value) })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white focus:border-gold focus:outline-none text-sm"
              >
                {[70, 100, 140].map((v) => <option key={v} value={v}>{v}%</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" className="px-3 sm:px-4 py-2 bg-gold hover:bg-yellow-500 text-black font-bold rounded-lg transition text-sm sm:text-base">
                {editingHero ? 'Cập nhật' : 'Thêm'}
              </button>
              {editingHero && (
                <button
                  type="button"
                  onClick={() => {
                    setHeroForm({ id: null, name: '', tier: 'B', bonus_multiplier: 100 });
                    setEditingHero(false);
                  }}
                  className="px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition text-sm"
                >
                  Hủy
                </button>
              )}
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="text-left py-2 px-2 sm:px-3">ID</th>
                  <th className="text-left py-2 px-2 sm:px-3">Tên</th>
                  <th className="text-left py-2 px-2 sm:px-3">Tier</th>
                  <th className="text-left py-2 px-2 sm:px-3">Hệ số</th>
                  <th className="text-left py-2 px-2 sm:px-3">Sử dụng</th>
                  <th className="text-left py-2 px-2 sm:px-3">Thắng/Thua</th>
                  <th className="text-left py-2 px-2 sm:px-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {heroes.map((hero) => (
                  <tr key={hero.id} className="hover:bg-gray-800/30 transition">
                    <td className="py-2 px-2 sm:px-3 text-gray-400">{hero.id}</td>
                    <td className="py-2 px-2 sm:px-3 font-medium text-white">{hero.name}</td>
                    <td className="py-2 px-2 sm:px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        hero.tier === 'S' ? 'bg-purple-900/60 text-purple-300' :
                        hero.tier === 'A' ? 'bg-red-900/60 text-red-300' :
                        hero.tier === 'B' ? 'bg-blue-900/60 text-blue-300' :
                        hero.tier === 'C' ? 'bg-green-900/60 text-green-300' :
                        'bg-gray-700/60 text-gray-300'
                      }`}>
                        {hero.tier}
                      </span>
                    </td>
                    <td className="py-2 px-2 sm:px-3 text-gold">{hero.bonus_multiplier}%</td>
                    <td className="py-2 px-2 sm:px-3">{hero.usage_count || 0}</td>
                    <td className="py-2 px-2 sm:px-3">
                      <span className="text-green-400">{hero.wins || 0}</span>
                      <span className="text-gray-500">/</span>
                      <span className="text-red-400">{hero.losses || 0}</span>
                    </td>
                    <td className="py-2 px-2 sm:px-3">
                      <button onClick={() => handleEditHero(hero)} className="text-blue-400 hover:text-blue-300 mr-1 sm:mr-2 text-xs sm:text-sm">✏️</button>
                      <button onClick={() => handleDeleteHero(hero.id, hero.name)} className="text-red-400 hover:text-red-300 text-xs sm:text-sm">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== TAB QUẢN LÝ TRẬN ===== */}
      {activeTab === 'manage-matches' && (
        <div className="bg-card-dark/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-white">📋 Quản lý trận đấu</h2>
            <button onClick={fetchData} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs sm:text-sm rounded-lg transition">🔄 Làm mới</button>
          </div>
          {matches.length === 0 ? (
            <p className="text-gray-500">Chưa có trận đấu nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="text-left py-2 px-2 sm:px-3">ID</th>
                    <th className="text-left py-2 px-2 sm:px-3">P1</th>
                    <th className="text-left py-2 px-2 sm:px-3">Tướng P1</th>
                    <th className="text-left py-2 px-2 sm:px-3">P2</th>
                    <th className="text-left py-2 px-2 sm:px-3">Tướng P2</th>
                    <th className="text-left py-2 px-2 sm:px-3">Winner</th>
                    <th className="text-left py-2 px-2 sm:px-3">XP</th>
                    <th className="text-left py-2 px-2 sm:px-3">Thời gian</th>
                    <th className="text-left py-2 px-2 sm:px-3">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {matches.map((match) => (
                    <tr key={match.id} className="hover:bg-gray-800/30 transition">
                      <td className="py-2 px-2 sm:px-3 text-gray-400">#{match.id}</td>
                      <td className="py-2 px-2 sm:px-3 font-medium text-white">{match.player1_name}</td>
                      <td className="py-2 px-2 sm:px-3">{match.player1_hero}</td>
                      <td className="py-2 px-2 sm:px-3 font-medium text-white">{match.player2_name}</td>
                      <td className="py-2 px-2 sm:px-3">{match.player2_hero}</td>
                      <td className="py-2 px-2 sm:px-3 text-gold font-bold">{match.winner_name}</td>
                      <td className="py-2 px-2 sm:px-3 text-neon-green font-bold">+{match.xp_awarded}</td>
                      <td className="py-2 px-2 sm:px-3 text-[10px] sm:text-xs text-gray-400">
                        {new Date(match.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 px-2 sm:px-3">
                        <button onClick={() => handleDeleteMatch(match.id)} className="text-red-400 hover:text-red-300 text-sm">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB QUẢN LÝ PHẦN THƯỞNG ===== */}
      {activeTab === 'rewards' && (
        <div className="bg-card-dark/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">🎁 Quản lý phần thưởng</h2>

          <form onSubmit={handleRewardSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-800/50 rounded-xl">
            <div>
              <label className="block text-xs sm:text-sm text-gray-400">Tên</label>
              <input type="text" value={rewardForm.name} onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white focus:border-gold focus:outline-none text-sm" placeholder="VD: Vé Gacha" required />
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-gray-400">Mô tả</label>
              <input type="text" value={rewardForm.description} onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white focus:border-gold focus:outline-none text-sm" placeholder="Mô tả" />
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-gray-400">Điều kiện</label>
              <select value={rewardForm.condition_type} onChange={(e) => setRewardForm({ ...rewardForm, condition_type: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white focus:border-gold focus:outline-none text-sm">
                <option value="xp">XP</option>
                <option value="level">Cấp</option>
                <option value="quest">Nhiệm vụ</option>
                <option value="rank">Xếp hạng</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-gray-400">Giá trị điều kiện</label>
              <input type="text" value={rewardForm.condition_value} onChange={(e) => setRewardForm({ ...rewardForm, condition_value: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white focus:border-gold focus:outline-none text-sm" placeholder="VD: 5000, top3" />
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-gray-400">Loại thưởng</label>
              <select value={rewardForm.reward_type} onChange={(e) => setRewardForm({ ...rewardForm, reward_type: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white focus:border-gold focus:outline-none text-sm">
                <option value="ticket">Vé Gacha</option>
                <option value="gift">Quà tặng</option>
                <option value="discount">Giảm giá</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm text-gray-400">Giá trị thưởng</label>
              <input type="text" value={rewardForm.reward_value} onChange={(e) => setRewardForm({ ...rewardForm, reward_value: e.target.value })} className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white focus:border-gold focus:outline-none text-sm" placeholder="VD: 5, 10%" required />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex items-end gap-2 flex-wrap">
              <button type="submit" className="px-4 py-2 bg-gold hover:bg-yellow-500 text-black font-bold rounded-lg transition text-sm sm:text-base">
                {editingReward ? 'Cập nhật' : 'Thêm'}
              </button>
              {editingReward && (
                <button type="button" onClick={() => { setRewardForm({ id: null, name: '', description: '', condition_type: 'xp', condition_value: '', reward_type: 'ticket', reward_value: '', image: '', is_active: 1 }); setEditingReward(false); }} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition text-sm">Hủy</button>
              )}
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="text-left py-2 px-2 sm:px-3">ID</th>
                  <th className="text-left py-2 px-2 sm:px-3">Tên</th>
                  <th className="text-left py-2 px-2 sm:px-3">Điều kiện</th>
                  <th className="text-left py-2 px-2 sm:px-3">Loại thưởng</th>
                  <th className="text-left py-2 px-2 sm:px-3">Giá trị</th>
                  <th className="text-left py-2 px-2 sm:px-3">Trạng thái</th>
                  <th className="text-left py-2 px-2 sm:px-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {rewards.map((reward) => (
                  <tr key={reward.id} className="hover:bg-gray-800/30 transition">
                    <td className="py-2 px-2 sm:px-3 text-gray-400">{reward.id}</td>
                    <td className="py-2 px-2 sm:px-3 font-medium text-white">{reward.name}</td>
                    <td className="py-2 px-2 sm:px-3 text-gray-300">{reward.condition_type}: {reward.condition_value || 'N/A'}</td>
                    <td className="py-2 px-2 sm:px-3">{reward.reward_type}</td>
                    <td className="py-2 px-2 sm:px-3 text-gold">{reward.reward_value}</td>
                    <td className="py-2 px-2 sm:px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${reward.is_active ? 'bg-green-900/40 text-green-400' : 'bg-gray-600/40 text-gray-400'}`}>
                        {reward.is_active ? '✅ Hoạt động' : '⛔ Tạm dừng'}
                      </span>
                    </td>
                    <td className="py-2 px-2 sm:px-3">
                      <button onClick={() => handleEditReward(reward)} className="text-blue-400 hover:text-blue-300 mr-1 sm:mr-2 text-xs sm:text-sm">✏️</button>
                      <button onClick={() => handleDeleteReward(reward.id, reward.name)} className="text-red-400 hover:text-red-300 text-xs sm:text-sm">🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== TAB PHÊ DUYỆT NHIỆM VỤ ===== */}
      {activeTab === 'approvals' && (
        <div className="bg-card-dark/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-white">✅ Phê duyệt nhiệm vụ</h2>
            <button onClick={fetchData} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs sm:text-sm rounded-lg transition">🔄 Làm mới</button>
          </div>
          {pendingQuests.length === 0 ? (
            <p className="text-gray-500">Không có nhiệm vụ nào cần phê duyệt.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="text-left py-2 px-2 sm:px-3">#</th>
                    <th className="text-left py-2 px-2 sm:px-3">Người chơi</th>
                    <th className="text-left py-2 px-2 sm:px-3">Nhiệm vụ</th>
                    <th className="text-left py-2 px-2 sm:px-3">Thưởng</th>
                    <th className="text-left py-2 px-2 sm:px-3">Thời gian</th>
                    <th className="text-left py-2 px-2 sm:px-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {pendingQuests.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-800/30 transition">
                      <td className="py-2 px-2 sm:px-3 text-gray-400">{index + 1}</td>
                      <td className="py-2 px-2 sm:px-3 font-medium text-white">{item.user_name}</td>
                      <td className="py-2 px-2 sm:px-3">{item.quest_name}</td>
                      <td className="py-2 px-2 sm:px-3">
                        <span className="text-gold">+{item.reward_xp}XP</span>
                        {item.reward_honor > 0 && <span className="text-neon-green ml-1 sm:ml-2">+{item.reward_honor}ELO</span>}
                      </td>
                      <td className="py-2 px-2 sm:px-3 text-[10px] sm:text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 px-2 sm:px-3">
                        <button onClick={() => handleApproveQuest(item.user_quest_id, 'approved')} className="px-2 sm:px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg transition mr-1">✅</button>
                        <button onClick={() => handleApproveQuest(item.user_quest_id, 'rejected')} className="px-2 sm:px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg transition">❌</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB NHIỆM VỤ ===== */}
      {activeTab === 'quests' && (
        <div className="bg-card-dark/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">📋 Nhiệm vụ & Thử thách</h2>
          {quests.length === 0 ? (
            <p className="text-gray-500">Chưa có nhiệm vụ nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="text-left py-2 px-2 sm:px-3">Nhiệm vụ</th>
                    <th className="text-left py-2 px-2 sm:px-3">Mô tả</th>
                    <th className="text-left py-2 px-2 sm:px-3">Thưởng</th>
                    <th className="text-left py-2 px-2 sm:px-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {quests.map((quest) => (
                    <tr key={quest.id} className="hover:bg-gray-800/30 transition">
                      <td className="py-2 px-2 sm:px-3 font-medium text-white">{quest.name}</td>
                      <td className="py-2 px-2 sm:px-3 text-gray-400">{quest.description}</td>
                      <td className="py-2 px-2 sm:px-3">
                        <span className="text-gold">+{quest.reward_xp}XP</span>
                        {quest.reward_honor > 0 && <span className="text-neon-green ml-1 sm:ml-2">+{quest.reward_honor}ELO</span>}
                      </td>
                      <td className="py-2 px-2 sm:px-3">
                        {quest.completed ? (
                          <span className="bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold">✅ Hoàn thành</span>
                        ) : (
                          <span className="bg-yellow-900/40 text-yellow-400 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold">⏳ Chưa</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-gray-500">
            * Nhiệm vụ được tự động kích hoạt sau mỗi trận đấu hoặc check-in.
          </div>
        </div>
      )}

      {/* ===== TAB THỐNG KÊ ===== */}
      {activeTab === 'stats' && <AdminStats />}

      {/* ===== TAB BÁO CÁO ===== */}
      {activeTab === 'report' && (
        <div className="bg-card-dark/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">📊 Xuất báo cáo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[
              { key: 'users', label: '📋 Người chơi', desc: 'Danh sách người chơi, điểm số, cấp độ' },
              { key: 'matches', label: '⚔️ Trận đấu', desc: 'Lịch sử tất cả trận đấu' },
              { key: 'ranking', label: '🏆 Xếp hạng', desc: 'Bảng xếp hạng EXP và Honor' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="bg-gray-800/50 p-3 sm:p-4 rounded-xl border border-gray-700">
                <h3 className="font-medium text-white text-sm sm:text-base">{label}</h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">{desc}</p>
                <div className="flex gap-2 mt-2 sm:mt-3 flex-wrap">
                  <button onClick={() => handleExport(key, 'csv')} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm rounded-lg transition">📥 CSV</button>
                  <button onClick={() => handleExport(key, 'excel')} className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs sm:text-sm rounded-lg transition">📥 Excel</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;