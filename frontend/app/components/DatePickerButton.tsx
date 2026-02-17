'use client'

import { useState, useRef } from 'react'
import DatePickerPopover from './DatePickerPopover'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function DatePickerButton({ value, onChange, placeholder = 'Chọn ngày', className = '', disabled = false }: Props) {
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const datePickerAnchorRef = useRef<HTMLDivElement>(null)

  return (
    <div className="relative" ref={datePickerAnchorRef}>
      <button
        type="button"
        onClick={() => !disabled && setDatePickerOpen((v) => !v)}
        disabled={disabled}
        className={`flex items-center gap-2 w-full h-[42px] rounded-lg bg-slate-50 border border-slate-200 px-3 text-left hover:bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`.trim()}
      >
        {value ? (
          <span className="text-sm text-slate-900 truncate min-w-0 flex-1">
            {new Date(value + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
        ) : (
          <span className="text-sm text-slate-400 truncate min-w-0 flex-1">{placeholder}</span>
        )}
      </button>
      {datePickerOpen && !disabled && (
        <DatePickerPopover
          value={value}
          onChange={(v) => {
            onChange(v)
            setDatePickerOpen(false)
          }}
          onClose={() => setDatePickerOpen(false)}
          anchorRef={datePickerAnchorRef}
        />
      )}
    </div>
  )
}
