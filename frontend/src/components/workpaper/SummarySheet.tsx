import { Calculator, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react'
import type { Sheet, SheetField } from '@/lib/types'
import { Input, Textarea } from '@/components/ui/Input'
import { cn, formatMoney } from '@/lib/utils'
import { computeSummaryField } from './sheet-utils'

interface Props {
  sheet: Sheet
  allSheetData: Record<string, any>
  onChangeField: (fieldCode: string, value: any) => void
}

export function SummarySheet({ sheet, allSheetData, onChangeField }: Props) {
  const sd = allSheetData?.[sheet.code] || {}
  const fields = sheet.fields || []

  // Group fields: computed totals at top (bordered card), free-form fields below.
  const computed = fields.filter((f) => f.computed)
  const free = fields.filter((f) => !f.computed)

  return (
    <div className="space-y-4">
      {sheet.description && (
        <div className="text-xs text-slate-500 italic">{sheet.description}</div>
      )}

      {computed.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-200 bg-slate-50/80 flex items-center gap-2">
            <Calculator size={12} className="text-slate-500" />
            <span className="text-xs font-semibold text-slate-700">自动计算</span>
            <span className="text-[10px] text-slate-400 ml-auto">公式从其他子表汇总</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-slate-100">
            {computed.map((f) => (
              <ComputedCell key={f.code} field={f} allSheetData={allSheetData} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {free.map((f) => (
          <FreeField
            key={f.code}
            field={f}
            value={sd[f.code]}
            wide={f.type === 'text'}
            onSave={(v) => onChangeField(f.code, v)}
          />
        ))}
      </div>
    </div>
  )
}

function ComputedCell({
  field, allSheetData,
}: { field: SheetField; allSheetData: Record<string, any> }) {
  const v = computeSummaryField(field, allSheetData)
  const num = typeof v === 'number' ? v : null
  // Reconciliation hint for diff fields
  let tone: 'ok' | 'warn' | 'neutral' = 'neutral'
  if (field.code === 'bank_diff' || field.code === 'tb_diff') {
    tone = num != null && Math.abs(num) < 0.01 ? 'ok' : Math.abs(num ?? 0) > 1 ? 'warn' : 'neutral'
  }
  return (
    <div className="p-3 bg-white">
      <div className="text-[10px] text-slate-500 flex items-center gap-1">
        {field.label}
        {tone === 'ok' && <CheckCircle2 size={10} className="text-emerald-500" />}
        {tone === 'warn' && <AlertTriangle size={10} className="text-amber-500" />}
      </div>
      <div className={cn(
        'text-base font-semibold tabular-nums mt-0.5',
        tone === 'ok' && 'text-emerald-700',
        tone === 'warn' && 'text-amber-700',
        tone === 'neutral' && 'text-slate-900',
      )}>
        {num != null ? formatMoney(num) : '—'}
      </div>
      {field.formula && (
        <div className="text-[10px] text-slate-400 font-mono mt-1 truncate" title={field.formula}>
          ƒ {field.formula}
        </div>
      )}
    </div>
  )
}

function FreeField({
  field, value, wide, onSave,
}: { field: SheetField; value: any; wide?: boolean; onSave: (v: any) => void }) {
  const empty = value === null || value === undefined || value === ''
  return (
    <div className={cn(wide && 'col-span-2')}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="text-xs font-medium text-slate-700">{field.label}</label>
        {!empty && (
          <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
            <Sparkles size={9} /> AI 已填
          </span>
        )}
      </div>
      {field.type === 'text' ? (
        <Textarea
          defaultValue={value ?? ''}
          rows={3}
          onBlur={(e) => onSave(e.target.value)}
        />
      ) : field.type === 'money' || field.type === 'number' ? (
        <Input
          type="number" step="0.01"
          defaultValue={value ?? ''}
          onBlur={(e) => onSave(e.target.value ? Number(e.target.value) : null)}
        />
      ) : (
        <Input
          defaultValue={value ?? ''}
          onBlur={(e) => onSave(e.target.value)}
        />
      )}
      {field.type === 'money' && !empty && (
        <div className="text-[11px] text-slate-500 mt-1">{formatMoney(Number(value))}</div>
      )}
    </div>
  )
}
