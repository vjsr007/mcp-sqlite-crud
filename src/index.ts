
import express, { Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
app.use(express.json());


// Allow configuring database path via environment variable or argument
const DEFAULT_DB_PATH = './database.sqlite';
let DB_PATH = DEFAULT_DB_PATH;

// Allow passing path via argument: node src/index.js --db=path/to/db.sqlite
const dbArg = process.argv.find(arg => arg.startsWith('--db='));
if (dbArg) {
  DB_PATH = dbArg.replace('--db=', '');
} else if (process.env.SQLITE_DB_PATH) {
  DB_PATH = process.env.SQLITE_DB_PATH;
}


async function setupDb() {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });
  return db;
}

// Function to handle database errors
function handleDbError(error: any, res: Response) {
  console.error('Database error:', error);
  res.status(500).json({ error: 'Database error', details: error.message });
}

// ============== ENDPOINTS GENÉRICOS PARA CUALQUIER TABLA ==============

// Obtener esquema de la base de datos
app.get('/schema', async (req: Request, res: Response) => {
  try {
    const db = await setupDb();
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    
    const schema: any = {};
    for (const table of tables) {
      const columns = await db.all(`PRAGMA table_info(${table.name})`);
      schema[table.name] = columns;
    }
    
    res.json(schema);
    await db.close();
  } catch (error) {
    handleDbError(error, res);
  }
});

// Ejecutar cualquier query SQL
app.post('/query', async (req: Request, res: Response) => {
  try {
    const { sql, params = [] } = req.body;
    
    if (!sql) {
      return res.status(400).json({ error: 'SQL query is required' });
    }

    const db = await setupDb();
    
    // Determinar si es una query de lectura o escritura
    const isReadQuery = /^\s*(SELECT|PRAGMA)/i.test(sql);
    
    if (isReadQuery) {
      const result = await db.all(sql, params);
      res.json({ data: result, rowCount: result.length });
    } else {
      const result = await db.run(sql, params);
      res.json({ 
        changes: result.changes, 
        lastID: result.lastID,
        message: 'Query executed successfully' 
      });
    }
    
    await db.close();
  } catch (error) {
    handleDbError(error, res);
  }
});

// Obtener todos los registros de una tabla
app.get('/table/:tableName', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    const { limit = 100, offset = 0, where = '', orderBy = '' } = req.query;
    
    const db = await setupDb();
    
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
    
    // Contar total de registros
    let countSql = `SELECT COUNT(*) as total FROM ${tableName}`;
    if (where) {
      countSql += ` WHERE ${where}`;
    }
    const countResult = await db.get(countSql);
    
    res.json({ 
      data, 
      total: countResult.total,
      limit: Number(limit),
      offset: Number(offset)
    });
    
    await db.close();
  } catch (error) {
    handleDbError(error, res);
  }
});

// Crear un nuevo registro en una tabla
app.post('/table/:tableName', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    const data = req.body;
    
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    const db = await setupDb();
    const result = await db.run(sql, values);
    
    res.json({ 
      id: result.lastID, 
      changes: result.changes,
      message: 'Record created successfully' 
    });
    
    await db.close();
  } catch (error) {
    handleDbError(error, res);
  }
});

// Actualizar un registro específico
app.put('/table/:tableName/:id', async (req: Request, res: Response) => {
  try {
    const { tableName, id } = req.params;
    const data = req.body;
    
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    
    const sql = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;
    
    const db = await setupDb();
    const result = await db.run(sql, [...values, id]);
    
    res.json({ 
      changes: result.changes || 0,
      message: (result.changes || 0) > 0 ? 'Record updated successfully' : 'No record found with that ID'
    });
    
    await db.close();
  } catch (error) {
    handleDbError(error, res);
  }
});

// Eliminar un registro específico
app.delete('/table/:tableName/:id', async (req: Request, res: Response) => {
  try {
    const { tableName, id } = req.params;
    
    const db = await setupDb();
    const result = await db.run(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
    
    res.json({ 
      changes: result.changes || 0,
      message: (result.changes || 0) > 0 ? 'Record deleted successfully' : 'No record found with that ID'
    });
    
    await db.close();
  } catch (error) {
    handleDbError(error, res);
  }
});

// ============== ENDPOINTS ESPECÍFICOS PARA LA TABLA ITEMS (compatibilidad) ==============


app.get('/items', async (req: Request, res: Response) => {
  try {
    const db = await setupDb();
    await db.exec(`CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      value TEXT NOT NULL
    )`);
    const items = await db.all('SELECT * FROM items');
    res.json(items);
    await db.close();
  } catch (error) {
    handleDbError(error, res);
  }
});


app.post('/items', async (req: Request, res: Response) => {
  try {
    const db = await setupDb();
    await db.exec(`CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      value TEXT NOT NULL
    )`);
    const { name, value } = req.body;
    const result = await db.run('INSERT INTO items (name, value) VALUES (?, ?)', name, value);
    res.json({ id: result.lastID, name, value });
    await db.close();
  } catch (error) {
    handleDbError(error, res);
  }
});


app.put('/items/:id', async (req: Request, res: Response) => {
  try {
    const db = await setupDb();
    const { id } = req.params;
    const { name, value } = req.body;
    await db.run('UPDATE items SET name = ?, value = ? WHERE id = ?', name, value, id);
    res.json({ id, name, value });
    await db.close();
  } catch (error) {
    handleDbError(error, res);
  }
});


app.delete('/items/:id', async (req: Request, res: Response) => {
  try {
    const db = await setupDb();
    const { id } = req.params;
    await db.run('DELETE FROM items WHERE id = ?', id);
    res.json({ id });
    await db.close();
  } catch (error) {
    handleDbError(error, res);
  }
});


app.listen(3000, () => {
  console.log('MCP SQLite CRUD server running on http://localhost:3000');
  console.log(`Usando base de datos SQLite en: ${DB_PATH}`);
  console.log('\n=== Endpoints disponibles ===');
  console.log('GET /schema - Obtener esquema de la base de datos');
  console.log('POST /query - Ejecutar query SQL personalizada');
  console.log('GET /table/:tableName - Obtener registros de una tabla');
  console.log('POST /table/:tableName - Crear registro en una tabla');
  console.log('PUT /table/:tableName/:id - Actualizar registro');
  console.log('DELETE /table/:tableName/:id - Eliminar registro');
  console.log('\n=== Endpoints específicos (compatibilidad) ===');
  console.log('GET /items - Obtener todos los items');
  console.log('POST /items - Crear nuevo item');
  console.log('PUT /items/:id - Actualizar item');
  console.log('DELETE /items/:id - Eliminar item');
});
