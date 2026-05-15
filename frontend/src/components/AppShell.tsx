import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Home, BookOpen, Search, ClipboardList, Bot, Plug, Sparkles, Target,
  Inbox,
} from 'lucide-react'
import { api } from '@/lib/api'
import { zh } from '@/locales/zh'
import { cn } from '@/lib/utils'

type NavItem = {
  to: string
  label: string
  icon: any
  demo?: boolean
}
type NavSection = { title: string; items: NavItem[] }

const SECTIONS: NavSection[] = [
  {
    title: '我的工作',
    items: [
      { to: '/', label: zh.nav.home, icon: Home },
      { to: '/workbench', label: zh.nav.workbench, icon: ClipboardList, demo: true },
      { to: '/special-audit', label: zh.nav.specialAudit, icon: Target, demo: true },
    ],
  },
  {
    title: '知识 & 智能体',
    items: [
      { to: '/knowledge', label: zh.nav.knowledge, icon: BookOpen, demo: true },
      { to: '/agents', label: zh.nav.agents, icon: Bot, demo: true },
    ],
  },
  {
    title: '管理 / 复核',
    items: [
      { to: '/explorer', label: zh.nav.explorer, icon: Search },
      { to: '/learning-inbox', label: zh.nav.learningInbox, icon: Inbox, demo: true },
      { to: '/mcp', label: zh.nav.mcp, icon: Plug },
      { to: '/scenarios', label: zh.nav.scenarios, icon: Sparkles },
    ],
  },
]

export default function AppShell() {
  const loc = useLocation()
  const { data: health } = useQuery({ queryKey: ['health'], queryFn: api.health })

  return (
    <div className="min-h-full flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-slate-900 text-slate-200 flex flex-col">
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center text-white font-bold">本</div>
            <div>
              <div className="text-sm font-semibold text-white tracking-wide">{zh.brand}</div>
              <div className="text-[10px] text-slate-400 tracking-widest">{zh.brandSub}</div>
            </div>
          </div>
        </div>
        <nav className="px-3 flex-1 flex flex-col gap-3 overflow-y-auto pb-4">
          {SECTIONS.map((sec) => (
            <div key={sec.title}>
              <div className="px-3 mb-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                {sec.title}
              </div>
              <div className="flex flex-col gap-0.5">
                {sec.items.map(({ to, label, icon: I, demo }) => {
                  const active = to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(to)
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      className={cn(
                        'group flex items-center gap-3 h-9 px-3 rounded-md text-sm transition-colors',
                        active
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60',
                      )}
                    >
                      <I size={16} className={cn(demo && !active && 'text-brand-300')} />
                      <span>{label}</span>
                      {demo && (
                        <span className="ml-auto text-[9px] uppercase tracking-widest text-brand-300">demo</span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800/70 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className={cn(
              'inline-block h-2 w-2 rounded-full',
              health ? 'bg-emerald-400' : 'bg-slate-600',
            )} />
            <span>{health ? '已连接后端' : '后端未连接'}</span>
          </div>
          {health && (
            <div className="mt-1">
              模型：{health.model}
              {health.llm_demo_mode && <span className="ml-1 text-amber-300">(演示)</span>}
            </div>
          )}
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
