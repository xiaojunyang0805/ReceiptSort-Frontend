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
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
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
            <h3 className="font-medium">Filters</h3>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount}</Badge>
            )}
          </div>
          <div className="flex gap-2">
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onClear}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>

        {/* Filters Content */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Search */}
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Merchant name, amount..."
                value={filters.searchQuery}
                onChange={(e) =>
                  onFiltersChange({ ...filters, searchQuery: e.target.value })
                }
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
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
                        <span className="text-muted-foreground">Pick a date</span>
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
                <Label>To Date</Label>
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
                        <span className="text-muted-foreground">Pick a date</span>
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
                <Label>Min Amount</Label>
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
                <Label>Max Amount</Label>
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
              <Label>Categories</Label>
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
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
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
                      {status.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Apply Button */}
            <Button onClick={onApply} className="w-full">
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
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
