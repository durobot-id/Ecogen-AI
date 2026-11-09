'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calculator, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import PinModal from '@/components/common/PinModal';
import OfflineBanner from '@/components/common/OfflineBanner';
import { UserRole } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration failed:', err);
      });
    }
  }, []);

  // Check if session already active
  useEffect(() => {
    async function verifyExistingSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.authenticated && data.role) {
          router.push(data.role === 'admin' ? '/admin' : '/kasir');
          return;
        }
      } catch {
        // Proceed as unauthenticated
      } finally {
        setCheckingSession(false);
      }
    }
    verifyExistingSession();
  }, [router]);

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7FBF7]">
        <div className="w-8 h-8 border-3 border-[#35C96F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FBF7]">
      <OfflineBanner />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md mx-auto">
          {selectedRole ? (
            <PinModal role={selectedRole} onBack={() => setSelectedRole(null)} />
          ) : (
            <div className="space-y-8 animate-fadeIn">
              {/* Brand Header */}
              <div className="text-center space-y-3">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-white border border-[#E5EEE7] p-3 shadow-lg shadow-[#35C96F]/10 flex items-center justify-center">
                  <svg viewBox="0 0 512 512" fill="none" className="w-full h-full">
                    <path
                      d="M256 70C360 70 420 150 420 256C420 370 340 430 256 430C172 430 92 370 92 256C92 150 152 70 256 70Z"
                      fill="#35C96F"
                    />
                    <path
                      d="M256 120C256 120 260 270 340 330"
                      stroke="#E8F9EE"
                      strokeWidth="24"
                      strokeLinecap="round"
                    />
                    <path d="M256 160V380" stroke="#FFFFFF" strokeWidth="28" strokeLinecap="round" />
                    <circle cx="340" cy="180" r="26" fill="#159447" />
                  </svg>
                </div>

                <div>
                  <div className="inline-flex items-center gap-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#18352A]">
                      EcoGen
                    </h1>
                    <span className="px-2 py-0.5 rounded-md bg-[#E8F9EE] text-[#159447] font-bold text-xs border border-[#35C96F]/40">
                      AI
                    </span>
                  </div>
                  <p className="text-sm text-[#74857B] mt-1 max-w-xs mx-auto">
                    Aplikasi Pengelolaan & Transaksi Pembayaran EcoPoint Siswa
                  </p>
                </div>
              </div>

              {/* Menu Cards */}
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#74857B] text-center">
                  Pilih Mode Akses
                </p>

                {/* Kasir Card */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('kasir')}
                  className="w-full text-left bg-white p-5 rounded-2xl border border-[#E5EEE7] hover:border-[#35C96F] shadow-sm hover:shadow-md transition-all group active:scale-98 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-13 h-13 rounded-xl bg-[#E8F9EE] border border-[#35C96F]/30 flex items-center justify-center text-[#159447] group-hover:scale-105 transition-transform">
                      <Calculator className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg text-[#18352A] group-hover:text-[#159447] transition-colors">
                        Kasir
                      </h2>
                      <p className="text-xs text-[#74857B] mt-0.5">
                        Transaksi cepat pemotongan poin via kartu RFID
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#F7FBF7] group-hover:bg-[#E8F9EE] flex items-center justify-center text-[#74857B] group-hover:text-[#159447] transition-colors shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>

                {/* Admin Card */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className="w-full text-left bg-white p-5 rounded-2xl border border-[#E5EEE7] hover:border-[#35C96F] shadow-sm hover:shadow-md transition-all group active:scale-98 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-13 h-13 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#159447] group-hover:scale-105 transition-transform">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg text-[#18352A] group-hover:text-[#159447] transition-colors">
                        Admin
                      </h2>
                      <p className="text-xs text-[#74857B] mt-0.5">
                        Kelola data siswa, saldo, riwayat & strategi AI
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#F7FBF7] group-hover:bg-[#E8F9EE] flex items-center justify-center text-[#74857B] group-hover:text-[#159447] transition-colors shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              </div>

              {/* Footer info */}
              <div className="text-center pt-4">
                <div className="inline-flex items-center gap-1.5 text-[11px] text-[#74857B] bg-white px-3 py-1.5 rounded-full border border-[#E5EEE7]">
                  <Sparkles className="w-3.5 h-3.5 text-[#35C96F]" />
                  <span>Didukung Firebase Realtime Database & Gemini AI</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
