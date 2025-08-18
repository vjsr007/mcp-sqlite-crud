# Pasos para subir a GitHub

## 1. Crear repositorio en GitHub

1. Ve a [GitHub.com](https://github.com)
2. Haz clic en el botón "+" en la esquina superior derecha
3. Selecciona "New repository"
4. Configura el repositorio:
   - **Repository name**: `mcp-sqlite-crud`
   - **Description**: `MCP SQLite CRUD server with GitHub Copilot and n8n integration`
   - **Visibility**: Public
   - **NO** marques "Initialize this repository with README" (ya tenemos archivos)
5. Haz clic en "Create repository"

## 2. Conectar tu repositorio local con GitHub

Copia la URL del repositorio que acabas de crear (algo como: `https://github.com/tu-usuario/mcp-sqlite-crud.git`)

Ejecuta estos comandos en tu terminal:

```bash
# Agregar el repositorio remoto
git remote add origin https://github.com/TU-USUARIO/mcp-sqlite-crud.git

# Configurar tu nombre y email si no lo has hecho
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"

# Subir los archivos a GitHub
git branch -M main
git push -u origin main
```

## 3. Opcional: Configurar GitHub Pages (para documentación)

1. Ve a tu repositorio en GitHub
2. Click en "Settings" (Configuración)
3. Scroll hasta "Pages" en la barra lateral
4. En "Source", selecciona "Deploy from a branch"
5. Selecciona "main" branch y "/ (root)"
6. Click "Save"

Tu documentación estará disponible en: `https://tu-usuario.github.io/mcp-sqlite-crud/`

## 4. Agregar badges al README (opcional)

Puedes agregar badges informativos al inicio de tu README.md:

```markdown
# MCP SQLite CRUD in TypeScript

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

[resto del README...]
```

¡Listo! Tu proyecto estará disponible públicamente en GitHub.
