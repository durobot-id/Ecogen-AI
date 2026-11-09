'use client';

import { useEffect } from 'react';
import { CheckCircle2, Printer, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReceiptData {
  transactionId: string;
  amount: number;
  nama: string;
  kelas: string;
  balanceBefore: number;
  balanceAfter: number;
  timestamp: number;
}

interface ReceiptModalProps {
  data: ReceiptData;
  onClose: () => void;
}

export default function ReceiptModal({ data, onClose }: ReceiptModalProps) {
  useEffect(() => {
    // Fire celebratory confetti burst
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#35C96F', '#159447', '#E8F9EE', '#20A65A'],
      });
    } catch {
      // Ignored if canvas-confetti unsupported
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#E5EEE7] relative text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#E8F9EE] text-[#20A65A] border border-[#35C96F]/30 flex items-center justify-center shadow-xs">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h3 className="text-sm font-semibold tracking-wider text-[#159447] uppercase">
          Transaksi Berhasil
        </h3>

        {/* Large Amount */}
        <div className="my-3">
          <span className="text-3xl sm:text-4xl font-extrabold text-[#18352A]">
            Rp{data.amount.toLocaleString('id-ID')}
          </span>
        </div>

        {/* Student Details Card */}
        <div className="bg-[#F7FBF7] border border-[#E5EEE7] rounded-2xl p-4 my-4 space-y-3 text-left">
          <div className="flex justify-between items-center pb-2 border-b border-[#E5EEE7]">
            <div>
              <p className="text-xs text-[#74857B]">Nama Siswa</p>
              <p className="text-base font-bold text-[#18352A] capitalize">{data.nama}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#74857B]">Kelas</p>
              <p className="text-sm font-semibold text-[#18352A]">{data.kelas}</p>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#74857B]">Saldo sebelumnya</span>
            <span className="font-medium text-[#74857B]">
              Rp{data.balanceBefore.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm pt-1 border-t border-[#E5EEE7]">
            <span className="font-semibold text-[#18352A]">Saldo sekarang</span>
            <span className="font-bold text-[#159447] text-base">
              Rp{data.balanceAfter.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Transaction Meta */}
        <div className="text-[11px] text-[#74857B] mb-6 space-y-0.5">
          <p>ID: {data.transactionId}</p>
          <p>{new Date(data.timestamp).toLocaleString('id-ID')}</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-[#35C96F] hover:bg-[#159447] active:scale-98 transition-all shadow-md shadow-[#35C96F]/20 flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            <span>SELESAI</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-[#74857B] hover:text-[#18352A] hover:bg-[#F7FBF7] transition-colors flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
}
