import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import {
  ClipboardList, Sparkles, Scale, AlertTriangle, Building2,
  CheckCircle2, FileSpreadsheet,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import ChatPanel from '@/components/agent/ChatPanel'
import { SheetTabs } from '@/components/workpaper/SheetTabs'
import { SummarySheet } from '@/components/workpaper/SummarySheet'
import { TableSheet } from '@/components/workpaper/TableSheet'
import {
  computeSummaryField, sheetAnomalyCount, sheetRowCount, isSheetFilled,
} from '@/components/workpaper/sheet-utils'
import type { Sheet } from '@/lib/types'
import { cn, formatMoney } from '@/lib/utils'

const FILL_AGENT = 'cash_paper_fill'

export default function WorkingPaperWorkbench() {
  const { paperId } = useParams()
  const nav = useNavigate()
  const qc = useQueryClient()

  const { data: papers = [] } = useQuery({
    queryKey: ['objects', 'WorkingPaper'],
    queryFn: () => api.listObjects('WorkingPaper'),
  })
  const { data: engagements = [] } = useQuery({
    queryKey: ['objects', 'Engagement'],
    queryFn: () => api.listObjects('Engagement'),
  })
  const { data: templates = [] } = useQuery({
    queryKey: ['objects', 'PaperTemplate'],
    queryFn: () => api.listObjects('PaperTemplate'),
  })
  const { data: rules = [] } = useQuery({
    queryKey: ['objects', 'AuditRule'],
    queryFn: () => api.listObjects('AuditRule'),
  })
  const { data: anomalies = [] } = useQuery({
    queryKey: ['objects', 'Anomaly'],
    queryFn: () => api.listObjects('Anomaly'),
  })

  const activeId = paperId ? Number(paperId) : papers[0]?.id

  useEffect(() => {
    if (!paperId && papers[0]) nav(`/workbench/${papers[0].id}`, { replace: true })
  }, [paperId, papers, nav])

  const { data: paperDetail } = useQuery({
    queryKey: ['object', activeId],
    queryFn: () => api.getObject(activeId!),
    enabled: !!activeId,
  })

  const paper = paperDetail?.object
  const template = useMemo(
    () => templates.find((t) => (t.data?.code as string) === paper?.data?.template_code),
    [templates, paper],
  )
  const sheets: Sheet[] = useMemo(
    () => ((template?.data as any)?.sheets as Sheet[]) || [],
    [template],
  )
  const sheetData = (paper?.data as any)?.sheet_data || {}

  const [activeSheet, setActiveSheet] = useState<string>('')
  useEffect(() => {
    if (sheets.length > 0 && !sheets.find((s) => s.code === activeSheet)) {
      setActiveSheet(sheets[0].code)
    }
  }, [sheets, activeSheet])

  const ruleCodes = ((template?.data as any)?.default_rules as string[]) || []
  const paperAnomalies = anomalies.filter((a) => Number((a.data as any)?.paper_id) === paper?.id)

  const rowCountMap: Record<string, number> = {}
  const anomalyCountMap: Record<string, number> = {}
  const filledMap: Record<string, boolean> = {}
  for (const s of sheets) {
    const sd = sheetData[s.code]
    rowCountMap[s.code] = sheetRowCount(s, sd)
    anomalyCountMap[s.code] = sheetAnomalyCount(s.code, sd)
    filledMap[s.code] = isSheetFilled(s, sd)
  }
  const totalAnomalies = Object.values(anomalyCountMap).reduce((a, b) => a + b, 0)
  const allFilled = sheets.every((s) => filledMap[s.code])

  const summarySheet = sheets.find((s) => s.kind === 'summary')
  const tbDiff = summarySheet
    ? computeSummaryField(
        summarySheet.fields?.find((f) => f.code === 'tb_diff')!,
        sheetData,
      )
    : null
  const balanceTotal = summarySheet
    ? computeSummaryField(
        summarySheet.fields?.find((f) => f.code === 'book_balance_total')!,
        sheetData,
      )
    : null

  function statusTone(s: string) {
    return s === '已完成' ? 'green' : s === '复核中' ? 'sky' : s === 'AI 初稿' ? 'brand' : 'neutral'
  }

  function papersByEngagement(): Record<string, typeof papers> {
    const groups: Record<string, typeof papers> = {}
    for (const p of papers) {
      const ec = ((p.data as any)?.engagement_code as string) || '其他'
      groups[ec] = groups[ec] || []
      groups[ec].push(p)
    }
    return groups
  }

  const engByCode = (code: string) =>
    engagements.find((e) => (e.data as any)?.code === code)?.display_name || code

  async function savePaperField(path: string, value: any) {
    if (!paper) return
    const next = { ...(paper.data as any) }
    if (path.includes('.')) {
      const [a, b] = path.split('.')
      next[a] = { ...(next[a] || {}), [b]: value }
    } else {
      next[path] = value
    }
    await api.patchObject(paper.id, { data: next })
    qc.invalidateQueries({ queryKey: ['object', paper.id] })
  }

  async function saveSheetField(sheetCode: string, fieldCode: string, value: any) {
    if (!paper) return
    const sd = { ...(((paper.data as any)?.sheet_data) || {}) }
    const cur = { ...(sd[sheetCode] || {}) }
    cur[fieldCode] = value
    sd[sheetCode] = cur
    await api.patchObject(paper.id, { data: { sheet_data: sd } })
    qc.invalidateQueries({ queryKey: ['object', paper.id] })
  }

  async function saveSheetRows(sheetCode: string, rows: any[]) {
    if (!paper) return
    const sd = { ...(((paper.data as any)?.sheet_data) || {}) }
    sd[sheetCode] = { ...(sd[sheetCode] || {}), rows }
    await api.patchObject(paper.id, { data: { sheet_data: sd } })
    qc.invalidateQueries({ queryKey: ['object', paper.id] })
  }

  return (
    <div className="h-full flex">
      {/* Left: WP tree */}
      <div className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-4 pt-5 pb-4 border-b border-slate-100">
          <div className="text-xs text-slate-500 mb-1">底稿工作台 · Working Paper</div>
          <div className="text-lg font-semibold text-slate-900">我的底稿</div>
        </div>
        <div className="flex-1 overflow-y-auto py-2 space-y-3">
          {Object.entries(papersByEngagement()).map(([engCode, list]) => (
            <div key={engCode}>
              <div className="px-4 text-[11px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                <Building2 size={11} />
                {engByCode(engCode)}
              </div>
              {list.map((p) => (
                <button
                  key={p.id}
                  onClick={() => nav(`/workbench/${p.id}`)}
                  className={cn(
                    'w-full text-left px-4 py-2 flex items-start gap-2.5 text-sm transition-colors',
                    p.id === activeId ? 'bg-brand-50' : 'hover:bg-slate-50',
                  )}
                >
                  <ClipboardList size={14} className={p.id === activeId ? 'text-brand-700 mt-0.5' : 'text-slate-400 mt-0.5'} />
                  <div className="flex-1 min-w-0">
                    <div className={cn('truncate font-medium', p.id === activeId ? 'text-brand-900' : 'text-slate-800')}>
                      {p.display_name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">
                      {(p.data as any)?.code || '—'}
                    </div>
                  </div>
                  <Badge tone={statusTone((p.data as any)?.status) as any}>
                    {(p.data as any)?.status || '—'}
                  </Badge>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Center: paper workbook */}
      <div className="flex-1 overflow-y-auto bg-slate-50/40">
        {paper ? (
          <div className="max-w-5xl mx-auto px-6 py-5 space-y-4">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-brand-600 text-white grid place-items-center shrink-0">
                <FileSpreadsheet size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-semibold text-slate-900">{paper.display_name}</h1>
                  <span className="font-mono text-xs text-slate-500">{(paper.data as any)?.code}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>模板：{template?.display_name || (paper.data as any)?.template_code || '—'}</span>
                  <span>·</span>
                  <span>项目：{engByCode((paper.data as any)?.engagement_code || '—')}</span>
                  <span>·</span>
                  <span>{sheets.length} 个子表</span>
                </div>
              </div>
              <Badge tone={statusTone((paper.data as any)?.status) as any} className="!h-7 px-3">
                {(paper.data as any)?.status || '—'}
              </Badge>
            </div>

            {/* AI fill CTA + reconciliation banner */}
            {!allFilled && (
              <Card className="p-4 bg-gradient-to-br from-brand-50/60 to-white border-brand-200/60">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-brand-600 text-white grid place-items-center">
                    <Sparkles size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">让 AI 填写整本工作底稿</div>
                    <div className="text-xs text-slate-500">
                      智能体将依次读取试算平衡表 + 凭证，逐子表填写 {sheets.length} 个 sheet，再应用 {ruleCodes.length} 条审计规则。
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => window.dispatchEvent(new CustomEvent('chat:submit', {
                      detail: '请基于试算平衡表帮我完成 A1 货币资金底稿全部子表，并应用所有默认规则。',
                    }))}
                  >
                    <Sparkles size={14} /> AI 填写全表
                  </Button>
                </div>
              </Card>
            )}

            {allFilled && (
              <ReconciliationBanner
                tbDiff={typeof tbDiff === 'number' ? tbDiff : null}
                total={typeof balanceTotal === 'number' ? balanceTotal : null}
                anomalies={totalAnomalies}
              />
            )}

            {/* Workbook */}
            <div>
              <SheetTabs
                sheets={sheets}
                active={activeSheet}
                onSelect={setActiveSheet}
                rowCount={rowCountMap}
                anomalyCount={anomalyCountMap}
                filledMap={filledMap}
              />
              <Card className="!rounded-t-none border-t-0 p-5 min-h-[420px]">
                {sheets.length === 0 && (
                  <div className="text-center text-sm text-slate-500 py-10">此模板尚未配置子表结构</div>
                )}
                {sheets.map((s) => {
                  if (s.code !== activeSheet) return null
                  if (s.kind === 'summary') {
                    return (
                      <SummarySheet
                        key={s.code}
                        sheet={s}
                        allSheetData={sheetData}
                        onChangeField={(fc, v) => saveSheetField(s.code, fc, v)}
                      />
                    )
                  }
                  return (
                    <TableSheet
                      key={s.code}
                      sheet={s}
                      rows={sheetData[s.code]?.rows || []}
                      onChangeRows={(rows) => saveSheetRows(s.code, rows)}
                    />
                  )
                })}
              </Card>
            </div>

            {/* Rules + anomalies (consolidated below the workbook) */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center">
                  <Scale size={13} className="text-slate-500 mr-2" />
                  <div className="text-xs font-semibold text-slate-700">默认审计规则</div>
                  <Badge tone="neutral" className="ml-2">{ruleCodes.length}</Badge>
                </div>
                <div className="divide-y divide-slate-100">
                  {ruleCodes.map((rc) => {
                    const r = rules.find((x) => (x.data as any)?.code === rc)
                    return (
                      <div key={rc} className="px-4 py-2 text-xs flex items-center gap-2">
                        <Scale size={11} className="text-slate-400" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-800 truncate">{r?.display_name || rc}</div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">{rc}</div>
                        </div>
                        <Badge tone={(r?.data as any)?.severity === 'high' ? 'rose' : (r?.data as any)?.severity === 'medium' ? 'amber' : 'neutral'}>
                          {(r?.data as any)?.severity || '—'}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </Card>

              <Card>
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center">
                  <AlertTriangle size={13} className="text-amber-500 mr-2" />
                  <div className="text-xs font-semibold text-slate-700">规则触发的异常</div>
                  <Badge tone="neutral" className="ml-2">{paperAnomalies.length}</Badge>
                </div>
                <div className="divide-y divide-slate-100">
                  {paperAnomalies.length === 0 ? (
                    <div className="px-4 py-5 text-xs text-slate-500 text-center">规则触发未发现异常 ✓</div>
                  ) : (
                    paperAnomalies.map((a) => (
                      <div key={a.id} className="px-4 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={11} className="text-amber-500" />
                          <div className="font-medium text-slate-800">{a.display_name}</div>
                          <Badge tone="rose" className="ml-auto">{(a.data as any)?.severity}</Badge>
                        </div>
                        <div className="mt-0.5 text-[11px] text-slate-500">{(a.data as any)?.detail}</div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <div className="h-full grid place-items-center text-slate-500">请选择一份底稿</div>
        )}
      </div>

      {/* Right: chat panel */}
      <div className="w-[400px] shrink-0 border-l border-slate-200 bg-slate-50/30 p-4">
        {paper && (
          <ChatPanel
            agentCode={FILL_AGENT}
            paperId={paper.id}
            suggested="请基于试算平衡表帮我完成 A1 货币资金底稿全部子表，并应用所有默认规则。"
            placeholder="对任何子表提问 / 让 AI 调整某一行…"
            onAfterRun={() => qc.invalidateQueries()}
            className="h-[calc(100vh-2rem)]"
          />
        )}
      </div>
    </div>
  )
}

function ReconciliationBanner({
  tbDiff, total, anomalies,
}: { tbDiff: number | null; total: number | null; anomalies: number }) {
  const balanced = tbDiff != null && Math.abs(tbDiff) < 0.01
  return (
    <Card className={cn(
      'p-3 flex items-center gap-3',
      balanced && anomalies === 0 && 'bg-emerald-50/60 border-emerald-200',
      balanced && anomalies > 0 && 'bg-amber-50/60 border-amber-200',
      !balanced && 'bg-rose-50/60 border-rose-200',
    )}>
      {balanced ? (
        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
      ) : (
        <AlertTriangle size={18} className="text-rose-600 shrink-0" />
      )}
      <div className="flex-1 text-xs">
        <div className="font-semibold text-slate-900">
          {balanced
            ? `主表合计 ${formatMoney(total)} = TB 余额 — 已平衡`
            : `账面 vs TB 差异 ${formatMoney(tbDiff)} — 待复核`}
        </div>
        <div className="text-slate-600 mt-0.5">
          {anomalies > 0
            ? `${anomalies} 行需要审计师复核（差异 / 跨期 / 异常标记）`
            : `所有子表数据通过自动校验`}
        </div>
      </div>
    </Card>
  )
}
