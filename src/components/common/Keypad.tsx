'use client';

import { Delete } from 'lucide-react';

interface KeypadProps {
  onDigit: (digit: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onShortcut?: (value: number) => void;
  showShortcuts?: boolean;
  disabled?: boolean;
}

export default function Keypad({
  onDigit,
  onClear,
  onBackspace,
  onShortcut,
  showShortcuts = false,
  disabled = false,
}: KeypadProps) {
  const digits = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];

  return (
    <div className="w-full max-w-sm mx-auto select-none space-y-2.5">
      {/* Quick Amount Shortcuts (optional for cashier) */}
      {showShortcuts && onShortcut && (
        <div className="grid grid-cols-4 gap-1.5 pb-1">
          {[2000, 5000, 10000, 20000].map((val) => (
            <button
              key={val}
              type="button"
              disabled={disabled}
              onClick={() => onShortcut(val)}
              className="py-1.5 text-xs font-semibold rounded-lg bg-[#E8F9EE] text-[#159447] border border-[#35C96F]/30 hover:bg-[#35C96F] hover:text-white active:scale-95 transition-all shadow-xs"
            >
              {val >= 1000 ? `${val / 1000}k` : val}
            </button>
          ))}
        </div>
      )}

      {/* Main 3x3 Keypad */}
      <div className="grid grid-cols-3 gap-2.5">
        {digits.map((row) =>
          row.map((d) => (
            <button
              key={d}
              type="button"
              disabled={disabled}
              onClick={() => onDigit(d)}
              className="h-14 sm:h-16 text-2xl font-bold rounded-2xl bg-white text-[#18352A] border border-[#E5EEE7] shadow-sm hover:border-[#35C96F] hover:bg-[#F7FBF7] active:bg-[#E8F9EE] active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
            >
              {d}
            </button>
          ))
        )}

        {/* Bottom row: C, 0, Backspace */}
        <button
          type="button"
          disabled={disabled}
          onClick={onClear}
          className="h-14 sm:h-16 text-lg font-bold rounded-2xl bg-red-50 text-[#E05252] border border-red-100 shadow-sm hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
          title="Hapus Semua"
        >
          C
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onDigit('0')}
          className="h-14 sm:h-16 text-2xl font-bold rounded-2xl bg-white text-[#18352A] border border-[#E5EEE7] shadow-sm hover:border-[#35C96F] hover:bg-[#F7FBF7] active:bg-[#E8F9EE] active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
        >
          0
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={onBackspace}
          className="h-14 sm:h-16 text-lg font-bold rounded-2xl bg-gray-50 text-[#74857B] border border-[#E5EEE7] shadow-sm hover:bg-gray-100 hover:text-[#18352A] active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
          title="Hapus Satu Digit"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
