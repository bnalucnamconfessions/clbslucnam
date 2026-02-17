'use client'

import { useState, useEffect, useRef } from 'react'

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const MONTHS = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseYYYYMMDD(s: string): Date | null {
  if (!s) return null
  const d = new Date(s + 'T00:00:00')
  return isNaN(d.getTime()) ? null : d
}

type Props = {
  value: string
  onChange: (value: string) => void
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement | null>
}

export default function DatePickerPopover({ value, onChange, onClose, anchorRef }: Props) {
  const [viewDate, setViewDate] = useState(() => {
    const parsed = parseYYYYMMDD(value)
    return parsed ? new Date(parsed) : new Date()
  })
  const today = toYYYYMMDD(new Date())
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const parsed = parseYYYYMMDD(value)
    if (parsed) setViewDate(new Date(parsed))
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose, anchorRef])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPadding = (firstDay.getDay() + 6) % 7
  const daysInMonth = lastDay.getDate()
  const prevMonth = new Date(year, month - 1)
  const prevMonthDays = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).getDate()
  const cells: { date: Date; isCurrentMonth: boolean; key: string }[] = []

  for (let i = 0; i < startPadding; i++) {
    const d = prevMonthDays - startPadding + i + 1
    cells.push({ date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), d), isCurrentMonth: false, key: `p-${d}` })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true, key: `c-${d}` })
  }
  const rest = 42 - cells.length
  for (let d = 1; d <= rest; d++) {
    cells.push({ date: new Date(year, month + 1, d), isCurrentMonth: false, key: `n-${d}` })
  }

  const handlePrev = () => setViewDate(new Date(year, month - 1))
  const handleNext = () => setViewDate(new Date(year, month + 1))
  const handleSelect = (d: Date) => onChange(toYYYYMMDD(d))
  const handleToday = () => {
    const d = new Date()
    setViewDate(d)
    onChange(toYYYYMMDD(d))
  }
  const handleClear = () => onChange('')

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 mt-2 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/50"
      style={{ top: '100%', left: 0, marginTop: '8px' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900">
          {MONTHS[month]} {year}
        </h3>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handlePrev}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Tháng trước"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Tháng sau"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-xs font-semibold text-slate-500 py-1">
            {w}
          </div>
        ))}
        {cells.map(({ date, isCurrentMonth, key }) => {
          const dateStr = toYYYYMMDD(date)
          const isSelected = value === dateStr
          const isToday = dateStr === today
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(date)}
              className={`
                h-9 rounded-xl text-sm font-medium transition-colors
                ${!isCurrentMonth ? 'text-slate-300' : 'text-slate-900'}
                ${isSelected ? 'bg-[#137fec] text-white shadow-md shadow-blue-500/30' : ''}
                ${!isSelected && isToday ? 'ring-2 ring-[#137fec] ring-offset-2 bg-blue-50/50 text-[#137fec]' : ''}
                ${!isSelected && !isToday && isCurrentMonth ? 'hover:bg-slate-100' : ''}
              `}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={handleClear}
          className="text-sm font-medium text-[#137fec] hover:text-[#0f6fd6] hover:underline"
        >
          Xóa
        </button>
        <button
          type="button"
          onClick={handleToday}
          className="text-sm font-medium text-[#137fec] hover:text-[#0f6fd6] hover:underline"
        >
          Hôm nay
        </button>
      </div>
    </div>
  )
}
