import React, { useState, useEffect } from 'react';
import { TabType, SchoolSettings } from '../types';
import { Users, ClipboardCheck, CalendarRange, Settings, School, Clock } from 'lucide-react';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  settings: SchoolSettings;
  totalStudents: number;
  totalClasses: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  settings,
  totalStudents,
  totalClasses,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [isFriday, setIsFriday] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      setDateStr(now.toLocaleDateString('id-ID', options));
      setTimeStr(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setIsFriday(now.getDay() === 5);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navTabs: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'kelola_kelas',
      label: 'KELOLA KELAS',
      icon: <Users className="w-5 h-5" />,
      badge: totalClasses > 0 ? `${totalClasses} Kelas` : undefined,
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
    <header className="bg-white/95 backdrop-blur-md border-b border-pink-200/50 shadow-sm sticky top-0 z-40">
      {/* Top Notification Bar */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2 font-medium">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-900/60 text-emerald-100 border border-emerald-500/30">
              PRESENSI TERPADU
            </span>
            <span>Jadwal Khusus: <strong>Jumat Libur</strong>, Hari <strong>Minggu Tetap Masuk</strong></span>
          </div>
          <div className="flex items-center space-x-3 text-emerald-100 font-mono text-[11px]">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-300" />
              {dateStr} • {timeStr} WIB
            </span>
            {isFriday && (
              <span className="bg-red-500/80 text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                Hari Ini Libur (Jumat)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & School Title */}
          <div className="flex items-center space-x-3.5">
            <div className="relative flex-shrink-0">
              <img
                src={settings.logoUrl || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTdk0rwBQ0CT1iB_DMloASVewLVxoGtd9abvg&s'}
                alt="Logo SMP Negeri 2 Paciran"
                className="w-12 h-12 md:w-14 md:h-14 object-contain rounded-xl bg-slate-50 p-1 border border-slate-200 shadow-sm"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  APLIKASI RESMI
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  {totalStudents} Siswa Terdaftar
                </span>
              </div>
              <h1 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                ABSENSI DIGITAL {settings.schoolName || 'SMP NEGERI 2 PACIRAN'}
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Sistem Input Absensi Harian, Rekapitulasi Presensi Kalender & Sinkronisasi Spreadsheet
              </p>
            </div>
          </div>

          {/* Top Desktop Navigation */}
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-header-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        isActive
                          ? 'bg-emerald-700 text-emerald-100'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
