'use client';

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-[#E05252] text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Koneksi terputus. Anda sedang offline — Transaksi pemotongan poin dinonaktifkan.</span>
    </div>
  );
}
