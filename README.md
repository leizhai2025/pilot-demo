# 审计本体 · Audit Ontology

Palantir Foundry 风格的「本体 + 智能体」原型平台，面向会计师事务所的财务年审场景。

## 这是什么

把会计师事务所沉淀多年的**底稿模板 / 审计规则 / 行业 expertise**，建模为可执行的**本体（Ontology）**——
然后让**智能体**直接读取本体上下文、写回底稿、执行规则、识别异常。

第一个版本完整跑通了「**财务年审 · 货币资金底稿填写**」端到端流程，并预置了其他三个场景的智能体模板：

- ✅ **底稿填写** (Working Paper Fill) — 完整可演示
- 🟡 **方案生成** (Plan Generation) — 智能体已预置，待对接业务逻辑
- 🟡 **异常分析** (Anomaly Analysis) — 智能体已预置
- 🟡 **专项审计** (Special Audit) — 智能体已预置

## Palantir 设计映射

| Palantir Foundry / AIP | 本原型 |
|---|---|
| Ontology Manager (OMA) | 本体管理页 — 对象类型 / 链接 / 操作 / 图谱 |
| Object Type | 审计项目、底稿、模板、审计规则、凭证 … |
| Action Type | 填写底稿、标记异常、应用规则、附加证据 |
| Object Explorer | 数据浏览页 |
| AIP Chatbot Studio | 智能体工作室 — 提示词 / 工具 / 检索上下文 |
| Workshop | 底稿工作台 — 三栏面向终端用户的应用 |
| Ontology MCP (OMCP) | MCP 工具页 — 外部集成清单 |
| Ontology Augmented Generation | 智能体配置中的「检索上下文」 |

## 启动方式

需要 Python 3.11+ 与 Node.js 20+。

**Windows**:

```
start.bat
```

**macOS / Linux**:

```
./start.sh
```

或手动：

```bash
# 后端
cd backend
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt   # Windows
# . .venv/bin/activate; pip install -r requirements.txt   # macOS / Linux
uvicorn app.main:app --reload --port 8000

# 前端（另开一个终端）
cd frontend
npm install
npm run dev
```

打开 <http://127.0.0.1:5173>。

## LLM 配置

复制 `backend/.env.example` 为 `backend/.env`：

```
GITHUB_TOKEN=ghp_xxx
MODEL_ID=openai/gpt-4o
```

GitHub Models API 是 OpenAI 兼容的推理服务，
申请 token：<https://github.com/settings/tokens>（勾选 `models:read`）。

**不设置 token 也可以**——后端会进入 **DEMO 模式**，
为「货币资金底稿填写」流程返回一段确定性的脚本，便于不带 key 演示。

## 演示路径（5 分钟）

1. **首页**：查看进行中项目、本体规模、已部署智能体。
2. **本体管理**：打开 `底稿` 对象类型 → 属性 / 链接 / 操作 / 图谱。
3. **底稿工作台**（demo 主场）：
   - 选中 `A1 货币资金 - 星河制造 2025`
   - 点击 `AI 填写`，或在右侧聊天面板输入 `请帮我填写`
   - 观察智能体：读取试算平衡表 → 查询凭证 → 写回 5 个字段 → 应用 3 条审计规则
4. **智能体工作室**：打开 `货币资金底稿填写助手`，修改提示词或勾选/去勾选工具，保存。
5. **MCP 工具**：浏览外部集成清单（filesystem / excel / 银行询证函）。
6. **场景模板**：4 个场景卡片，1 个可演示，3 个 stub 预置。

## 仓库结构

```
audit-ontology/
├── backend/             # FastAPI + SQLModel + SQLite
│   └── app/
│       ├── models.py        # 本体表 + 实例表 + 智能体配置 + MCP 注册
│       ├── seed.py          # 内置 11 种对象类型 / 9 条链接 / 4 个操作 + 示例数据 + 4 个智能体
│       ├── ontology/        # 本体 CRUD + action execution
│       ├── agents/          # 智能体 CRUD + 运行循环（runner）
│       ├── llm.py           # GitHub Models API 调用（OpenAI-compatible）
│       └── mcp_registry.py  # MCP 服务注册
└── frontend/            # React + Vite + TS + Tailwind v4 + shadcn-style
    └── src/
        ├── pages/           # Home / OntologyManager / ObjectExplorer / WorkingPaperWorkbench / AgentStudio / MCPServers / ScenarioTemplates
        ├── components/      # ui (Button/Card/...) / ontology (LinkGraph) / agent (ChatPanel/ToolPicker)
        └── lib/             # api / types / utils
```

## 已知限制（v1）

- 无登录 / 多租户 / 操作审计日志
- 规则评估为占位实现（每条规则默认通过）；真实校验逻辑应在 `agents/runner.py:apply_rule` 内
- MCP 调用为 stub —— 没有真实启动外部 server。`tools` 列表来自数据库种子
- 仅简体中文；i18n 留作 v2
- 本体编辑限于属性查看；新增 / 修改对象类型的表单留作 v2
