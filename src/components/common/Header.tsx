'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, ShieldCheck, Calculator, Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderProps {
  role?: 'kasir' | 'admin' | null;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
}

export default function Header({ role, title, subtitle }: HeaderProps) {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const setOnline = () => setIsOnline(true);
    const setOffline = () => setIsOnline(false);

    window.addEventListener('online', setOnline);
    window.addEventListener('offline', setOffline);

    return () => {
      window.removeEventListener('online', setOnline);
      window.removeEventListener('offline', setOffline);
    };
  }, []);

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sesi?')) {
      setLoggingOut(true);
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
        router.refresh();
      } catch (e) {
        console.error('Logout error:', e);
      } finally {
        setLoggingOut(false);
      }
    }
  };

  return (
    <header className="bg-white border-b border-[#E5EEE7] sticky top-0 z-40 transition-shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#E8F9EE] border border-[#35C96F]/30 flex items-center justify-center p-1.5 transition-transform group-hover:scale-105">
            <svg viewBox="0 0 512 512" fill="none" className="w-full h-full">
              <path
                d="M256 70C360 70 420 150 420 256C420 370 340 430 256 430C172 430 92 370 92 256C92 150 152 70 256 70Z"
                fill="#35C96F"
              />
              <path d="M256 120C256 120 260 270 340 330" stroke="#E8F9EE" strokeWidth="24" strokeLinecap="round" />
              <path d="M256 160V380" stroke="#FFFFFF" strokeWidth="28" strokeLinecap="round" />
              <circle cx="340" cy="180" r="24" fill="#159447" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-[#18352A] tracking-tight">EcoGen</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#E8F9EE] text-[#159447] font-semibold border border-[#35C96F]/30">
                AI
              </span>
            </div>
            {subtitle && <p className="text-[11px] text-[#74857B] leading-none">{subtitle}</p>}
          </div>
        </Link>

        {/* Right Controls: Role Badge, Network, Logout */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Network Indicator */}
          <div
            className={`hidden sm:flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${
              isOnline
                ? 'bg-[#E8F9EE] text-[#159447] border-[#35C96F]/30'
                : 'bg-red-50 text-[#E05252] border-red-200'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Role Badge */}
          {role && (
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                role === 'admin'
                  ? 'bg-emerald-50 text-[#159447] border-emerald-200'
                  : 'bg-[#E8F9EE] text-[#159447] border-[#35C96F]/40'
              }`}
            >
              {role === 'admin' ? (
                <ShieldCheck className="w-4 h-4 text-[#159447]" />
              ) : (
                <Calculator className="w-4 h-4 text-[#159447]" />
              )}
              <span className="capitalize">{role === 'admin' ? 'Admin' : 'Kasir'}</span>
            </div>
          )}

          {/* Logout Action */}
          {role && (
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="p-2 rounded-lg text-[#74857B] hover:text-[#E05252] hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
              title="Keluar Sesi"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
