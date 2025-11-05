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
import { useTranslations } from 'next-intl'

interface ExportPresetsProps {
  onExport: (dateFrom: Date, dateTo: Date, label: string) => void
  isExporting: boolean
}

export default function ExportPresets({ onExport, isExporting }: ExportPresetsProps) {
  const t = useTranslations('dashboard.receiptsPage')
  const tPeriods = useTranslations('dashboard.timePeriods')
  const now = new Date()

  const presets = [
    {
      labelKey: 'thisMonth',
      dateFrom: startOfMonth(now),
      dateTo: endOfMonth(now),
    },
    {
      labelKey: 'lastMonth',
      dateFrom: startOfMonth(subMonths(now, 1)),
      dateTo: endOfMonth(subMonths(now, 1)),
    },
    {
      labelKey: 'thisYear',
      dateFrom: startOfYear(now),
      dateTo: endOfYear(now),
    },
    {
      labelKey: 'q1',
      dateFrom: startOfQuarter(new Date(now.getFullYear(), 0, 1)),
      dateTo: endOfQuarter(new Date(now.getFullYear(), 0, 1)),
    },
    {
      labelKey: 'q2',
      dateFrom: startOfQuarter(new Date(now.getFullYear(), 3, 1)),
      dateTo: endOfQuarter(new Date(now.getFullYear(), 3, 1)),
    },
    {
      labelKey: 'q3',
      dateFrom: startOfQuarter(new Date(now.getFullYear(), 6, 1)),
      dateTo: endOfQuarter(new Date(now.getFullYear(), 6, 1)),
    },
    {
      labelKey: 'q4',
      dateFrom: startOfQuarter(new Date(now.getFullYear(), 9, 1)),
      dateTo: endOfQuarter(new Date(now.getFullYear(), 9, 1)),
    },
  ]

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          <h3 className="font-medium">{t('quickExport')}</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {presets.map((preset) => {
            const label = preset.labelKey === 'thisMonth' ? tPeriods('thisMonth')
              : preset.labelKey === 'lastMonth' ? tPeriods('lastMonth')
              : preset.labelKey === 'thisYear' ? tPeriods('thisYear')
              : preset.labelKey === 'q1' ? tPeriods('q1')
              : preset.labelKey === 'q2' ? tPeriods('q2')
              : preset.labelKey === 'q3' ? tPeriods('q3')
              : tPeriods('q4')
            return (
              <Button
                key={preset.labelKey}
                variant="outline"
                size="sm"
                onClick={() => onExport(preset.dateFrom, preset.dateTo, label)}
                disabled={isExporting}
              >
                {label}
              </Button>
            )
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport(new Date(0), new Date(), tPeriods('allTime'))}
            disabled={isExporting}
          >
            {tPeriods('allTime')}
          </Button>
        </div>
      </div>
    </Card>
  )
}
