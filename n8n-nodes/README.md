# SQLite CRUD n8n Custom Node

Custom n8n node for interacting with SQLite databases (schema inspection, CRUD, custom SQL queries).

## 🔧 Installation

```bash
cd n8n-nodes
npm install
npm run build
```

Development load (Windows PowerShell):
```bash
setx N8N_CUSTOM_EXTENSIONS %CD%\n8n-nodes\dist
# Open a new shell then start n8n in project root
npx n8n
```

Docker variant provided in `docker-compose.yml` mounts `./n8n-nodes/dist` at `/custom`.

## 📋 Configuration

1. In n8n create new credentials "SQLite Database".
2. Set Database Path (e.g. `./data/app.db`).
3. Add the "SQLite CRUD" node and select the credentials.

## 🚀 Operations

| Operation | Purpose |
|-----------|---------|
| Get Schema | Return all tables & columns |
| Select | Fetch rows with limit/offset/filter/order |
| Insert | Insert a record |
| Update | Update record by id |
| Delete | Delete record by id |
| Execute Query | Run arbitrary SQL |

### Example schema output

```json
{
  "schema": {
    "users": [
      {"cid":0,"name":"id","type":"INTEGER","pk":1},
      {"cid":1,"name":"name","type":"TEXT","pk":0}
    ]
  },
  "tableCount": 1
}
```

## 💡 Workflow Examples

```text
HTTP Request → SQLite CRUD (Insert) → Email
Schedule Trigger → SQLite CRUD (Select) → Transform → Slack
Webhook → Validate → SQLite CRUD (Insert/Update) → Analytics
Cron → SQLite CRUD (Execute Query: DELETE ...) → Log
```

## 📁 Structure

```text
n8n-nodes/
├── credentials/SqliteApi.credentials.ts
├── nodes/Sqlite/Sqlite.node.ts
├── nodes/Sqlite/sqlite.svg
├── package.json
├── tsconfig.json
└── gulpfile.js
```

## 🔒 Security

- Credential storage handled by n8n
- Only the specified DB path is accessed
- Parameters are bound where applicable to reduce injection risk

## 🛠 Development

1. Edit TypeScript
2. `npm run build`
3. Restart n8n

## 🗄️ Persistence

Use Docker compose volumes or keep your `.n8n` runtime dir outside version control (already ignored). SQLite files can live in `./data/` (mounted to a volume in Docker for durability).

## 📦 Publishing

Adjust `package.json` name (e.g. `@yourscope/n8n-nodes-sqlite-crud`) and run:

```bash
npm publish --access public
```

## 🤝 Integration With MCP & HTTP

Share the same SQLite file among: MCP server, HTTP API, n8n workflows.

## 📄 License

MIT (see root `LICENSE`).
