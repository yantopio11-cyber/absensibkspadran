import React from 'react';
import { TabType } from '../types';
import { Users, ClipboardCheck, CalendarRange, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  totalClasses: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  totalClasses,
}) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'kelola_kelas',
      label: 'KELOLA KELAS',
      icon: <Users className="w-5 h-5" />,
      badge: totalClasses > 0 ? `${totalClasses}` : undefined,
    },
    {
      id: 'input_absensi',
      label: 'INPUT ABSENSI',
      icon: <ClipboardCheck className="w-5 h-5" />,
    },
    {
      id: 'rekap_absensi',
      label: 'REKAP ABSENSI',
      icon: <CalendarRange className="w-5 h-5" />,
    },
    {
      id: 'pengaturan',
      label: 'PENGATURAN',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <div id="bottom-nav-section" className="mt-12 pt-6 pb-8 border border-pink-200/60 bg-white/95 backdrop-blur-md rounded-2xl shadow-sm px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Navigasi Cepat Menu Absensi
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-bottom-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                }`}
              >
                <div className="relative">
                  {tab.icon}
                  {tab.badge && (
                    <span
                      className={`absolute -top-1.5 -right-2 text-[9px] px-1 py-0.2 rounded-full font-bold ${
                        isActive ? 'bg-emerald-800 text-white' : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
