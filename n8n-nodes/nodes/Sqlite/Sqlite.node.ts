import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeConnectionType,
} from 'n8n-workflow';

import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

export class Sqlite implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SQLite CRUD',
		name: 'sqlite',
		icon: 'file:sqlite.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["table"]}}',
		description: 'CRUD operations on a SQLite database',
		defaults: {
			name: 'SQLite CRUD',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'sqliteApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Execute Query',
						value: 'executeQuery',
						description: 'Ejecutar una query SQL personalizada',
						action: 'Execute a custom SQL query',
					},
					{
						name: 'Get Schema',
						value: 'getSchema',
						description: 'Obtener el esquema de la base de datos',
						action: 'Get database schema',
					},
					{
						name: 'Select',
						value: 'select',
						description: 'Obtener datos de una tabla',
						action: 'Select data from a table',
					},
					{
						name: 'Insert',
						value: 'insert',
						description: 'Insertar un nuevo registro',
						action: 'Insert a new record',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Actualizar un registro existente',
						action: 'Update an existing record',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Eliminar un registro',
						action: 'Delete a record',
					},
				],
				default: 'select',
			},

			// Campos para Execute Query
			{
				displayName: 'SQL Query',
				name: 'sqlQuery',
				type: 'string',
				typeOptions: {
					alwaysOpenEditWindow: true,
					editor: 'sqlEditor',
					sqlDialect: 'SQLite',
				},
				displayOptions: {
					show: {
						operation: ['executeQuery'],
					},
				},
				default: 'SELECT * FROM table_name',
				placeholder: 'SELECT * FROM users WHERE age > 18',
				description: 'SQL query to execute',
			},

			// Campos para operaciones de tabla
			{
				displayName: 'Table',
				name: 'table',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['select', 'insert', 'update', 'delete'],
					},
				},
				default: '',
				placeholder: 'users',
				description: 'Nombre de la tabla',
			},

			// Campos para SELECT
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['select'],
					},
				},
				default: 100,
				description: 'Número máximo de registros a retornar',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				displayOptions: {
					show: {
						operation: ['select'],
					},
				},
				default: 0,
				description: 'Número de registros a omitir',
			},
			{
				displayName: 'Where Condition',
				name: 'whereCondition',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['select'],
					},
				},
				default: '',
				placeholder: 'age > 18 AND status = "active"',
				description: 'Condición WHERE (opcional)',
			},
			{
				displayName: 'Order By',
				name: 'orderBy',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['select'],
					},
				},
				default: '',
				placeholder: 'name ASC, created_at DESC',
				description: 'Ordenamiento (opcional)',
			},

			// Campos para INSERT
			{
				displayName: 'Data to Insert',
				name: 'dataToInsert',
				placeholder: 'Add data to insert',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						operation: ['insert'],
					},
				},
				default: {},
				options: [
					{
						name: 'values',
						displayName: 'Values',
						values: [
							{
								displayName: 'Column',
								name: 'column',
								type: 'string',
								default: '',
								description: 'Nombre de la columna',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Valor a insertar',
							},
						],
					},
				],
			},

			// Campos para UPDATE
			{
				displayName: 'Record ID',
				name: 'recordId',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['update', 'delete'],
					},
				},
				default: '',
				description: 'ID del registro a actualizar/eliminar',
			},
			{
				displayName: 'Data to Update',
				name: 'dataToUpdate',
				placeholder: 'Add data to update',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						operation: ['update'],
					},
				},
				default: {},
				options: [
					{
						name: 'values',
						displayName: 'Values',
						values: [
							{
								displayName: 'Column',
								name: 'column',
								type: 'string',
								default: '',
								description: 'Nombre de la columna',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Nuevo valor',
							},
						],
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const credentials = await this.getCredentials('sqliteApi');
		const databasePath = credentials.databasePath as string;

		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				const db = await open({ filename: databasePath, driver: sqlite3.Database });

				let result: any;
				if (operation === 'getSchema') {
					const tables = await db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`);
					const schema: Record<string, unknown> = {};
						for (const table of tables) {
							const columns = await db.all(`PRAGMA table_info(${table.name})`);
							schema[table.name] = columns;
						}
					result = { schema, tableCount: tables.length };
				} else if (operation === 'executeQuery') {
					const sqlQuery = this.getNodeParameter('sqlQuery', i) as string;
					const isReadQuery = /^\s*(SELECT|PRAGMA)/i.test(sqlQuery);
					if (isReadQuery) {
						const rows = await db.all(sqlQuery);
						result = { data: rows, rowCount: rows.length };
					} else {
						const r = await db.run(sqlQuery);
						result = { changes: r.changes, lastID: r.lastID, message: 'Query executed successfully' };
					}
				} else if (operation === 'select') {
					const table = this.getNodeParameter('table', i) as string;
					const limit = this.getNodeParameter('limit', i) as number;
					const offset = this.getNodeParameter('offset', i) as number;
					const whereCondition = this.getNodeParameter('whereCondition', i) as string;
					const orderBy = this.getNodeParameter('orderBy', i) as string;
					let sql = `SELECT * FROM ${table}`;
					if (whereCondition) sql += ` WHERE ${whereCondition}`;
					if (orderBy) sql += ` ORDER BY ${orderBy}`;
					sql += ' LIMIT ? OFFSET ?';
					const data = await db.all(sql, [limit, offset]);
					let countSql = `SELECT COUNT(*) as total FROM ${table}`;
					if (whereCondition) countSql += ` WHERE ${whereCondition}`;
					const countResult = await db.get(countSql);
					result = { data, total: countResult.total, limit, offset, table };
				} else if (operation === 'insert') {
					const table = this.getNodeParameter('table', i) as string;
					const dataToInsert = this.getNodeParameter('dataToInsert', i) as any;
					const data: Record<string, any> = {};
					if (dataToInsert.values) {
						for (const v of dataToInsert.values) data[v.column] = v.value;
					}
					const columns = Object.keys(data);
					const values = Object.values(data);
					const placeholders = columns.map(() => '?').join(', ');
					const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
					const r = await db.run(sql, values);
					result = { id: r.lastID, changes: r.changes, message: 'Record created successfully', table };
				} else if (operation === 'update') {
					const table = this.getNodeParameter('table', i) as string;
					const recordId = this.getNodeParameter('recordId', i) as string;
					const dataToUpdate = this.getNodeParameter('dataToUpdate', i) as any;
					const data: Record<string, any> = {};
					if (dataToUpdate.values) for (const v of dataToUpdate.values) data[v.column] = v.value;
					const columns = Object.keys(data);
					const values = Object.values(data);
					const setClause = columns.map((c) => `${c} = ?`).join(', ');
					const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
					const r = await db.run(sql, [...values, recordId]);
					result = { changes: r.changes || 0, message: (r.changes || 0) > 0 ? 'Record updated successfully' : 'No record found with that ID', table, id: recordId };
				} else if (operation === 'delete') {
					const table = this.getNodeParameter('table', i) as string;
					const recordId = this.getNodeParameter('recordId', i) as string;
					const r = await db.run(`DELETE FROM ${table} WHERE id = ?`, [recordId]);
					result = { changes: r.changes || 0, message: (r.changes || 0) > 0 ? 'Record deleted successfully' : 'No record found with that ID', table, id: recordId };
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
				}

				await db.close();
				returnData.push({ json: result, pairedItem: { item: i } });
			} catch (error: any) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error?.message || error }, pairedItem: { item: i } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
