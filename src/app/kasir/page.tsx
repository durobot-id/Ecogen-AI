'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/common/Header';
import Keypad from '@/components/common/Keypad';
import ReceiptModal from '@/components/common/ReceiptModal';
import OfflineBanner from '@/components/common/OfflineBanner';
import {
  CreditCard,
  AlertTriangle,
  Radio,
  CheckCircle,
  Clock,
  Sparkles,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { Student } from '@/types';

interface RfidInfo {
  detected: boolean;
  status: 'ready' | 'expired' | 'used' | 'unregistered' | 'waiting';
  message: string;
  ageSeconds?: number;
  record?: { id: string; UID: string; createdAt: number };
  student?: Student | null;
}

export default function KasirPage() {
  const router = useRouter();
  const [nominal, setNominal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [rfidStatus, setRfidStatus] = useState<RfidInfo>({
    detected: false,
    status: 'waiting',
    message: 'Memeriksa sensor RFID...',
  });
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);

  // Poll RFID status periodically
  const fetchRfidStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/cashier/rfid-status');
      if (res.status === 401 || res.status === 403) {
        router.push('/');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setRfidStatus(data);
      }
    } catch (e) {
      console.warn('RFID polling failed:', e);
    }
  }, [router]);

  useEffect(() => {
    fetchRfidStatus();
    const interval = setInterval(fetchRfidStatus, 2500);
    return () => clearInterval(interval);
  }, [fetchRfidStatus]);

  // Keypad Handlers
  const handleDigit = (digit: string) => {
    setErrorMsg('');
    const str = nominal.toString();
    if (str.length >= 8) return; // Prevent excessive values
    const nextVal = nominal === 0 ? Number(digit) : Number(str + digit);
    setNominal(nextVal);
  };

  const handleClear = () => {
    setNominal(0);
    setErrorMsg('');
  };

  const handleBackspace = () => {
    setErrorMsg('');
    const str = nominal.toString();
    if (str.length <= 1) {
      setNominal(0);
    } else {
      setNominal(Number(str.slice(0, -1)));
    }
  };

  const handleShortcut = (val: number) => {
    setErrorMsg('');
    setNominal(val);
  };

  // Simulate RFID Tap Helper (for testing without physical card scanner)
  const handleSimulateTap = async (uid = 'CB69FD2F') => {
    setSimulating(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/cashier/simulate-tap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchRfidStatus();
      } else {
        setErrorMsg(data.message || 'Gagal simulasi tap.');
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setSimulating(false);
    }
  };

  // Process Transaction
  const handleProcessTransaction = async () => {
    if (nominal <= 0) {
      setErrorMsg('Nominal transaksi harus lebih besar dari Rp0.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/cashier/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: nominal,
          targetUid: rfidStatus.record?.UID,
          processId: rfidStatus.record?.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Transaksi gagal diproses.');
        await fetchRfidStatus();
        return;
      }

      // Success! Open receipt modal
      setReceiptData(data.data);
      setNominal(0);
      await fetchRfidStatus();
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan saat memproses transaksi.');
    } finally {
      setLoading(false);
    }
  };

  const isCardReady = rfidStatus.status === 'ready' && rfidStatus.student;
  const isBalanceEnough = isCardReady && (rfidStatus.student?.poin || 0) >= nominal;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FBF7]">
      <OfflineBanner />
      <Header role="kasir" subtitle="Terminal Kasir EcoPoint" />

      <main className="flex-1 max-w-lg w-full mx-auto p-4 sm:p-6 flex flex-col justify-between">
        <div className="space-y-4">
          {/* RFID Status Indicator Card */}
          <div className="bg-white rounded-2xl p-4 border border-[#E5EEE7] shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5EEE7]">
              <div className="flex items-center gap-2">
                <Radio
                  className={`w-4 h-4 ${
                    isCardReady
                      ? 'text-[#20A65A] animate-pulse'
                      : rfidStatus.status === 'waiting'
                      ? 'text-[#74857B]'
                      : 'text-[#E9A23B]'
                  }`}
                />
                <span className="text-xs font-bold text-[#18352A] uppercase tracking-wide">
                  Status Kartu Siswa
                </span>
              </div>

              {/* Tap simulation trigger for quick testing */}
              <button
                type="button"
                onClick={() => handleSimulateTap('CB69FD2F')}
                disabled={simulating}
                className="text-[11px] font-semibold text-[#159447] bg-[#E8F9EE] px-2.5 py-1 rounded-lg border border-[#35C96F]/30 hover:bg-[#35C96F] hover:text-white transition-all flex items-center gap-1 active:scale-95"
                title="Simulasi Tap Kartu RFID Arya (CB69FD2F)"
              >
                <Sparkles className="w-3 h-3" />
                <span>{simulating ? 'Tapping...' : 'Simulasi Tap'}</span>
              </button>
            </div>

            {/* Status Content */}
            <div className="pt-3">
              {isCardReady ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-bold text-[#18352A] capitalize">
                        {rfidStatus.student?.nama}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-[#E8F9EE] text-[#159447] font-semibold">
                        {rfidStatus.student?.kelas}
                      </span>
                    </div>
                    <p className="text-xs text-[#74857B] mt-0.5">
                      UID: <span className="font-mono">{rfidStatus.record?.UID}</span> •{' '}
                      {rfidStatus.ageSeconds}d lalu
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-[#74857B]">Saldo Poin</p>
                    <p className="text-base font-extrabold text-[#159447]">
                      Rp{(rfidStatus.student?.poin || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 text-xs text-[#74857B] py-1">
                  {rfidStatus.status === 'waiting' && (
                    <Clock className="w-4 h-4 text-[#74857B] shrink-0" />
                  )}
                  {rfidStatus.status === 'expired' && (
                    <Clock className="w-4 h-4 text-[#E9A23B] shrink-0" />
                  )}
                  {(rfidStatus.status === 'used' || rfidStatus.status === 'unregistered') && (
                    <AlertTriangle className="w-4 h-4 text-[#E05252] shrink-0" />
                  )}
                  <span className="leading-snug">{rfidStatus.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Nominal Display Area */}
          <div className="bg-white rounded-3xl p-5 border border-[#E5EEE7] shadow-sm text-center">
            <span className="text-xs font-semibold text-[#74857B] uppercase tracking-wider block">
              Nominal Transaksi
            </span>

            <div className="my-2 flex items-center justify-center">
              <span className="text-4xl sm:text-5xl font-black text-[#18352A] tracking-tight">
                Rp{nominal.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Balance comparison warning if nominal > student balance */}
            {isCardReady && nominal > (rfidStatus.student?.poin || 0) && (
              <p className="text-xs font-medium text-[#E05252] mt-1 flex items-center justify-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Nominal melebihi saldo siswa!</span>
              </p>
            )}

            {errorMsg && (
              <div className="mt-2 p-2.5 rounded-xl bg-red-50 text-[#E05252] text-xs font-medium border border-red-100 flex items-center justify-center gap-1.5 animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Virtual Numeric Keypad */}
          <Keypad
            onDigit={handleDigit}
            onClear={handleClear}
            onBackspace={handleBackspace}
            onShortcut={handleShortcut}
            showShortcuts={true}
            disabled={loading}
          />
        </div>

        {/* Process Button */}
        <div className="pt-4">
          <button
            type="button"
            onClick={handleProcessTransaction}
            disabled={loading || nominal <= 0}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-lg text-white transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 ${
              loading || nominal <= 0
                ? 'bg-[#CBDAD0] text-gray-500 cursor-not-allowed shadow-none'
                : 'bg-[#35C96F] hover:bg-[#159447] shadow-[#35C96F]/25'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Memproses Pemotongan...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>PROSES TRANSAKSI</span>
              </>
            )}
          </button>
        </div>
      </main>

      {/* Transaction Receipt Modal */}
      {receiptData && (
        <ReceiptModal data={receiptData} onClose={() => setReceiptData(null)} />
      )}
    </div>
  );
}
