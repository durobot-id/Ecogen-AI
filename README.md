# EcoGen AI — Progressive Web Application (PWA)

> Aplikasi Pengelolaan EcoPoint Siswa, Transaksi Pembayaran Kasir via Kartu RFID, dan Rekomendasi Strategi Penghargaan Positif Menggunakan Google Gemini AI.

---

## 🌿 Ringkasan Fitur

1. **Autentikasi PIN & Keamanan Sesi:**
   - **Kasir:** PIN `1234`
   - **Admin:** PIN `4321`
   - Keypad angka virtual bawaan (mencegah munculnya keyboard native perangkat).
   - Indikator 4 digit bullet (`● ● ● ●`).
   - Verifikasi server-side dengan JWT HttpOnly cookie dan proteksi brute force (lockout otomatis).

2. **Terminal Kasir (Mobile-First):**
   - Keypad nominal transaksi internal dengan pemisah ribuan otomatis (`Rp 5.000`).
   - Tombol shortcut cepat nominal (2k, 5k, 10k, 20k).
   - Deteksi otomatis kartu RFID dari node Firebase `/Proses` dengan validasi jendela waktu (maksimal 60 detik).
   - Validasi saldo siswa pada node `/Siwa` (mencegah saldo negatif).
   - Pemotongan poin atomik dan pencatatan audit trail pada `/Transaksi`.
   - Cetak struk transaksi dengan modal struk interaktif dan animasi selebrasi.
   - Fitur **Simulasi Tap Kartu** untuk pengujian langsung tanpa perlu alat scanner fisik.

3. **Dashboard Admin:**
   - **Statistik Utama:** Total siswa, total saldo poin beredar, total poin diberikan, total poin digunakan kasir, dan volume transaksi.
   - **Peringkat Siswa (Leaderboard):** Daftar 5 siswa dengan EcoPoint tertinggi.
   - **Kelola Data Siswa:** Pencarian nama/UID, filter kelas dan status, penambahan siswa baru, pengeditan, serta penonaktifan siswa.
   - **Kelola Poin:** Wizard Top Up poin dengan preview saldo langsung & penyesuaian manual (pengurangan) wajib menyertakan alasan.
   - **Riwayat Transaksi:** Filter jenis transaksi, pencarian, modal detail struk, dan ekspor data ke format **CSV**.
   - **AI Strategi EcoPoint (Gemini):** Konsultan AI untuk merumuskan reward aktivitas positif siswa, tingkat kesulitan, dampak lingkungan, dan tips implementasi sekolah.
   - **Pengaturan & Diagnostik:** Pengujian koneksi langsung ke Firebase RTDB dan pengujian hardware simulator.

4. **Progressive Web App (PWA):**
   - Mendukung instalasi di perangkat mobile (Android/iOS) dan desktop browser.
   - Service worker aktif untuk caching aset statis dan deteksi koneksi offline (transaksi dinonaktifkan otomatis saat offline demi integritas saldo).

---

## 🛠️ Persyaratan Sistem & Dependensi

- **Node.js:** v18+ atau v20+
- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS (Fresh Green Palette)
- **Database:** Firebase Realtime Database
- **AI Provider:** Google Gemini API (`gemini-2.5-flash`)
- **Icons:** Lucide Icons (Strict SVG)

---

## 🚀 Panduan Menjalankan Secara Lokal

1. Buka terminal pada folder proyek:
   ```bash
   cd D:\proyek\Ecogen-website
   ```

2. Jalankan development server:
   ```bash
   npm run dev
   ```

3. Buka browser di [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Konfigurasi Environment Variables (`.env.local`)

Salin berkas `.env.example` ke `.env.local` dan sesuaikan nilainya:

```env
# Firebase Realtime Database
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://ecopoint-database-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ecopoint-database
FIREBASE_DATABASE_URL=https://ecopoint-database-default-rtdb.asia-southeast1.firebasedatabase.app

# Google Gemini AI (Opsional: Jika kosong, aplikasi menggunakan template preset teruji)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Kredensial PIN Awal
KASIR_PIN=1234
ADMIN_PIN=4321

# Keamanan Sesi
JWT_SECRET=ecogen-super-secure-secret-key-2026-xyz
```

---

## 📦 Struktur Database Firebase Realtime Database

- `/Proses`: Data tap kartu RFID yang masuk dari perangkat scanner ESP8266/ESP32.
  ```json
  {
    "2026-11-09_19-56-09": {
      "UID": "CB69FD2F",
      "createdAt": 1794221769000,
      "status": "pending"
    }
  }
  ```
- `/Siwa`: Data siswa dan saldo poin (kompatibel dengan format database yang sudah berjalan).
  ```json
  {
    "CB69FD2F": {
      "nama": "arya",
      "kelas": "7A",
      "poin": 15000,
      "status": "aktif"
    }
  }
  ```
- `/Transaksi`: Catatan mutasi saldo dan riwayat transaksi.

---

## ☁️ Deployment ke Vercel

1. Push folder proyek ke repositori GitHub Anda.
2. Buka dashboard [Vercel](https://vercel.com/) dan import repositori.
3. Masukkan Environment Variables di atas pada menu Settings > Environment Variables Vercel.
4. Klik **Deploy**.
