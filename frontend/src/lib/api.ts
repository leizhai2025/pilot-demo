import type {
  ObjectType, LinkType, ActionType, ObjectInstance,
  AgentConfig, ChatResponse, MCPServer, Health, KnowledgeBundle,
} from './types'

const API = '/api'

async function json<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const r = await fetch(input, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!r.ok) {
    let detail = await r.text()
    try { detail = JSON.parse(detail).detail || detail } catch {}
    throw new Error(`${r.status} ${detail}`)
  }
  return r.json() as Promise<T>
}

export const api = {
  health: () => json<Health>(`${API}/health`),

  // Ontology
  listObjectTypes: () => json<ObjectType[]>(`${API}/ontology/object-types`),
  getObjectType: (code: string) => json<ObjectType>(`${API}/ontology/object-types/${code}`),
  updateObjectType: (code: string, body: Partial<ObjectType>) =>
    json<ObjectType>(`${API}/ontology/object-types/${code}`, {
      method: 'PUT', body: JSON.stringify(body),
    }),
  listLinkTypes: () => json<LinkType[]>(`${API}/ontology/link-types`),
  listActionTypes: () => json<ActionType[]>(`${API}/ontology/action-types`),

  // Instances
  listObjects: (typeCode?: string) => {
    const qs = typeCode ? `?type_code=${encodeURIComponent(typeCode)}` : ''
    return json<ObjectInstance[]>(`${API}/ontology/objects${qs}`)
  },
  getObject: (id: number) => json<{
    object: ObjectInstance
    out_links: Array<{ id: number; link_type_code: string; source_id: number; target_id: number }>
    in_links: Array<{ id: number; link_type_code: string; source_id: number; target_id: number }>
  }>(`${API}/ontology/objects/${id}`),
  patchObject: (id: number, body: Partial<{ data: Record<string, any>; display_name: string }>) =>
    json<ObjectInstance>(`${API}/ontology/objects/${id}`, {
      method: 'PATCH', body: JSON.stringify(body),
    }),
  executeAction: (code: string, body: { target_id: number; parameters: Record<string, any> }) =>
    json<any>(`${API}/ontology/actions/${code}/execute`, {
      method: 'POST', body: JSON.stringify(body),
    }),

  // Agents
  listAgents: () => json<AgentConfig[]>(`${API}/agents`),
  getAgent: (code: string) => json<AgentConfig>(`${API}/agents/${code}`),
  updateAgent: (code: string, body: Partial<AgentConfig>) =>
    json<AgentConfig>(`${API}/agents/${code}`, {
      method: 'PUT', body: JSON.stringify(body),
    }),
  chat: (code: string, body: { message: string; paper_id?: number }) =>
    json<ChatResponse>(`${API}/agents/${code}/chat`, {
      method: 'POST', body: JSON.stringify(body),
    }),

  // Knowledge bundles
  listBundles: () => json<KnowledgeBundle[]>(`${API}/bundles`),

  // MCP
  listMCPServers: () => json<MCPServer[]>(`${API}/mcp/servers`),
  toggleMCPServer: (name: string, enabled: boolean) =>
    json<MCPServer>(`${API}/mcp/servers/${name}`, {
      method: 'PATCH', body: JSON.stringify({ enabled }),
    }),
}
