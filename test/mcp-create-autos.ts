import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';

async function run() {
  const serverPath = path.resolve(__dirname, '../dist/src/mcp-server.js');
  const defaultDbPath = path.resolve(__dirname, '../database.sqlite');

  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath, `--db=${defaultDbPath}`],
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, SQLITE_DB_PATH: defaultDbPath }
  });
  const client = new Client({ name: 'mcp-create-autos-client', version: '0.1.0' });
  await client.connect(transport);

  // Attempt root C:/; if fails, we'll retry in project directory
  let autosPath = 'C:/autos.sqlite';

  console.log('Creating autos database at', autosPath);
  let createResp: any = await client.callTool({
    name: 'create_database',
    arguments: {
      dbPath: autosPath,
      schemaStatements: [
        'CREATE TABLE IF NOT EXISTS cars(id INTEGER PRIMARY KEY, make TEXT, model TEXT, year INTEGER)'
      ],
      switchActive: true
    }
  });
  let createText = createResp.content?.[0]?.text || '';
  if (/EPERM|denied|Failed to ensure directory|SQLITE_CANTOPEN/i.test(createText)) {
    autosPath = path.resolve(__dirname, '../autos.sqlite');
    console.log('Retrying create_database at', autosPath);
    createResp = await client.callTool({
      name: 'create_database',
      arguments: {
        dbPath: autosPath,
        schemaStatements: [
          'CREATE TABLE IF NOT EXISTS cars(id INTEGER PRIMARY KEY, make TEXT, model TEXT, year INTEGER)'
        ],
        switchActive: true
      }
    });
    createText = createResp.content?.[0]?.text || '';
  }
  console.log('CREATE DB RESPONSE:', createText);

  const verifyResp: any = await client.callTool({
    name: 'execute_query',
    arguments: { sql: 'SELECT name FROM sqlite_master WHERE type=\'table\'' }
  });
  console.log('TABLES:', verifyResp.content?.[0]?.text);

  const insertResp: any = await client.callTool({
    name: 'execute_query',
    arguments: { sql: "INSERT INTO cars(make,model,year) VALUES('Toyota','Corolla',2020)" }
  });
  console.log('INSERT:', insertResp.content?.[0]?.text);

  const readResp: any = await client.callTool({
    name: 'execute_query',
    arguments: { sql: 'SELECT * FROM cars LIMIT 10' }
  });
  console.log('READ:', readResp.content?.[0]?.text);

  await transport.close();
}

run().catch(err => { console.error(err); process.exit(1); });
