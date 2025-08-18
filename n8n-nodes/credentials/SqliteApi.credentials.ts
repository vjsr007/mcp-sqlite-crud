import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class SqliteApi implements ICredentialType {
	name = 'sqliteApi';
	displayName = 'SQLite Database';
	documentationUrl = '';
	properties: INodeProperties[] = [
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
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '',
			url: '',
		},
	};
}
