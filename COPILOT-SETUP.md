# MCP SQLite CRUD Configuration for GitHub Copilot

## 📋 Steps to add to Copilot

### 1. 🔧 Configure VS Code Settings

Open VS Code settings (`Ctrl + ,` or `Cmd + ,`) and search for "settings.json" or edit directly:

**File:** `%APPDATA%\Code\User\settings.json` (Windows) or `~/.config/Code/User/settings.json` (Linux/Mac)

Add this configuration:

```json
{
  "mcp.servers": {
    "sqlite-crud": {
      "command": "node",
      "args": ["d:\\MyProjects\\mcp-sqlite\\dist\\mcp-server.js"],
      "env": {
        "SQLITE_DB_PATH": "./database.sqlite"
      }
    }
  }
}
```

### 2. 📁 Customize database path

Modify `SQLITE_DB_PATH` according to your needs:

```json
{
  "mcp.servers": {
    "sqlite-crud": {
      "command": "node",
      "args": ["d:\\MyProjects\\mcp-sqlite\\dist\\mcp-server.js"],
      "env": {
        "SQLITE_DB_PATH": "C:\\Users\\YourUser\\Documents\\my-database.sqlite"
      }
    }
  }
}
```

### 3. 🚀 Start the MCP server

```bash
# From the project directory
npm run build
npm run mcp
```

### 4. 🔄 Restart VS Code

For Copilot to detect the new MCP server:

1. Close VS Code completely
2. Reopen VS Code
3. Open any file

### 5. ✅ Verify connection

In VS Code, open the **Command Palette** (`Ctrl + Shift + P`) and search:

- "MCP: List Servers"
- You should see "sqlite-crud" in the list

## 💬 Using with Copilot

Once configured, you can ask Copilot:

### 🔍 Explore database

- *"What tables are in my SQLite database?"*
- *"Show me the schema of the users table"*
- *"How many records are in the products table?"*

### 📊 Query data

- *"Get all active users"*
- *"Find products with price greater than 100"*
- *"Show sales from last month"*

### ✏️ Modify data

- *"Add a new user: name 'John', email 'john@test.com'"*
- *"Update the price of product ID 5 to 99.99"*
- *"Delete obsolete records from logs table"*

### 🔧 Advanced queries

- *"Execute this query: SELECT COUNT(*) FROM orders WHERE date > '2024-01-01'"*
- *"Create a categories table with columns id, name, description"*
- *"Make a JOIN between users and orders"*

## 🛠️ Advanced configuration

### Multiple databases

```json
{
  "mcp.servers": {
    "sqlite-prod": {
      "command": "node",
      "args": ["d:\\MyProjects\\mcp-sqlite\\dist\\mcp-server.js"],
      "env": {
        "SQLITE_DB_PATH": "C:\\databases\\production.sqlite"
      }
    },
    "sqlite-dev": {
      "command": "node",
      "args": ["d:\\MyProjects\\mcp-sqlite\\dist\\mcp-server.js"],
      "env": {
        "SQLITE_DB_PATH": "C:\\databases\\development.sqlite"
      }
    }
  }
}
```

### With logging enabled

```json
{
  "mcp.servers": {
    "sqlite-crud": {
      "command": "node",
      "args": ["d:\\MyProjects\\mcp-sqlite\\dist\\mcp-server.js"],
      "env": {
        "SQLITE_DB_PATH": "./database.sqlite",
        "MCP_LOG_LEVEL": "debug"
      }
    }
  }
}
```

## 🚨 Troubleshooting

### Error: "Cannot find module"

```bash
# Make sure the project is compiled
npm run build

# Verify the file exists
ls dist/mcp-server.js
```

### Error: "Database not found"

- Verify that the path in `SQLITE_DB_PATH` is correct
- Use absolute paths to avoid issues
- The SQLite file will be created automatically if it doesn't exist

### Copilot doesn't detect the server

1. Verify JSON syntax in settings.json
2. Restart VS Code completely
3. Check VS Code console (Help > Toggle Developer Tools)

## 🎯 Ready

Once configured, you'll have complete access to your SQLite database from Copilot using **natural language**. Copilot will be able to help you with database operations, data analysis, and complex query generation intuitively.
