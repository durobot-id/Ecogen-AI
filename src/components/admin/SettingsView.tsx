'use client';

import { useState } from 'react';
import { Settings, Database, Radio, Sparkles, CheckCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { Student } from '@/types';

interface SettingsViewProps {
  students: Student[];
}

export default function SettingsView({ students }: SettingsViewProps) {
  const [testUid, setTestUid] = useState('CB69FD2F');
  const [testingDb, setTestingDb] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  const handleTestDatabase = async () => {
    setTestingDb(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/cashier/rfid-status');
      const data = await res.json();
      if (data.success) {
        setTestResult('Koneksi ke Firebase Realtime Database Berhasil dan Aktif.');
      } else {
        setTestResult(`Gagal: ${data.message}`);
      }
    } catch {
      setTestResult('Koneksi database gagal atau terputus.');
    } finally {
      setTestingDb(false);
    }
  };

  const handleSimulateTap = async () => {
    setSimulating(true);
    try {
      const res = await fetch('/api/cashier/simulate-tap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: testUid.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Berhasil mengirim simulasi tap kartu UID: ${testUid} ke Firebase /Proses!`);
      } else {
        alert(data.message || 'Gagal simulasi tap.');
      }
    } catch {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-[#E5EEE7] shadow-xs">
        <h2 className="text-xl font-bold text-[#18352A] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#35C96F]" />
          <span>Pengaturan Sistem & Diagnostik</span>
        </h2>
        <p className="text-xs text-[#74857B] mt-0.5">
          Informasi konfigurasi database Firebase, simulator RFID, dan status aplikasi
        </p>
      </div>

      {/* Database Diagnostic */}
      <div className="bg-white rounded-2xl p-6 border border-[#E5EEE7] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E5EEE7]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#E8F9EE] text-[#159447] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#18352A]">Firebase Realtime Database</h3>
              <p className="text-xs text-[#74857B]">
                https://ecopoint-database-default-rtdb.asia-southeast1.firebasedatabase.app
              </p>
            </div>
          </div>

          <button
            onClick={handleTestDatabase}
            disabled={testingDb}
            className="py-1.5 px-3 rounded-lg border border-[#35C96F]/40 bg-[#E8F9EE] text-[#159447] text-xs font-semibold hover:bg-[#35C96F] hover:text-white transition-all flex items-center gap-1.5"
          >
            {testingDb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
            <span>Uji Koneksi</span>
          </button>
        </div>

        {testResult && (
          <div className="p-3 rounded-xl bg-[#E8F9EE] border border-[#35C96F]/30 text-[#159447] text-xs font-medium">
            {testResult}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="bg-[#F7FBF7] p-3 rounded-xl border border-[#E5EEE7]">
            <span className="text-[#74857B] block">Node Siswa:</span>
            <span className="font-mono font-bold text-[#18352A]">/Siwa</span>
          </div>
          <div className="bg-[#F7FBF7] p-3 rounded-xl border border-[#E5EEE7]">
            <span className="text-[#74857B] block">Node RFID Pending:</span>
            <span className="font-mono font-bold text-[#18352A]">/Proses</span>
          </div>
          <div className="bg-[#F7FBF7] p-3 rounded-xl border border-[#E5EEE7]">
            <span className="text-[#74857B] block">Node Ledger Transaksi:</span>
            <span className="font-mono font-bold text-[#18352A]">/Transaksi</span>
          </div>
        </div>
      </div>

      {/* RFID Hardware Simulator */}
      <div className="bg-white rounded-2xl p-6 border border-[#E5EEE7] shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-[#E5EEE7]">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#18352A]">Simulator Tap Kartu RFID</h3>
            <p className="text-xs text-[#74857B]">
              Simulasikan tap kartu fisik RFID ke node /Proses untuk menguji pemotongan poin kasir
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs font-bold text-[#18352A] block mb-1">
              Pilih UID Siswa untuk Disimulasikan:
            </label>
            <select
              value={testUid}
              onChange={(e) => setTestUid(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5EEE7] bg-[#F7FBF7]"
            >
              {students.map((st) => (
                <option key={st.uid} value={st.uid}>
                  {st.nama} ({st.kelas}) — UID: {st.uid} — Saldo: Rp{st.poin.toLocaleString('id-ID')}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSimulateTap}
            disabled={simulating || !testUid}
            className="w-full sm:w-auto py-2 px-5 rounded-xl bg-[#35C96F] hover:bg-[#159447] text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{simulating ? 'Menstimulasi...' : 'Kirim Tap Kartu Sekarang'}</span>
          </button>
        </div>
      </div>

      {/* Security Info */}
      <div className="bg-white rounded-2xl p-6 border border-[#E5EEE7] shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#18352A]">
          <ShieldCheck className="w-4 h-4 text-[#35C96F]" />
          <span>Informasi Keamanan & Kredensial Prototipe</span>
        </div>
        <p className="text-xs text-[#74857B]">
          Sistem menggunakan verifikasi PIN di sisi server dengan HttpOnly JWT session cookie.
        </p>
        <div className="grid grid-cols-2 gap-3 text-xs pt-1">
          <div className="bg-[#F7FBF7] p-3 rounded-xl border border-[#E5EEE7]">
            <span className="text-[#74857B] block">PIN Kasir Bawaan:</span>
            <span className="font-mono font-bold text-[#18352A]">1234</span>
          </div>
          <div className="bg-[#F7FBF7] p-3 rounded-xl border border-[#E5EEE7]">
            <span className="text-[#74857B] block">PIN Admin Bawaan:</span>
            <span className="font-mono font-bold text-[#18352A]">4321</span>
          </div>
        </div>
      </div>
    </div>
  );
}
