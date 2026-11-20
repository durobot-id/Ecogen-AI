'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Coins,
  CheckCircle,
  XCircle,
  X,
  Filter,
  Check,
  Radio,
  Sparkles,
  RefreshCw,
  UserX,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { Student } from '@/types';

interface StudentsManagementProps {
  students: Student[];
  loading: boolean;
  onRefresh: () => void;
  onOpenTopUp: (student: Student) => void;
}

export default function StudentsManagement({
  students,
  loading,
  onRefresh,
  onOpenTopUp,
}: StudentsManagementProps) {
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState<'nama' | 'poin' | 'kelas'>('nama');

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteTargetStudent, setDeleteTargetStudent] = useState<Student | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [formUid, setFormUid] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formKelas, setFormKelas] = useState('');
  const [formPoin, setFormPoin] = useState('0');
  const [formStatus, setFormStatus] = useState<'aktif' | 'nonaktif'>('aktif');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Live RFID Tap Detection for auto-filling UID
  interface LatestTapData {
    record: { id: string; UID: string; createdAt: number; status: string; device?: string } | null;
    student: Student | null;
    ageSeconds: number;
    isRegistered: boolean;
  }
  const [liveTap, setLiveTap] = useState<LatestTapData | null>(null);
  const [autoFilledUid, setAutoFilledUid] = useState('');

  // Poll for latest RFID tap when Add Student modal is open
  useEffect(() => {
    if (!isAddOpen) {
      setLiveTap(null);
      setAutoFilledUid('');
      return;
    }

    let isMounted = true;
    const fetchLatestTap = async () => {
      try {
        const res = await fetch('/api/admin/latest-tap', { cache: 'no-store' });
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          const data: LatestTapData = json.data;
          setLiveTap(data);

          if (data.record && data.record.UID) {
            const detectedUid = data.record.UID.trim().toUpperCase();
            // Automatically fill UID if formUid is currently empty or user just tapped a new card
            setFormUid((prev) => {
              if (!prev || prev !== detectedUid && data.ageSeconds <= 60) {
                setAutoFilledUid(detectedUid);
                return detectedUid;
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.warn('Error polling live tap:', err);
      }
    };

    fetchLatestTap();
    const interval = setInterval(fetchLatestTap, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAddOpen]);

  // Extract unique classes
  const classList = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.kelas) set.add(s.kelas);
    });
    return Array.from(set).sort();
  }, [students]);

  // Filtered & Sorted list
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        const matchesSearch =
          s.nama.toLowerCase().includes(search.toLowerCase()) ||
          s.uid.toLowerCase().includes(search.toLowerCase()) ||
          s.kelas.toLowerCase().includes(search.toLowerCase());

        const matchesClass = filterClass === 'ALL' || s.kelas === filterClass;
        const matchesStatus = filterStatus === 'ALL' || (s.status || 'aktif') === filterStatus;

        return matchesSearch && matchesClass && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'poin') return b.poin - a.poin;
        if (sortBy === 'kelas') return a.kelas.localeCompare(b.kelas);
        return a.nama.localeCompare(b.nama);
      });
  }, [students, search, filterClass, filterStatus, sortBy]);

  const handleOpenAdd = () => {
    setFormUid('');
    setFormNama('');
    setFormKelas('7A');
    setFormPoin('0');
    setFormStatus('aktif');
    setFormError('');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormNama(student.nama);
    setFormKelas(student.kelas);
    setFormStatus(student.status || 'aktif');
    setFormError('');
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUid || !formNama || !formKelas) {
      setFormError('Semua field wajib diisi.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: formUid.trim(),
          nama: formNama.trim(),
          kelas: formKelas.trim(),
          poin: Number(formPoin) || 0,
          status: formStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || 'Gagal menambahkan siswa.');
        return;
      }

      setIsAddOpen(false);
      onRefresh();
    } catch {
      setFormError('Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    if (!formNama || !formKelas) {
      setFormError('Nama dan kelas tidak boleh kosong.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch(`/api/students/${editingStudent.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama: formNama.trim(),
          kelas: formKelas.trim(),
          status: formStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || 'Gagal memperbarui siswa.');
        return;
      }

      setEditingStudent(null);
      onRefresh();
    } catch {
      setFormError('Terjadi kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (student: Student, targetStatus?: 'aktif' | 'nonaktif') => {
    const nextStatus = targetStatus || ((student.status || 'aktif') === 'aktif' ? 'nonaktif' : 'aktif');
    const actionText = nextStatus === 'nonaktif' ? 'menonaktifkan' : 'mengaktifkan kembali';

    const confirmed = confirm(
      `Apakah Anda yakin ingin ${actionText} akun ${student.nama} (${student.uid})?`
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/students/${student.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        if (deleteTargetStudent?.uid === student.uid) {
          setDeleteTargetStudent(null);
        }
        onRefresh();
      } else {
        alert(data.message || 'Gagal mengubah status siswa.');
      }
    } catch {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePermanent = async (student: Student) => {
    const confirmed = confirm(
      `PERINGATAN: Apakah Anda yakin ingin MENGHAPUS PERMANEN siswa ${student.nama} (${student.uid}) dari database Firebase?\n\nSeluruh data siswa ini akan dihapus dari sistem.`
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/students/${student.uid}?permanent=true`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteTargetStudent(null);
        if (editingStudent?.uid === student.uid) {
          setEditingStudent(null);
        }
        onRefresh();
      } else {
        alert(data.message || 'Gagal menghapus data siswa.');
      }
    } catch {
      alert('Terjadi kesalahan jaringan saat menghapus data siswa.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5EEE7] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#18352A] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#35C96F]" />
            <span>Data Siswa</span>
          </h2>
          <p className="text-xs text-[#74857B] mt-0.5">
            Kelola data akun siswa dan pemetaan kartu RFID
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="py-2.5 px-4 rounded-xl bg-[#35C96F] hover:bg-[#159447] text-white text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Siswa</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E5EEE7] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-[#74857B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, kelas, atau UID..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F] focus:ring-2 focus:ring-[#E8F9EE] bg-[#F7FBF7]"
            />
          </div>

          {/* Filter Class */}
          <div className="relative">
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F] bg-[#F7FBF7] text-[#18352A]"
            >
              <option value="ALL">Semua Kelas</option>
              {classList.map((c) => (
                <option key={c} value={c}>
                  Kelas {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F] bg-[#F7FBF7] text-[#18352A]"
            >
              <option value="nama">Urut: Nama (A-Z)</option>
              <option value="poin">Urut: Poin Tertinggi</option>
              <option value="kelas">Urut: Kelas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Table View & Mobile Card View */}
      <div className="bg-white rounded-2xl border border-[#E5EEE7] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#74857B]">Memuat data siswa...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-8 h-8 mx-auto text-[#CBDAD0]" />
            <p className="text-sm font-semibold text-[#18352A]">Tidak ada siswa ditemukan</p>
            <p className="text-xs text-[#74857B]">
              Coba sesuaikan kata kunci pencarian atau filter kelas.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F7FBF7] text-xs font-semibold text-[#74857B] border-b border-[#E5EEE7] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">UID Kartu</th>
                    <th className="px-5 py-3.5">Nama Siswa</th>
                    <th className="px-5 py-3.5">Kelas</th>
                    <th className="px-5 py-3.5 text-right">Saldo Poin</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EEE7]">
                  {filteredStudents.map((st) => (
                    <tr key={st.uid} className="hover:bg-[#F7FBF7] transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-[#18352A]">
                        {st.uid}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-[#18352A] capitalize">
                        {st.nama}
                      </td>
                      <td className="px-5 py-3.5 text-[#74857B] font-medium">{st.kelas}</td>
                      <td className="px-5 py-3.5 text-right font-extrabold text-[#159447]">
                        Rp{st.poin.toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(st)}
                          title="Klik untuk ubah status (Aktif/Nonaktif)"
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                            (st.status || 'aktif') === 'aktif'
                              ? 'bg-[#E8F9EE] text-[#159447] hover:bg-[#35C96F]/20'
                              : 'bg-gray-100 text-[#74857B] hover:bg-gray-200'
                          }`}
                        >
                          {(st.status || 'aktif') === 'aktif' ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenTopUp(st)}
                            className="p-1.5 rounded-lg text-[#159447] hover:bg-[#E8F9EE] transition-colors"
                            title="Top Up Poin"
                          >
                            <Coins className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(st)}
                            className="p-1.5 rounded-lg text-[#74857B] hover:text-[#18352A] hover:bg-gray-100 transition-colors"
                            title="Edit Data"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTargetStudent(st)}
                            className="p-1.5 rounded-lg text-[#74857B] hover:text-[#E05252] hover:bg-red-50 transition-colors"
                            title="Kelola / Hapus Siswa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden divide-y divide-[#E5EEE7]">
              {filteredStudents.map((st) => (
                <div key={st.uid} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-base text-[#18352A] capitalize">{st.nama}</p>
                      <p className="text-xs text-[#74857B]">
                        Kelas {st.kelas} • <span className="font-mono">{st.uid}</span>
                      </p>
                    </div>
                    <span className="font-extrabold text-base text-[#159447]">
                      Rp{st.poin.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(st)}
                      title="Klik untuk ubah status (Aktif/Nonaktif)"
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition-all active:scale-95 cursor-pointer ${
                        (st.status || 'aktif') === 'aktif'
                          ? 'bg-[#E8F9EE] text-[#159447]'
                          : 'bg-gray-100 text-[#74857B]'
                      }`}
                    >
                      {(st.status || 'aktif') === 'aktif' ? 'Aktif' : 'Nonaktif'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenTopUp(st)}
                        className="py-1 px-2.5 rounded-lg text-xs font-semibold bg-[#E8F9EE] text-[#159447] flex items-center gap-1"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Poin</span>
                      </button>
                      <button
                        onClick={() => handleOpenEdit(st)}
                        className="p-1.5 rounded-lg text-[#74857B] hover:bg-gray-100"
                        title="Edit Data"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetStudent(st)}
                        className="p-1.5 rounded-lg text-[#E05252] hover:bg-red-50"
                        title="Kelola / Hapus Siswa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Student Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#E5EEE7] relative animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EEE7]">
              <h3 className="font-bold text-lg text-[#18352A]">Tambah Siswa Baru</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg text-[#74857B] hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4 pt-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 text-[#E05252] text-xs font-medium border border-red-100 flex items-center gap-1.5">
                  <span>{formError}</span>
                </div>
              )}

              {/* Live RFID Hardware Reader Auto-Sync Box */}
              <div className="bg-[#F7FBF7] p-3.5 rounded-2xl border border-[#E5EEE7] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio
                      className={`w-4 h-4 ${
                        liveTap?.record ? 'text-[#35C96F] animate-pulse' : 'text-[#74857B]'
                      }`}
                    />
                    <span className="text-xs font-bold text-[#18352A]">
                      Sensor RFID
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#E8F9EE] text-[#159447] border border-[#35C96F]/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Sinkron</span>
                  </span>
                </div>

                {liveTap?.record ? (
                  <div className="bg-white p-3 rounded-xl border border-[#35C96F]/30 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#74857B]">UID Terdeteksi:</span>
                        <span className="font-mono font-extrabold text-sm text-[#159447] bg-[#E8F9EE] px-2 py-0.5 rounded-md border border-[#35C96F]/30">
                          {liveTap.record.UID}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#74857B]">
                        {liveTap.ageSeconds}d lalu
                      </span>
                    </div>

                    {liveTap.isRegistered ? (
                      <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        Kartu sudah terdaftar: <strong>{liveTap.student?.nama}</strong> ({liveTap.student?.kelas})
                      </div>
                    ) : (
                      <div className="text-[11px] text-[#159447] bg-[#E8F9EE] p-2 rounded-lg border border-[#35C96F]/20 flex items-center gap-1.5 font-medium">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>Kartu terdeteksi. UID otomatis terisi.</span>
                      </div>
                    )}

                    {formUid !== liveTap.record.UID && (
                      <button
                        type="button"
                        onClick={() => setFormUid(liveTap.record!.UID)}
                        className="text-xs font-bold text-[#159447] hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Gunakan UID ({liveTap.record.UID})</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-white/60 p-3 rounded-xl border border-dashed border-[#CBDAD0] text-center text-xs text-[#74857B] space-y-1">
                    <p className="font-medium text-[#18352A]">Tempelkan kartu baru pada alat scanner...</p>
                    <p className="text-[11px]">UID otomatis terisi saat kartu ditempelkan.</p>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#18352A]">
                    UID Kartu RFID *
                  </label>
                  {formUid && formUid === liveTap?.record?.UID && (
                    <span className="text-[10px] text-[#159447] font-semibold bg-[#E8F9EE] px-2 py-0.5 rounded-md">
                      ✓ Otomatis
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 6A605D83"
                  value={formUid}
                  onChange={(e) => setFormUid(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F] font-mono font-bold bg-[#F7FBF7]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#18352A] block mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#18352A] block mb-1">Kelas *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 7A"
                    value={formKelas}
                    onChange={(e) => setFormKelas(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#18352A] block mb-1">Saldo Awal</label>
                  <input
                    type="number"
                    min="0"
                    value={formPoin}
                    onChange={(e) => setFormPoin(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#74857B] hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#35C96F] hover:bg-[#159447] text-white text-sm font-bold shadow-xs transition-all"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#E5EEE7] relative animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EEE7]">
              <div>
                <h3 className="font-bold text-lg text-[#18352A]">Edit Data Siswa</h3>
                <p className="text-xs text-[#74857B]">
                  UID: <span className="font-mono">{editingStudent.uid}</span>
                </p>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-lg text-[#74857B] hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 text-[#E05252] text-xs">{formError}</div>
              )}

              <div>
                <label className="text-xs font-bold text-[#18352A] block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#18352A] block mb-1">Kelas</label>
                <input
                  type="text"
                  required
                  value={formKelas}
                  onChange={(e) => setFormKelas(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#18352A] block mb-1">Status Akun</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F] bg-white"
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = editingStudent;
                    setEditingStudent(null);
                    if (target) setDeleteTargetStudent(target);
                  }}
                  className="text-xs font-semibold text-[#E05252] hover:underline flex items-center gap-1 py-2 px-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Data</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-[#74857B] hover:bg-gray-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-[#35C96F] hover:bg-[#159447] text-white text-sm font-bold shadow-xs transition-all"
                  >
                    {submitting ? 'Menyimpan...' : 'Perbarui Data'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Manage Action Modal */}
      {deleteTargetStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#E5EEE7] relative animate-fadeIn space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5EEE7]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-[#E05252] border border-red-100 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#18352A]">Kelola / Hapus Siswa</h3>
                  <p className="text-xs text-[#74857B]">Pilih opsi tindakan akun siswa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTargetStudent(null)}
                className="p-1 rounded-lg text-[#74857B] hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Info Card */}
            <div className="bg-[#F7FBF7] p-3.5 rounded-2xl border border-[#E5EEE7] text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[#74857B]">Nama Siswa:</span>
                <span className="font-bold text-sm text-[#18352A] capitalize">
                  {deleteTargetStudent.nama}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#74857B]">Kelas:</span>
                <span className="font-semibold text-[#18352A]">Kelas {deleteTargetStudent.kelas}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#74857B]">UID Kartu:</span>
                <span className="font-mono font-bold text-[#18352A]">{deleteTargetStudent.uid}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#74857B]">Saldo Poin:</span>
                <span className="font-extrabold text-sm text-[#159447]">
                  Rp{deleteTargetStudent.poin.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-[#E5EEE7]">
                <span className="text-[#74857B]">Status Akun:</span>
                <span
                  className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                    (deleteTargetStudent.status || 'aktif') === 'aktif'
                      ? 'bg-[#E8F9EE] text-[#159447]'
                      : 'bg-gray-100 text-[#74857B]'
                  }`}
                >
                  {(deleteTargetStudent.status || 'aktif') === 'aktif' ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>

            {/* Two Action Choices */}
            <div className="space-y-2 pt-1">
              {/* Option 1: Toggle Nonaktifkan / Aktifkan */}
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleToggleStatus(deleteTargetStudent)}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 active:scale-98 ${
                  (deleteTargetStudent.status || 'aktif') === 'aktif'
                    ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/70 text-amber-900'
                    : 'bg-[#E8F9EE] border-[#35C96F]/30 hover:bg-[#35C96F]/10 text-[#159447]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {(deleteTargetStudent.status || 'aktif') === 'aktif' ? (
                    <UserX className="w-5 h-5 text-amber-700 shrink-0" />
                  ) : (
                    <UserCheck className="w-5 h-5 text-[#159447] shrink-0" />
                  )}
                  <div>
                    <p className="font-bold text-xs">
                      {(deleteTargetStudent.status || 'aktif') === 'aktif'
                        ? 'Nonaktifkan Akun Siswa'
                        : 'Aktifkan Kembali Akun Siswa'}
                    </p>
                    <p className="text-[11px] text-[#74857B] mt-0.5">
                      {(deleteTargetStudent.status || 'aktif') === 'aktif'
                        ? 'Data tetap ada, tetapi kartu tidak bisa transaksi di kasir.'
                        : 'Akun kembali aktif dan kartu dapat bertransaksi.'}
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 2: Hapus Data Permanen */}
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleDeletePermanent(deleteTargetStudent)}
                className="w-full p-3 rounded-xl border border-red-200 bg-red-50/80 hover:bg-red-100 text-[#E05252] text-left transition-all flex items-center justify-between gap-3 active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <Trash2 className="w-5 h-5 text-[#E05252] shrink-0" />
                  <div>
                    <p className="font-bold text-xs text-[#E05252]">Hapus Data Permanen</p>
                    <p className="text-[11px] text-red-600/80 mt-0.5">
                      Hapus seluruh data siswa dari database Firebase secara permanen.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setDeleteTargetStudent(null)}
                className="w-full py-2.5 rounded-xl border border-[#E5EEE7] text-xs font-semibold text-[#74857B] hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
