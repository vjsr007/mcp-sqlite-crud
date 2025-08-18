# Integración SQLite CRUD con n8n

Este directorio contiene los nodos personalizados de n8n para interactuar con bases de datos SQLite usando operaciones CRUD.

## 🔧 Instalación

### 1. Navegar al directorio de nodos n8n
```bash
cd n8n-nodes
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Compilar el paquete
```bash
npm run build
```

### 4. Instalar en n8n
```bash
# Método 1: Instalación global
npm install -g n8n-nodes-sqlite-crud

# Método 2: Instalación local en n8n
# Copiar el directorio dist/ a tu directorio de nodos personalizados de n8n
```

## 📋 Configuración

### 1. Crear credenciales SQLite
En n8n, crea una nueva credencial de tipo "SQLite Database" y configura:
- **Database Path**: Ruta al archivo SQLite (ej: `/path/to/database.sqlite`)

### 2. Usar el nodo SQLite CRUD
Agrega el nodo "SQLite CRUD" a tu workflow y selecciona las credenciales creadas.

## 🚀 Operaciones disponibles

### 📊 Get Schema
Obtiene el esquema completo de la base de datos.
```json
{
  "schema": {
    "users": [
      {"cid": 0, "name": "id", "type": "INTEGER", "pk": 1},
      {"cid": 1, "name": "name", "type": "TEXT", "pk": 0}
    ]
  },
  "tableCount": 1
}
```

### 🔍 Select
Obtiene datos de una tabla con filtros opcionales.
**Parámetros:**
- Table: Nombre de la tabla
- Limit: Número máximo de registros (default: 100)
- Offset: Registros a omitir (default: 0)
- Where Condition: Filtro SQL opcional
- Order By: Ordenamiento opcional

### ➕ Insert
Inserta un nuevo registro en una tabla.
**Parámetros:**
- Table: Nombre de la tabla
- Data to Insert: Pares columna-valor a insertar

### ✏️ Update
Actualiza un registro existente por ID.
**Parámetros:**
- Table: Nombre de la tabla
- Record ID: ID del registro a actualizar
- Data to Update: Pares columna-valor a actualizar

### ❌ Delete
Elimina un registro por ID.
**Parámetros:**
- Table: Nombre de la tabla
- Record ID: ID del registro a eliminar

### 🔧 Execute Query
Ejecuta una query SQL personalizada.
**Parámetros:**
- SQL Query: Query SQL a ejecutar

## 💡 Ejemplos de uso en workflows n8n

### Ejemplo 1: Sincronizar datos de API a SQLite
```
HTTP Request (API) → SQLite CRUD (Insert) → Email notification
```

### Ejemplo 2: Generar reportes automáticos
```
Schedule Trigger → SQLite CRUD (Select) → Data transformation → Email/Slack
```

### Ejemplo 3: Pipeline de datos
```
Webhook → Data validation → SQLite CRUD (Insert/Update) → Analytics
```

### Ejemplo 4: Limpieza de datos programada
```
Cron → SQLite CRUD (Execute Query: DELETE old records) → Log results
```

## 📁 Estructura del proyecto

```
n8n-nodes/
├── credentials/
│   └── SqliteApi.credentials.ts    # Credenciales para SQLite
├── nodes/
│   └── Sqlite/
│       ├── Sqlite.node.ts          # Nodo principal SQLite CRUD
│       └── sqlite.svg              # Icono del nodo
├── package.json                    # Configuración del paquete n8n
├── tsconfig.json                   # Configuración TypeScript
└── gulpfile.js                     # Build tools
```

## 🔒 Seguridad

- Las credenciales se almacenan de forma segura en n8n
- Solo se permite acceso a archivos SQLite especificados
- Validación de parámetros para prevenir inyección SQL

## 🛠️ Desarrollo

Para modificar o extender los nodos:

1. Edita los archivos TypeScript en `nodes/` o `credentials/`
2. Ejecuta `npm run build` para compilar
3. Reinicia n8n para cargar los cambios

## 📞 Integración con el servidor MCP

Este nodo n8n puede trabajar en conjunto con el servidor MCP SQLite CRUD:
- **n8n**: Para workflows automatizados y integraciones
- **MCP**: Para interacción con Copilot y desarrollo
- **HTTP API**: Para aplicaciones web y microservicios

Todos comparten la misma base de datos SQLite, proporcionando una solución completa y flexible.
