'use client';

import { useState, useMemo } from 'react';
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

  // Form states
  const [formUid, setFormUid] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formKelas, setFormKelas] = useState('');
  const [formPoin, setFormPoin] = useState('0');
  const [formStatus, setFormStatus] = useState<'aktif' | 'nonaktif'>('aktif');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleDelete = async (student: Student) => {
    const isPermanent = confirm(
      `Apakah Anda yakin ingin menonaktifkan siswa ${student.nama} (${student.uid})?\n(Klik Batal jika tidak sengaja)`
    );
    if (!isPermanent) return;

    try {
      const res = await fetch(`/api/students/${student.uid}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
      } else {
        alert(data.message || 'Gagal menonaktifkan siswa.');
      }
    } catch (e) {
      console.error(e);
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
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                            (st.status || 'aktif') === 'aktif'
                              ? 'bg-[#E8F9EE] text-[#159447]'
                              : 'bg-gray-100 text-[#74857B]'
                          }`}
                        >
                          {(st.status || 'aktif') === 'aktif' ? 'Aktif' : 'Nonaktif'}
                        </span>
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
                            onClick={() => handleDelete(st)}
                            className="p-1.5 rounded-lg text-[#74857B] hover:text-[#E05252] hover:bg-red-50 transition-colors"
                            title="Nonaktifkan Siswa"
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
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        (st.status || 'aktif') === 'aktif'
                          ? 'bg-[#E8F9EE] text-[#159447]'
                          : 'bg-gray-100 text-[#74857B]'
                      }`}
                    >
                      {(st.status || 'aktif') === 'aktif' ? 'Aktif' : 'Nonaktif'}
                    </span>

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
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(st)}
                        className="p-1.5 rounded-lg text-[#E05252] hover:bg-red-50"
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
                <div className="p-3 rounded-xl bg-red-50 text-[#E05252] text-xs">{formError}</div>
              )}

              <div>
                <label className="text-xs font-bold text-[#18352A] block mb-1">
                  UID Kartu RFID (Hex) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 6A605D83"
                  value={formUid}
                  onChange={(e) => setFormUid(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5EEE7] focus:outline-none focus:border-[#35C96F] font-mono"
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

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#74857B] hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#35C96F] hover:bg-[#159447] text-white text-sm font-bold shadow-xs transition-all"
                >
                  {submitting ? 'Menyimpan...' : 'Perbarui Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
