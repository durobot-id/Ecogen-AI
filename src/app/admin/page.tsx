'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import OfflineBanner from '@/components/common/OfflineBanner';
import DashboardOverview from '@/components/admin/DashboardOverview';
import StudentsManagement from '@/components/admin/StudentsManagement';
import PointsManagement from '@/components/admin/PointsManagement';
import TransactionsHistory from '@/components/admin/TransactionsHistory';
import AiStrategy from '@/components/admin/AiStrategy';
import SettingsView from '@/components/admin/SettingsView';
import {
  LayoutDashboard,
  Users,
  Coins,
  History,
  Sparkles,
  Settings,
} from 'lucide-react';
import { Student, Transaction, DashboardStats } from '@/types';

type AdminTab = 'dashboard' | 'students' | 'points' | 'transactions' | 'ai' | 'settings';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudentForTopUp, setSelectedStudentForTopUp] = useState<Student | null>(null);

  // Load all dashboard data
  const loadData = useCallback(async () => {
    try {
      const [statsRes, studentsRes, txRes] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/students'),
        fetch('/api/transactions?limit=100'),
      ]);

      if (statsRes.status === 401 || statsRes.status === 403) {
        router.push('/');
        return;
      }

      const statsData = await statsRes.json();
      const studentsData = await studentsRes.json();
      const txData = await txRes.json();

      if (statsData.success) setStats(statsData.data);
      if (studentsData.success) setStudents(studentsData.data);
      if (txData.success) setTransactions(txData.data);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Data Siswa', icon: Users },
    { id: 'points', label: 'Kelola Poin', icon: Coins },
    { id: 'transactions', label: 'Riwayat Transaksi', icon: History },
    { id: 'ai', label: 'Strategi AI', icon: Sparkles },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  const handleOpenTopUp = (student: Student) => {
    setSelectedStudentForTopUp(student);
    setActiveTab('points');
  };

  const handleOpenTopUpWithPreset = (preset: { amount: number; reason: string }) => {
    setActiveTab('points');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FBF7]">
      <OfflineBanner />
      <Header role="admin" subtitle="Pusat Pengelolaan EcoPoint" />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:block w-60 shrink-0">
          <nav className="bg-white rounded-2xl p-3 border border-[#E5EEE7] shadow-xs sticky top-24 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                    isActive
                      ? 'bg-[#E8F9EE] text-[#159447] font-bold border border-[#35C96F]/30 shadow-xs'
                      : 'text-[#74857B] hover:text-[#18352A] hover:bg-[#F7FBF7]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#159447]' : 'text-[#74857B]'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation Tabs (horizontal scrolling) */}
        <div className="md:hidden overflow-x-auto pb-2 -mx-4 px-4 flex gap-1.5 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as AdminTab)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border shrink-0 transition-all ${
                  isActive
                    ? 'bg-[#35C96F] text-white border-[#35C96F] shadow-xs'
                    : 'bg-white text-[#74857B] border-[#E5EEE7]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              stats={stats}
              loading={loading}
              onNavigateTab={(tab) => setActiveTab(tab as AdminTab)}
              onSelectStudentTopUp={handleOpenTopUp}
            />
          )}

          {activeTab === 'students' && (
            <StudentsManagement
              students={students}
              loading={loading}
              onRefresh={loadData}
              onOpenTopUp={handleOpenTopUp}
            />
          )}

          {activeTab === 'points' && (
            <PointsManagement
              students={students}
              initialStudent={selectedStudentForTopUp}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsHistory
              transactions={transactions}
              loading={loading}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'ai' && (
            <AiStrategy
              students={students}
              onOpenTopUpWithPreset={handleOpenTopUpWithPreset}
            />
          )}

          {activeTab === 'settings' && <SettingsView students={students} />}
        </main>
      </div>
    </div>
  );
}
