import React from 'react';

const AdminPanel = () => {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-neon-green mb-4">Quản trị</h1>
      <p className="text-gray-400">Chỉ admin mới có quyền truy cập.</p>
    </div>
  );
};

export default AdminPanel;