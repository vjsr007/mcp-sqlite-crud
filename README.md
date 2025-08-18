# MCP SQLite CRUD in TypeScript

This project implements a complete MCP (Model Context Protocol) server using Express and SQLite, with generic CRUD operations for any table and custom SQL queries.

## Features

- **Connect to any SQLite database** configurable at startup
- **Generic CRUD operations** for any table
- **Custom SQL query execution** (SELECT, INSERT, UPDATE, DELETE)
- **Database schema inspection**
- **Pagination** and filtering in queries
- **Robust error handling**

## Configuration

### Specify database

```bash
# Via environment variable
SQLITE_DB_PATH=/path/to/database.sqlite npm start

# Via command line argument
npm start -- --db=/path/to/database.sqlite
```

## Scripts

- `npm install` — Install dependencies
- `npm start` — Run server in development mode
- `npm run build` — Compile TypeScript project

## Endpoints

### Generic (for any table)

- `GET /schema` — Get complete database schema
- `POST /query` — Execute any custom SQL query
- `GET /table/:tableName` — List table records (with pagination)
- `POST /table/:tableName` — Create a new record
- `PUT /table/:tableName/:id` — Update a record by ID
- `DELETE /table/:tableName/:id` — Delete a record by ID

### Specific (compatibility)

- `GET /items` — List all items
- `POST /items` — Create a new item
- `PUT /items/:id` — Update an item
- `DELETE /items/:id` — Delete an item

## Usage examples

### Execute custom query

```bash
POST /query
{
  "sql": "SELECT * FROM users WHERE age > ?",
  "params": [18]
}
```

### Get records with filters

```bash
GET /table/users?limit=10&offset=0&where=age > 18&orderBy=name ASC
```

### Create record in any table

```bash
POST /table/products
{
  "name": "Laptop",
  "price": 999.99,
  "category": "Electronics"
}
```

## Requirements

- Node.js >= 18
