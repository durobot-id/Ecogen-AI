'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Calculator, AlertCircle, Lock } from 'lucide-react';
import Keypad from './Keypad';
import { UserRole } from '@/types';

interface PinModalProps {
  role: UserRole;
  onBack: () => void;
  onSuccess?: () => void;
}

export default function PinModal({ role, onBack, onSuccess }: PinModalProps) {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lockedWaitSeconds, setLockedWaitSeconds] = useState(0);

  // Lockout countdown timer
  useEffect(() => {
    if (lockedWaitSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockedWaitSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedWaitSeconds]);

  // Handle auto-submit when 4 digits entered
  useEffect(() => {
    if (pin.length === 4) {
      handlePinSubmit(pin);
    }
  }, [pin]);

  const handleDigit = (digit: string) => {
    if (lockedWaitSeconds > 0 || loading) return;
    if (pin.length < 4) {
      setErrorMessage('');
      setPin((prev) => prev + digit);
    }
  };

  const handleClear = () => {
    if (lockedWaitSeconds > 0 || loading) return;
    setPin('');
    setErrorMessage('');
  };

  const handleBackspace = () => {
    if (lockedWaitSeconds > 0 || loading) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handlePinSubmit = async (submittedPin: string) => {
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, pin: submittedPin }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setPin('');
        setErrorMessage(data.message || 'PIN tidak valid.');
        if (data.locked && data.waitSeconds) {
          setLockedWaitSeconds(data.waitSeconds);
        }
        return;
      }

      // Success
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(role === 'admin' ? '/admin' : '/kasir');
      }
    } catch {
      setPin('');
      setErrorMessage('Terjadi kesalahan koneksi server.');
    } finally {
      setLoading(false);
    }
  };

  const isLocked = lockedWaitSeconds > 0;

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E5EEE7] transition-all">
      {/* Top bar with Back button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          type="button"
          className="p-2 -ml-2 rounded-xl text-[#74857B] hover:text-[#18352A] hover:bg-[#F7FBF7] transition-colors flex items-center gap-1.5 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#E8F9EE] text-[#159447] border border-[#35C96F]/30">
          {role === 'admin' ? <ShieldCheck className="w-3.5 h-3.5" /> : <Calculator className="w-3.5 h-3.5" />}
          <span className="capitalize">{role === 'admin' ? 'Admin PIN' : 'Kasir PIN'}</span>
        </div>
      </div>

      {/* Header Info */}
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-[#18352A]">Masukkan PIN</h2>
        <p className="text-xs sm:text-sm text-[#74857B] mt-1">
          {role === 'kasir' ? 'Gunakan PIN Kasir (Default: 1234)' : 'Gunakan PIN Admin (Default: 4321)'}
        </p>
      </div>

      {/* 4-Digit Bullet Display */}
      <div className="flex justify-center items-center gap-4 mb-6">
        {[0, 1, 2, 3].map((idx) => {
          const filled = pin.length > idx;
          return (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                filled
                  ? 'bg-[#35C96F] scale-125 shadow-xs shadow-[#35C96F]/50 ring-4 ring-[#E8F9EE]'
                  : 'bg-[#E5EEE7] scale-100'
              }`}
            />
          );
        })}
      </div>

      {/* Error or Lockout Feedback */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-[#E05252] text-xs flex items-center gap-2 animate-shake">
          {isLocked ? <Lock className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Lockout countdown banner */}
      {isLocked && (
        <div className="mb-4 text-center">
          <span className="text-xs font-semibold text-[#E05252] bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
            Coba lagi dalam {lockedWaitSeconds} detik
          </span>
        </div>
      )}

      {/* Virtual Keypad */}
      <Keypad
        onDigit={handleDigit}
        onClear={handleClear}
        onBackspace={handleBackspace}
        disabled={loading || isLocked}
      />

      {loading && (
        <p className="text-center text-xs text-[#159447] font-medium mt-4 animate-pulse">
          Memverifikasi PIN...
        </p>
      )}
    </div>
  );
}
