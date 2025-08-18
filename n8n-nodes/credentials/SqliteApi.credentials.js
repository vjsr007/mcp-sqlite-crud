"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteApi = void 0;
class SqliteApi {
    constructor() {
        this.name = 'sqliteApi';
        this.displayName = 'SQLite Database';
        this.documentationUrl = '';
        this.properties = [
            {
                displayName: 'Database Path',
                name: 'databasePath',
                type: 'string',
                default: './database.sqlite',
                placeholder: 'path/to/database.sqlite',
                description: 'Ruta al archivo de base de datos SQLite',
            },
        ];
        // No se requiere autenticación para SQLite local
        this.authenticate = {
            type: 'generic',
            properties: {},
        };
        this.test = {
            request: {
                baseURL: '',
                url: '',
            },
        };
    }
}
exports.SqliteApi = SqliteApi;
