# Guide to use MCP SQLite CRUD with GitHub Copilot

## 📋 MCP Configuration for Copilot

### 1. Install MCP dependencies

```bash
npm install @modelcontextprotocol/sdk
```

### 2. Configure VS Code to use MCP

Add this configuration to your VS Code `settings.json`:

```json
{
  "mcp.servers": {
    "sqlite-crud": {
      "command": "node",
      "args": ["d:\\MyProjects\\mcp-sqlite\\dist\\mcp-server.js"],
      "env": {
        "SQLITE_DB_PATH": "path/to/your/database.sqlite"
      }
    }
  }
}
```

### 3. Compile the MCP server

```bash
npm run build
```

### 4. Use with Copilot

Once configured, you can ask Copilot to:

#### 🔍 Explore the database

- "Show me the database schema"
- "What tables are available?"
- "Describe the structure of the users table"

#### 📊 Query data

- "Get all records from the products table"
- "Search for users with age greater than 25"
- "Show the last 10 orders sorted by date"

#### ✏️ Modify data

- "Add a new user with name 'John' and email 'john@email.com'"
- "Update the price of product with ID 5 to 99.99"
- "Delete the record with ID 3 from the customers table"

#### 🔧 Execute custom queries

- "Execute this query: SELECT COUNT(*) FROM sales WHERE date > '2024-01-01'"
- "Create a new table called 'categories' with columns id, name and description"

## 🛠️ Herramientas MCP disponibles

| Herramienta | Descripción |
|-------------|-------------|
| `get_schema` | Obtiene el esquema completo de la base de datos |
| `execute_query` | Ejecuta cualquier query SQL |
| `get_table_data` | Obtiene datos de una tabla con filtros y paginación |
| `insert_record` | Inserta un nuevo registro |
| `update_record` | Actualiza un registro por ID |
| `delete_record` | Elimina un registro por ID |

## 💡 Usage examples

### Configure specific database

```bash
# Environment variable
SQLITE_DB_PATH=/path/to/my/database.sqlite

# Or in MCP server argument
node dist/mcp-server.js --db=/path/to/database.sqlite
```

### Typical Copilot commands

1. **"Connect to my SQLite database and show me what's there"**
2. **"Find all records where the 'status' field is 'active'"**
3. **"Create a summary of sales by month"**
4. **"Update all prices by increasing them by 10%"**

## ⚠️ Important notes

- The MCP server connects directly to your local SQLite file
- Make sure to backup before write operations
- Write queries (INSERT, UPDATE, DELETE) require confirmation
- You can change the target database by modifying `SQLITE_DB_PATH`

## 🚀 Start the MCP server

```bash
# Compile and run
npm run build
node dist/mcp-server.js

# With specific database
SQLITE_DB_PATH=./my-database.sqlite node dist/mcp-server.js
```

Once configured, Copilot will be able to access your SQLite database and perform any CRUD operation you need using natural language.
