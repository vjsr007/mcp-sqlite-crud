import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';

async function run() {
  const serverPath = path.resolve(__dirname, '../dist/src/mcp-server.js');
  const dbPath = path.resolve(__dirname, '../database.sqlite');

  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath, `--db=${dbPath}`],
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, SQLITE_DB_PATH: dbPath }
  });
  const client = new Client({ name: 'mcp-test-client', version: '0.1.0' });
  await client.connect(transport);

  const toolsResp: any = await client.listTools();
  console.log('TOOLS:', toolsResp.tools.map((t: any) => t.name));

  const schemaResp: any = await client.callTool({ name: 'get_schema', arguments: {} });
  console.log('SCHEMA TEXT:', schemaResp.content?.[0]?.text?.slice(0, 120));

  // Ensure table exists
  await client.callTool({ name: 'execute_query', arguments: { sql: 'CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, value TEXT)' } });

  const insertResp: any = await client.callTool({ name: 'insert_record', arguments: { tableName: 'items', data: { name: 'Test', value: '123' } } });
  console.log('INSERT TEXT:', insertResp.content?.[0]?.text);

  const selectResp: any = await client.callTool({ name: 'get_table_data', arguments: { tableName: 'items', limit: 5 } });
  console.log('SELECT TEXT:', selectResp.content?.[0]?.text);

  await transport.close();
}

run().catch(err => { console.error(err); process.exit(1); });
