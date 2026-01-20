import React from 'react';
import { LogOut, Bell } from 'lucide-react';

function Header({ user, onLogout, onManageSchedules, onManageBellSounds }) {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Bell Schedule Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={onManageBellSounds}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2 px-3 py-2 rounded-md hover:bg-blue-50 transition-colors"
            >
              <Bell size={18} /> Add Bell Sound
            </button>
            <button
              onClick={onLogout}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Header;