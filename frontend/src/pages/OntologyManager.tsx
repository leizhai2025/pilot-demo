import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Search, Plus, Eye, Database } from 'lucide-react'
import { api } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Icon } from '@/components/ui/Icon'
import LinkGraph from '@/components/ontology/LinkGraph'
import { cn } from '@/lib/utils'

export default function OntologyManager() {
  const { code } = useParams()
  const nav = useNavigate()

  const { data: types = [] } = useQuery({ queryKey: ['object-types'], queryFn: api.listObjectTypes })
  const { data: linkTypes = [] } = useQuery({ queryKey: ['link-types'], queryFn: api.listLinkTypes })
  const { data: actionTypes = [] } = useQuery({ queryKey: ['action-types'], queryFn: api.listActionTypes })

  const active = code ? types.find((t) => t.code === code) : types[0]
  const relatedLinks = active
    ? linkTypes.filter((l) => l.source_type_code === active.code || l.target_type_code === active.code)
    : []
  const relatedActions = active
    ? actionTypes.filter((a) => a.target_type_code === active.code)
    : []

  return (
    <div className="h-full flex">
      {/* Type list */}
      <div className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col">
        <div className="px-4 pt-5 pb-4 border-b border-slate-100">
          <div className="text-xs text-slate-500 mb-1">本体管理 · Ontology Manager</div>
          <div className="text-lg font-semibold text-slate-900">对象类型</div>
          <div className="relative mt-3">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="搜索对象类型…"
              className="w-full h-8 pl-8 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {types.map((t) => {
            const sel = active?.code === t.code
            return (
              <button
                key={t.code}
                onClick={() => nav(`/ontology/${t.code}`)}
                className={cn(
                  'w-full px-4 py-2 flex items-center gap-3 text-left text-sm transition-colors',
                  sel ? 'bg-brand-50 text-brand-900' : 'hover:bg-slate-50 text-slate-700',
                )}
              >
                <div
                  className="h-7 w-7 rounded-md grid place-items-center text-white shrink-0"
                  style={{ background: t.color }}
                >
                  <Icon name={t.icon} size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{t.display_name}</div>
                  <div className="text-[11px] text-slate-500 truncate font-mono">{t.code}</div>
                </div>
                {t.is_seed && <Badge tone="neutral">内置</Badge>}
              </button>
            )
          })}
        </div>
        <div className="p-3 border-t border-slate-100">
          <Button variant="outline" className="w-full" size="sm">
            <Plus size={14} /> 新建对象类型
          </Button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto">
        {active ? (
          <div className="max-w-6xl mx-auto px-8 py-6 space-y-6">
            <div className="flex items-start gap-4">
              <div
                className="h-12 w-12 rounded-xl grid place-items-center text-white shrink-0"
                style={{ background: active.color }}
              >
                <Icon name={active.icon} size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-slate-900">{active.display_name}</h1>
                  <span className="font-mono text-xs text-slate-500">{active.code}</span>
                  {active.is_seed && <Badge tone="brand">内置类型</Badge>}
                </div>
                <p className="text-sm text-slate-500 mt-1">{active.description || '无描述'}</p>
              </div>
              <Link to={`/explorer/${active.code}`}>
                <Button variant="outline" size="sm"><Eye size={14} /> 浏览实例</Button>
              </Link>
            </div>

            <Tabs defaultValue="properties">
              <TabsList>
                <TabsTrigger value="properties">属性 ({active.properties_schema.length})</TabsTrigger>
                <TabsTrigger value="links">链接 ({relatedLinks.length})</TabsTrigger>
                <TabsTrigger value="actions">操作 ({relatedActions.length})</TabsTrigger>
                <TabsTrigger value="graph">图谱</TabsTrigger>
              </TabsList>

              <TabsContent value="properties" className="mt-4">
                <Card>
                  <div className="grid grid-cols-12 px-5 py-2.5 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/60">
                    <div className="col-span-3">编码</div>
                    <div className="col-span-3">显示名</div>
                    <div className="col-span-2">类型</div>
                    <div className="col-span-1">必填</div>
                    <div className="col-span-3">枚举 / 说明</div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {active.properties_schema.map((p) => (
                      <div key={p.code} className="grid grid-cols-12 px-5 py-3 text-sm">
                        <div className="col-span-3 font-mono text-slate-700">{p.code}</div>
                        <div className="col-span-3 text-slate-900">{p.label}</div>
                        <div className="col-span-2">
                          <Badge tone="neutral" className="font-mono">{p.type}</Badge>
                        </div>
                        <div className="col-span-1">{p.required ? '是' : '否'}</div>
                        <div className="col-span-3 text-xs text-slate-500">
                          {p.enum ? p.enum.join(' / ') : p.help || '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="links" className="mt-4 space-y-2">
                {relatedLinks.map((l) => (
                  <Card key={l.code} className="px-5 py-3.5 flex items-center gap-3">
                    <Badge tone={l.source_type_code === active.code ? 'brand' : 'sky'}>
                      {l.source_type_code === active.code ? '出向' : '入向'}
                    </Badge>
                    <div className="text-sm font-medium">{l.display_name}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {l.source_type_code} → {l.target_type_code} ({l.cardinality})
                    </div>
                  </Card>
                ))}
                {relatedLinks.length === 0 && <Empty label="无相关链接类型" />}
              </TabsContent>

              <TabsContent value="actions" className="mt-4 space-y-2">
                {relatedActions.map((a) => (
                  <Card key={a.code} className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{a.display_name}</div>
                      <span className="font-mono text-xs text-slate-500">{a.code}</span>
                      <Badge tone="brand" className="ml-auto">{a.kind}</Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{a.description}</div>
                    {a.parameters_schema.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {a.parameters_schema.map((p) => (
                          <span key={p.code} className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                            {p.code}: {p.type}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
                {relatedActions.length === 0 && <Empty label="无操作类型" />}
              </TabsContent>

              <TabsContent value="graph" className="mt-4">
                <LinkGraph objectTypes={types} linkTypes={linkTypes} focusCode={active.code} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="h-full grid place-items-center text-slate-500">
            <div className="text-center">
              <Database size={32} className="mx-auto mb-2 text-slate-300" />
              请在左侧选择一个对象类型
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div className="text-center py-10 text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
      {label}
    </div>
  )
}
