'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download } from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  startOfQuarter,
  endOfQuarter,
} from 'date-fns'

interface ExportPresetsProps {
  onExport: (dateFrom: Date, dateTo: Date, label: string) => void
  isExporting: boolean
}

export default function ExportPresets({ onExport, isExporting }: ExportPresetsProps) {
  const now = new Date()

  const presets = [
    {
      label: 'This Month',
      dateFrom: startOfMonth(now),
      dateTo: endOfMonth(now),
    },
    {
      label: 'Last Month',
      dateFrom: startOfMonth(subMonths(now, 1)),
      dateTo: endOfMonth(subMonths(now, 1)),
    },
    {
      label: 'This Year',
      dateFrom: startOfYear(now),
      dateTo: endOfYear(now),
    },
    {
      label: 'Q1',
      dateFrom: startOfQuarter(new Date(now.getFullYear(), 0, 1)),
      dateTo: endOfQuarter(new Date(now.getFullYear(), 0, 1)),
    },
    {
      label: 'Q2',
      dateFrom: startOfQuarter(new Date(now.getFullYear(), 3, 1)),
      dateTo: endOfQuarter(new Date(now.getFullYear(), 3, 1)),
    },
    {
      label: 'Q3',
      dateFrom: startOfQuarter(new Date(now.getFullYear(), 6, 1)),
      dateTo: endOfQuarter(new Date(now.getFullYear(), 6, 1)),
    },
    {
      label: 'Q4',
      dateFrom: startOfQuarter(new Date(now.getFullYear(), 9, 1)),
      dateTo: endOfQuarter(new Date(now.getFullYear(), 9, 1)),
    },
  ]

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          <h3 className="font-medium">Quick Export</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => onExport(preset.dateFrom, preset.dateTo, preset.label)}
              disabled={isExporting}
            >
              {preset.label}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport(new Date(0), new Date(), 'All Time')}
            disabled={isExporting}
          >
            All Time
          </Button>
        </div>
      </div>
    </Card>
  )
}
