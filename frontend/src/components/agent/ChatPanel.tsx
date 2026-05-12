import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Send, Wrench, Sparkles, User, CornerDownLeft } from 'lucide-react'
import { api } from '@/lib/api'
import type { ToolCallTrace } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  tool_calls?: ToolCallTrace[]
}

interface Props {
  agentCode: string
  paperId?: number
  suggested?: string
  onAfterRun?: () => void
  className?: string
  placeholder?: string
}

export default function ChatPanel({
  agentCode, paperId, suggested,
  onAfterRun, className, placeholder = '请描述你想做的事情…',
}: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const mutation = useMutation({
    mutationFn: ({ message }: { message: string }) =>
      api.chat(agentCode, { message, paper_id: paperId }),
    onSuccess: (res) => {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: res.final_message || '(无文本回复)',
          tool_calls: res.tool_calls,
        },
      ])
      onAfterRun?.()
    },
    onError: (err: any) => {
      setMessages((m) => [...m, { role: 'assistant', content: `调用失败：${err.message}` }])
    },
  })

  function send(text: string) {
    const t = text.trim()
    if (!t || mutation.isPending) return
    setMessages((m) => [...m, { role: 'user', content: t }])
    setInput('')
    mutation.mutate({ message: t })
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, mutation.isPending])

  useEffect(() => {
    function onExternalSubmit(e: Event) {
      const text = (e as CustomEvent<string>).detail
      if (typeof text === 'string' && text.trim()) send(text)
    }
    window.addEventListener('chat:submit', onExternalSubmit as EventListener)
    return () => window.removeEventListener('chat:submit', onExternalSubmit as EventListener)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentCode, paperId])

  return (
    <div className={cn('flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden', className)}>
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <Sparkles size={14} className="text-brand-600" />
        <div className="text-sm font-semibold text-slate-900">智能体对话</div>
        <Badge tone="brand" className="ml-auto">{agentCode}</Badge>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50/40">
        {messages.length === 0 && (
          <div className="text-center text-sm text-slate-500 py-10">
            <Sparkles className="mx-auto mb-2 text-brand-500" size={20} />
            发起一次对话，让智能体读取本体、调用工具并把结果写回底稿。
            {suggested && (
              <button
                className="block mx-auto mt-3 text-xs text-brand-600 hover:text-brand-700 underline underline-offset-2"
                onClick={() => send(suggested)}
              >
                示例：{suggested}
              </button>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <MessageBubble key={i} msg={m} />
        ))}

        {mutation.isPending && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse [animation-delay:120ms]" />
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse [animation-delay:240ms]" />
            <span className="ml-1">智能体正在思考与调用工具…</span>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 p-3 bg-white">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                send(input)
              }
            }}
            className="pr-24 resize-none"
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-2">
            <span className="text-[10px] text-slate-400 hidden sm:flex items-center gap-1">
              <CornerDownLeft size={11} /> Ctrl + Enter
            </span>
            <Button
              size="sm"
              variant="primary"
              disabled={!input.trim() || mutation.isPending}
              onClick={() => send(input)}
            >
              <Send size={14} /> 发送
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  if (msg.role === 'user') {
    return (
      <div className="flex gap-2 justify-end">
        <div className="max-w-[80%] bg-brand-600 text-white rounded-2xl rounded-br-md px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap">
          {msg.content}
        </div>
        <div className="h-7 w-7 rounded-full bg-slate-200 grid place-items-center text-slate-600 shrink-0">
          <User size={14} />
        </div>
      </div>
    )
  }
  return (
    <div className="flex gap-2">
      <div className="h-7 w-7 rounded-full bg-brand-100 grid place-items-center text-brand-700 shrink-0">
        <Sparkles size={14} />
      </div>
      <div className="flex-1 space-y-2">
        {msg.tool_calls && msg.tool_calls.length > 0 && (
          <div className="space-y-1">
            {msg.tool_calls.map((tc, i) => (
              <ToolCallCard key={i} tc={tc} />
            ))}
          </div>
        )}
        <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap text-slate-800">
          {msg.content}
        </div>
      </div>
    </div>
  )
}

function ToolCallCard({ tc }: { tc: ToolCallTrace }) {
  return (
    <details className="bg-slate-50 border border-slate-200 rounded-lg text-xs">
      <summary className="cursor-pointer list-none px-3 py-2 flex items-center gap-2">
        <Wrench size={12} className="text-slate-500" />
        <span className="font-mono text-slate-700 truncate">{tc.name}</span>
        <span className="text-slate-400 ml-auto">已执行</span>
      </summary>
      <div className="px-3 pb-3 space-y-2">
        <pre className="bg-white border border-slate-200 rounded-md p-2 overflow-x-auto text-[11px] text-slate-700 max-h-32">
{JSON.stringify(tc.arguments, null, 2)}
        </pre>
        <pre className="bg-emerald-50 border border-emerald-100 rounded-md p-2 overflow-x-auto text-[11px] text-emerald-900 max-h-32">
{JSON.stringify(tc.output, null, 2)}
        </pre>
      </div>
    </details>
  )
}
