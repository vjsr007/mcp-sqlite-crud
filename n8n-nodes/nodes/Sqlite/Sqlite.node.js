"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sqlite = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const sqlite_1 = require("sqlite");
const sqlite3_1 = __importDefault(require("sqlite3"));
class Sqlite {
    constructor() {
        this.description = {
            displayName: 'SQLite CRUD',
            name: 'sqlite',
            icon: 'file:sqlite.svg',
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["operation"] + ": " + $parameter["table"]}}',
            description: 'Operaciones CRUD en base de datos SQLite',
            defaults: {
                name: 'SQLite CRUD',
            },
            inputs: ['main'],
            outputs: ['main'],
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
                        editor: 'code',
                        editorLanguage: 'sql',
                    },
                    displayOptions: {
                        show: {
                            operation: ['executeQuery'],
                        },
                    },
                    default: 'SELECT * FROM table_name',
                    placeholder: 'SELECT * FROM users WHERE age > 18',
                    description: 'La query SQL a ejecutar',
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
    }
    async execute() {
        const items = this.getInputData();
        const credentials = await this.getCredentials('sqliteApi');
        const databasePath = credentials.databasePath;
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const operation = this.getNodeParameter('operation', i);
                // Abrir conexión a la base de datos
                const db = await (0, sqlite_1.open)({
                    filename: databasePath,
                    driver: sqlite3_1.default.Database
                });
                let result;
                switch (operation) {
                    case 'getSchema':
                        result = await this.getSchema(db);
                        break;
                    case 'executeQuery':
                        result = await this.executeQuery(db, i);
                        break;
                    case 'select':
                        result = await this.selectData(db, i);
                        break;
                    case 'insert':
                        result = await this.insertData(db, i);
                        break;
                    case 'update':
                        result = await this.updateData(db, i);
                        break;
                    case 'delete':
                        result = await this.deleteData(db, i);
                        break;
                    default:
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Operación desconocida: ${operation}`);
                }
                await db.close();
                returnData.push({
                    json: result,
                    pairedItem: {
                        item: i,
                    },
                });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error.message,
                        },
                        pairedItem: {
                            item: i,
                        },
                    });
                    continue;
                }
                throw error;
            }
        }
        return [returnData];
    }
    async getSchema(db) {
        const tables = await db.all(`
			SELECT name FROM sqlite_master 
			WHERE type='table' AND name NOT LIKE 'sqlite_%'
		`);
        const schema = {};
        for (const table of tables) {
            const columns = await db.all(`PRAGMA table_info(${table.name})`);
            schema[table.name] = columns;
        }
        return { schema, tableCount: tables.length };
    }
    async executeQuery(db, itemIndex) {
        const sqlQuery = this.getNodeParameter('sqlQuery', itemIndex);
        const isReadQuery = /^\s*(SELECT|PRAGMA)/i.test(sqlQuery);
        if (isReadQuery) {
            const result = await db.all(sqlQuery);
            return { data: result, rowCount: result.length };
        }
        else {
            const result = await db.run(sqlQuery);
            return {
                changes: result.changes,
                lastID: result.lastID,
                message: 'Query executed successfully'
            };
        }
    }
    async selectData(db, itemIndex) {
        const table = this.getNodeParameter('table', itemIndex);
        const limit = this.getNodeParameter('limit', itemIndex);
        const offset = this.getNodeParameter('offset', itemIndex);
        const whereCondition = this.getNodeParameter('whereCondition', itemIndex);
        const orderBy = this.getNodeParameter('orderBy', itemIndex);
        let sql = `SELECT * FROM ${table}`;
        const params = [];
        if (whereCondition) {
            sql += ` WHERE ${whereCondition}`;
        }
        if (orderBy) {
            sql += ` ORDER BY ${orderBy}`;
        }
        sql += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        const data = await db.all(sql, params);
        // Contar total de registros
        let countSql = `SELECT COUNT(*) as total FROM ${table}`;
        if (whereCondition) {
            countSql += ` WHERE ${whereCondition}`;
        }
        const countResult = await db.get(countSql);
        return {
            data,
            total: countResult.total,
            limit,
            offset,
            table
        };
    }
    async insertData(db, itemIndex) {
        const table = this.getNodeParameter('table', itemIndex);
        const dataToInsert = this.getNodeParameter('dataToInsert', itemIndex);
        const data = {};
        if (dataToInsert.values) {
            for (const item of dataToInsert.values) {
                data[item.column] = item.value;
            }
        }
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
        const result = await db.run(sql, values);
        return {
            id: result.lastID,
            changes: result.changes,
            message: 'Record created successfully',
            table
        };
    }
    async updateData(db, itemIndex) {
        const table = this.getNodeParameter('table', itemIndex);
        const recordId = this.getNodeParameter('recordId', itemIndex);
        const dataToUpdate = this.getNodeParameter('dataToUpdate', itemIndex);
        const data = {};
        if (dataToUpdate.values) {
            for (const item of dataToUpdate.values) {
                data[item.column] = item.value;
            }
        }
        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map(col => `${col} = ?`).join(', ');
        const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
        const result = await db.run(sql, [...values, recordId]);
        return {
            changes: result.changes || 0,
            message: (result.changes || 0) > 0 ? 'Record updated successfully' : 'No record found with that ID',
            table,
            id: recordId
        };
    }
    async deleteData(db, itemIndex) {
        const table = this.getNodeParameter('table', itemIndex);
        const recordId = this.getNodeParameter('recordId', itemIndex);
        const result = await db.run(`DELETE FROM ${table} WHERE id = ?`, [recordId]);
        return {
            changes: result.changes || 0,
            message: (result.changes || 0) > 0 ? 'Record deleted successfully' : 'No record found with that ID',
            table,
            id: recordId
        };
    }
}
exports.Sqlite = Sqlite;
