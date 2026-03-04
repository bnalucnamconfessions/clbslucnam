import { useState } from 'react'

interface QRScannerProps {
  onScan: (qrId: string) => void
  label?: string
}

export default function QRScanner({ onScan, label = 'Quét mã QR' }: QRScannerProps) {
  const [qrInput, setQrInput] = useState('')
  const [isScanning, setIsScanning] = useState(false)

  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // Chỉ cho phép số
    if (value.length <= 12) {
      setQrInput(value)
    }
  }

  const handleScan = () => {
    if (qrInput.length === 12) {
      onScan(qrInput)
      setQrInput('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && qrInput.length === 12) {
      handleScan()
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-slate-700 dark:text-[#92adc9]">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-2.5 text-slate-400 material-symbols-outlined text-[20px]">qr_code_scanner</span>
          <input
            type="text"
            value={qrInput}
            onChange={handleManualInput}
            onKeyPress={handleKeyPress}
            className="w-full rounded-lg bg-slate-50 dark:bg-[#1a2632] border border-slate-200 dark:border-[#233648] pl-10 pr-3 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-mono"
            placeholder="Nhập ID 12 chữ số hoặc quét mã QR"
            maxLength={12}
          />
        </div>
        <button
          onClick={handleScan}
          disabled={qrInput.length !== 12}
          className="px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: qrInput.length === 12 ? '#137fec' : '#94a3b8' }}
          type="button"
        >
          <span className="material-symbols-outlined">check</span>
        </button>
      </div>
      {qrInput.length > 0 && qrInput.length < 12 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Cần nhập đủ 12 chữ số ({qrInput.length}/12)
        </p>
      )}
    </div>
  )
}

