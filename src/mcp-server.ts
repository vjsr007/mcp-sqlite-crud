#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Configuración de la base de datos
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

// Crear el servidor MCP
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

// Herramientas MCP
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_schema',
        description: 'Obtiene el esquema completo de la base de datos SQLite',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'execute_query',
        description: 'Ejecuta una query SQL personalizada en la base de datos',
        inputSchema: {
          type: 'object',
          properties: {
            sql: {
              type: 'string',
              description: 'La query SQL a ejecutar',
            },
            params: {
              type: 'array',
              description: 'Parámetros para la query SQL',
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
        description: 'Obtiene datos de una tabla específica con filtros opcionales',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: {
              type: 'string',
              description: 'Nombre de la tabla',
            },
            limit: {
              type: 'number',
              description: 'Límite de registros (default: 100)',
            },
            offset: {
              type: 'number',
              description: 'Offset para paginación (default: 0)',
            },
            where: {
              type: 'string',
              description: 'Condición WHERE opcional',
            },
            orderBy: {
              type: 'string',
              description: 'Orden opcional (ej: "name ASC")',
            },
          },
          required: ['tableName'],
        },
      },
      {
        name: 'insert_record',
        description: 'Inserta un nuevo registro en una tabla',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: {
              type: 'string',
              description: 'Nombre de la tabla',
            },
            data: {
              type: 'object',
              description: 'Datos del registro a insertar (clave-valor)',
            },
          },
          required: ['tableName', 'data'],
        },
      },
      {
        name: 'update_record',
        description: 'Actualiza un registro existente por ID',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: {
              type: 'string',
              description: 'Nombre de la tabla',
            },
            id: {
              type: 'string',
              description: 'ID del registro a actualizar',
            },
            data: {
              type: 'object',
              description: 'Datos a actualizar (clave-valor)',
            },
          },
          required: ['tableName', 'id', 'data'],
        },
      },
      {
        name: 'delete_record',
        description: 'Elimina un registro por ID',
        inputSchema: {
          type: 'object',
          properties: {
            tableName: {
              type: 'string',
              description: 'Nombre de la tabla',
            },
            id: {
              type: 'string',
              description: 'ID del registro a eliminar',
            },
          },
          required: ['tableName', 'id'],
        },
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
      
      default:
        throw new Error(`Herramienta desconocida: ${name}`);
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

// Iniciar el servidor
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP SQLite CRUD server started');
}

main().catch(console.error);
