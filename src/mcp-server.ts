#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';

// Database configuration
const DEFAULT_DB_PATH = './database.sqlite';
let DB_PATH = process.env.SQLITE_DB_PATH || DEFAULT_DB_PATH;

const dbArg = process.argv.find(arg => arg.startsWith('--db='));
if (dbArg) {
  DB_PATH = dbArg.replace('--db=', '');
}

async function setupDb() {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });
  return db;
}

// Create MCP server
const server = new Server(
  {
    name: 'sqlite-crud-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// MCP tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_schema',
  description: 'Get the full schema (tables & columns) for the current SQLite database',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'execute_query',
  description: 'Execute an arbitrary SQL statement (SELECT/PRAGMA returns rows; others return changes)',
        inputSchema: {
          type: 'object',
          properties: {
            sql: {
              type: 'string',
              description: 'The SQL query to execute',
            },
            params: {
              type: 'array',
              description: 'Optional positional parameters for the SQL query',
              items: {
                type: 'string',
              },
            },
          },
          required: ['sql'],
        },
      },
      {
        name: 'get_table_data',
  description: 'Fetch rows from a table with optional where/order/limit/offset',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: {
              type: 'string',
              description: 'Table name',
            },
            limit: {
              type: 'number',
              description: 'Max rows to return (default 100)',
            },
            offset: {
              type: 'number',
              description: 'Offset for pagination (default 0)',
            },
            where: {
              type: 'string',
              description: 'Optional WHERE clause (without the word WHERE)',
            },
            orderBy: {
              type: 'string',
              description: 'Optional ORDER BY clause (e.g. "name ASC")',
            },
          },
          required: ['tableName'],
        },
      },
      {
        name: 'insert_record',
  description: 'Insert a new record into a table',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: {
              type: 'string',
              description: 'Table name',
            },
            data: {
              type: 'object',
              description: 'Key-value object representing the new row',
            },
          },
          required: ['tableName', 'data'],
        },
      },
      {
        name: 'update_record',
  description: 'Update an existing record by id column',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: {
              type: 'string',
              description: 'Table name',
            },
            id: {
              type: 'string',
              description: 'ID of the record (value of id column)',
            },
            data: {
              type: 'object',
              description: 'Key-value object of columns to update',
            },
          },
          required: ['tableName', 'id', 'data'],
        },
      },
      {
        name: 'delete_record',
  description: 'Delete a record by id column',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: {
              type: 'string',
              description: 'Table name',
            },
            id: {
              type: 'string',
              description: 'ID of the record (value of id column)',
            },
          },
          required: ['tableName', 'id'],
        },
      },
      {
        name: 'create_database',
  description: 'Create (or switch to) a new SQLite database file and optionally run schema statements',
        inputSchema: {
          type: 'object',
          properties: {
            dbPath: {
              type: 'string',
              description: 'Absolute or relative path to the .sqlite file (directories will be created)'
            },
            schemaStatements: {
              type: 'array',
              description: 'Optional list of SQL statements (CREATE TABLE etc.) to run after creation',
              items: { type: 'string' }
            },
            switchActive: {
              type: 'boolean',
              description: 'If true (default) the server will use this new DB for subsequent operations'
            }
          },
          required: ['dbPath']
        }
      },
    ],
  };
});

// Manejador de herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    const db = await setupDb();
    
    switch (name) {
      case 'get_schema': {
        const tables = await db.all(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name NOT LIKE 'sqlite_%'
        `);
        
        const schema: any = {};
        for (const table of tables) {
          const columns = await db.all(`PRAGMA table_info(${table.name})`);
          schema[table.name] = columns;
        }
        
        await db.close();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(schema, null, 2),
            },
          ],
        };
      }
      
      case 'execute_query': {
        const { sql, params = [] } = args as any;
        const isReadQuery = /^\s*(SELECT|PRAGMA)/i.test(sql);
        
        if (isReadQuery) {
          const result = await db.all(sql, params);
          await db.close();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ data: result, rowCount: result.length }, null, 2),
              },
            ],
          };
        } else {
          const result = await db.run(sql, params);
          await db.close();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ 
                  changes: result.changes, 
                  lastID: result.lastID,
                  message: 'Query executed successfully' 
                }, null, 2),
              },
            ],
          };
        }
      }
      
      case 'get_table_data': {
        const { tableName, limit = 100, offset = 0, where = '', orderBy = '' } = args as any;
        
        let sql = `SELECT * FROM ${tableName}`;
        const params: any[] = [];
        
        if (where) {
          sql += ` WHERE ${where}`;
        }
        
        if (orderBy) {
          sql += ` ORDER BY ${orderBy}`;
        }
        
        sql += ` LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));
        
        const data = await db.all(sql, params);
        
        let countSql = `SELECT COUNT(*) as total FROM ${tableName}`;
        if (where) {
          countSql += ` WHERE ${where}`;
        }
        const countResult = await db.get(countSql);
        
        await db.close();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ 
                data, 
                total: countResult.total,
                limit: Number(limit),
                offset: Number(offset)
              }, null, 2),
            },
          ],
        };
      }
      
      case 'insert_record': {
        const { tableName, data } = args as any;
        
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = columns.map(() => '?').join(', ');
        
        const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        const result = await db.run(sql, values);
        
        await db.close();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ 
                id: result.lastID, 
                changes: result.changes,
                message: 'Record created successfully' 
              }, null, 2),
            },
          ],
        };
      }
      
      case 'update_record': {
        const { tableName, id, data } = args as any;
        
        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map(col => `${col} = ?`).join(', ');
        
        const sql = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;
        const result = await db.run(sql, [...values, id]);
        
        await db.close();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ 
                changes: result.changes || 0,
                message: (result.changes || 0) > 0 ? 'Record updated successfully' : 'No record found with that ID'
              }, null, 2),
            },
          ],
        };
      }
      
      case 'delete_record': {
        const { tableName, id } = args as any;
        
        const result = await db.run(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
        
        await db.close();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ 
                changes: result.changes || 0,
                message: (result.changes || 0) > 0 ? 'Record deleted successfully' : 'No record found with that ID'
              }, null, 2),
            },
          ],
        };
      }
      
      case 'create_database': {
        const { dbPath, schemaStatements = [], switchActive = true } = args as any;
        if (typeof dbPath !== 'string' || !dbPath.trim()) {
          throw new Error('dbPath must be a non-empty string');
        }

  // Close current connection before switching
        await db.close();

        const absolutePath = path.resolve(dbPath);
        const dir = path.dirname(absolutePath);
        try {
          const root = path.parse(dir).root;
            if (!fs.existsSync(dir) && dir !== root) {
              fs.mkdirSync(dir, { recursive: true });
            }
        } catch (e: any) {
          throw new Error(`Failed to ensure directory for database: ${e.message}`);
        }
  // Open (created if missing)
        const newDb = await open({ filename: absolutePath, driver: sqlite3.Database });

        for (const stmt of schemaStatements) {
          if (typeof stmt === 'string' && stmt.trim()) {
            await newDb.exec(stmt);
          }
        }

        await newDb.close();

        if (switchActive) {
          DB_PATH = absolutePath;
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ 
                dbPath: absolutePath,
                switched: !!switchActive,
                appliedStatements: schemaStatements.length,
                message: 'Database created successfully' 
              }, null, 2),
            },
          ],
        };
      }
      
      default:
  throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP SQLite CRUD server started');
}

main().catch(console.error);
