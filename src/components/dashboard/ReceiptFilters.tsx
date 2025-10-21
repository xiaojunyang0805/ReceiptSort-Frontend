'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { ReceiptCategory } from '@/types/receipt'
import { useTranslations } from 'next-intl'

const CATEGORIES: ReceiptCategory[] = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Office Supplies',
  'Travel',
  'Entertainment',
  'Utilities',
  'Healthcare',
  'Other',
]

const STATUSES = [
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
]

export interface ReceiptFiltersState {
  dateFrom: Date | undefined
  dateTo: Date | undefined
  categories: string[]
  statuses: string[]
  searchQuery: string
  amountMin: string
  amountMax: string
}

interface ReceiptFiltersProps {
  filters: ReceiptFiltersState
  onFiltersChange: (filters: ReceiptFiltersState) => void
  onApply: () => void
  onClear: () => void
}

export default function ReceiptFilters({
  filters,
  onFiltersChange,
  onApply,
  onClear,
}: ReceiptFiltersProps) {
  const t = useTranslations('dashboard.receiptsPage')
  const tCategories = useTranslations('receiptDetails.categories')
  const tTable = useTranslations('dashboard.receiptsTable')
  const [isExpanded, setIsExpanded] = useState(false)

  const activeFilterCount =
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    filters.categories.length +
    filters.statuses.length +
    (filters.searchQuery ? 1 : 0) +
    (filters.amountMin ? 1 : 0) +
    (filters.amountMax ? 1 : 0)

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category]
    onFiltersChange({ ...filters, categories: newCategories })
  }

  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status]
    onFiltersChange({ ...filters, statuses: newStatuses })
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <h3 className="font-medium">{t('filters')}</h3>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount}</Badge>
            )}
          </div>
          <div className="flex gap-2">
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onClear}>
                <X className="h-4 w-4 mr-1" />
                {t('filterPanel.clear')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? t('filterPanel.hide') : t('show')}
            </Button>
          </div>
        </div>

        {/* Filters Content */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Search */}
            <div className="space-y-2">
              <Label>{t('filterPanel.search')}</Label>
              <Input
                placeholder={t('filterPanel.searchPlaceholder')}
                value={filters.searchQuery}
                onChange={(e) =>
                  onFiltersChange({ ...filters, searchQuery: e.target.value })
                }
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('filterPanel.fromDate')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? (
                        format(filters.dateFrom, 'PPP')
                      ) : (
                        <span className="text-muted-foreground">{t('filterPanel.pickDate')}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) =>
                        onFiltersChange({ ...filters, dateFrom: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>{t('filterPanel.toDate')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? (
                        format(filters.dateTo, 'PPP')
                      ) : (
                        <span className="text-muted-foreground">{t('filterPanel.pickDate')}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) =>
                        onFiltersChange({ ...filters, dateTo: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Amount Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('filterPanel.minAmount')}</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={filters.amountMin}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, amountMin: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{t('filterPanel.maxAmount')}</Label>
                <Input
                  type="number"
                  placeholder="1000.00"
                  value={filters.amountMax}
                  onChange={(e) =>
                    onFiltersChange({ ...filters, amountMax: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <Label>{t('filterPanel.categories')}</Label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${category}`}
                      checked={filters.categories.includes(category)}
                      onCheckedChange={() => handleCategoryToggle(category)}
                    />
                    <label
                      htmlFor={`cat-${category}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {category === 'Food & Dining' ? tCategories('foodDining') :
                       category === 'Office Supplies' ? tCategories('officeSupplies') :
                       category === 'Transportation' ? tCategories('transportation') :
                       category === 'Shopping' ? tCategories('shopping') :
                       category === 'Travel' ? tCategories('travel') :
                       category === 'Entertainment' ? tCategories('entertainment') :
                       category === 'Utilities' ? tCategories('utilities') :
                       category === 'Healthcare' ? tCategories('healthcare') :
                       tCategories('other')}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>{t('filterPanel.status')}</Label>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map((status) => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status.value}`}
                      checked={filters.statuses.includes(status.value)}
                      onCheckedChange={() => handleStatusToggle(status.value)}
                    />
                    <label
                      htmlFor={`status-${status.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {tTable(`status.${status.value}`)}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Apply Button */}
            <Button onClick={onApply} className="w-full">
              <Filter className="mr-2 h-4 w-4" />
              {t('filterPanel.applyFilters')}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

export const INITIAL_FILTERS: ReceiptFiltersState = {
  dateFrom: undefined,
  dateTo: undefined,
  categories: [],
  statuses: [],
  searchQuery: '',
  amountMin: '',
  amountMax: '',
}
