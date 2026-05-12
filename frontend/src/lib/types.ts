export type ProvenanceOrigin = 'base' | 'public' | 'firm' | 'customer-derived' | 'wizard'
export type ProvenanceStatus = 'active' | 'draft' | 'superseded' | 'deprecated'

export interface Provenance {
  origin: ProvenanceOrigin
  bundle?: string | null
  version?: string | null
  issuer?: string | null
  effective_from?: string | null
  effective_until?: string | null
  contributed_by?: string[]
  anonymized_from?: string | null
  author?: string | null
  status: ProvenanceStatus
  created_at?: string
  updated_at?: string
}

export interface KnowledgeBundle {
  id: string                                     // 'gov-special-audit@2025-09'
  name: string
  description: string
  issuer: string
  version: string
  scope: string[]
}

export interface PropertyDef {
  code: string
  label: string
  type: 'string' | 'number' | 'enum' | 'json' | 'text' | 'date' | 'money'
  required?: boolean
  default?: unknown
  enum?: string[]
  help?: string
}

// ---------- Multi-sheet working paper schema ----------

export type CellType =
  | 'string' | 'number' | 'money' | 'percent' | 'boolean' | 'date' | 'text' | 'enum'

export interface SheetColumn {
  code: string
  label: string
  type: CellType
  width?: number
  computed?: boolean
  formula?: string
  enum?: string[]
}

export interface SheetField {
  code: string
  label: string
  type: CellType
  computed?: boolean
  formula?: string
  default?: unknown
  help?: string
}

export interface Sheet {
  code: string
  name: string
  kind: 'summary' | 'table' | 'checklist' | 'freeform'
  description?: string
  columns?: SheetColumn[]
  fields?: SheetField[]
}

export interface SummarySheetData {
  [field_code: string]: any
}

export interface TableSheetData {
  rows: Record<string, any>[]
}

export type SheetData = SummarySheetData & Partial<TableSheetData>

export interface ObjectType {
  id: number
  code: string
  display_name: string
  description: string
  icon: string
  color: string
  properties_schema: PropertyDef[]
  is_seed: boolean
  created_at: string
}

export interface LinkType {
  id: number
  code: string
  display_name: string
  source_type_code: string
  target_type_code: string
  cardinality: 'one' | 'many'
  description: string
  is_seed: boolean
}

export interface ActionType {
  id: number
  code: string
  display_name: string
  description: string
  target_type_code: string
  kind: 'fill' | 'flag' | 'apply_rule' | 'attach'
  parameters_schema: PropertyDef[]
  is_seed: boolean
}

export interface ObjectInstance {
  id: number
  type_code: string
  display_name: string
  data: Record<string, any>
  created_at: string
  updated_at: string
}

export interface AgentConfig {
  id: number
  code: string
  name: string
  description: string
  scenario: 'working_paper_fill' | 'plan_generation' | 'anomaly_analysis' | 'special_audit'
  avatar: string
  system_prompt: string
  tools: Array<{ kind: 'action' | 'query' | 'mcp'; ref: string }>
  retrieval_object_types: string[]
  is_seed: boolean
  is_stub: boolean
  created_at: string
  updated_at: string
}

export interface ToolCallTrace {
  id: string
  name: string
  arguments: Record<string, any>
  output: any
}

export interface ChatResponse {
  run_id: number
  final_message: string
  tool_calls: ToolCallTrace[]
}

export interface MCPServer {
  id: number
  name: string
  transport: 'stdio' | 'http'
  command: string
  args: string[]
  env: Record<string, string>
  description: string
  enabled: boolean
  tools: Array<{ name: string; description?: string; parameters?: any }>
}

export interface Health {
  ok: boolean
  llm_demo_mode: boolean
  model: string
}
