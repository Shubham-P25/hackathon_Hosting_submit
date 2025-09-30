import { useState, useEffect } from 'react';
import { getAdminStats } from '../../api';
import { Skeleton } from '../../ui/Skeleton';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    getAdminStats().then(setStats);
  }, []);

  if (!stats) return <div className="max-w-7xl mx-auto py-8 px-4"><Skeleton height="h-64" /></div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Navigation */}
        <nav className="flex space-x-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-2 ${activeTab === 'overview' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 px-2 ${activeTab === 'users' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('hackathons')}
            className={`pb-4 px-2 ${activeTab === 'hackathons' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Hackathons
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={`pb-4 px-2 ${activeTab === 'disputes' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Disputes
          </button>
        </nav>

        {/* Content */}
        {activeTab === 'overview' && <AdminOverview stats={stats} />}
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'hackathons' && <AdminHackathons />}
        {activeTab === 'disputes' && <AdminDisputes />}
      </div>
    </div>
  );
}
