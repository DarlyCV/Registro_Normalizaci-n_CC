# Aplicativo Web Móvil - Control de Ternas SED (Luz Del Sur)

Aplicativo web progresivo optimizado para técnicos de campo en smartphones, con la identidad visual corporativa de **Luz Del Sur** (Azul marino `#002244` y Dorado `#FFB300`).

---

## 🚀 Guía de Despliegue en GitHub Pages

Para publicar tu aplicativo y que cualquier técnico pueda acceder desde su smartphone mediante un enlace HTTPS seguro (`https://tu-usuario.github.io/app-luz-del-sur/`), sigue estos pasos:

### 1. Subir a tu Repositorio de GitHub

Abre tu terminal en la carpeta del proyecto (`app-luz-del-sur`) o utiliza **GitHub Desktop**:

```bash
# 1. Inicializar git (si aún no está inicializado)
git init

# 2. Agregar todos los archivos
git add .

# 3. Guardar el primer commit
git commit -m "feat: Despliegue v3.0 Luz del Sur Ternas"

# 4. Asignar rama principal
git branch -M main

# 5. Conectar con tu repositorio remoto en GitHub
git remote add origin https://github.com/TU_USUARIO/app-luz-del-sur.git

# 6. Subir los archivos
git push -u origin main
```

---

### 2. Activar GitHub Pages (3 Clics)

1. En GitHub, ve a tu repositorio recién subido.
2. Entra en **Settings** (Configuración) &rarr; en el menú lateral izquierdo haz clic en **Pages**.
3. En la sección **Build and deployment**:
   - **Source**: Selecciona `Deploy from a branch`.
   - **Branch**: Selecciona `main` y la carpeta `/ (root)`.
   - Haz clic en **Save** (Guardar).
4. Espera 30 segundos, recarga la página y verás tu enlace público seguro en verde:
   > 🌐 **`https://TU_USUARIO.github.io/app-luz-del-sur/`**

---

## 🔒 Capas de Seguridad Implementadas

### 1. Ofuscación de Endpoints y Llaves (`config.js`)
Para evitar que rastreadores, bots o curiosos lean tu URL de Power Automate o llaves en texto plano dentro de GitHub:
- Los endpoints se encuentran codificados internamente y se resuelven en memoria durante la ejecución (`_0xlds(...)`).
- Los nombres de servidor y tokens de firma de Azure no aparecen expuestos en texto legible.

### 2. Token Secreto de Validación de Aplicación (`clientKey`)
Cada envío desde el aplicativo móvil incluye un identificador único de validación (`clientKey: "LDS_TERNAS_FIELD_2026"`):
- En Power Automate puedes agregar una **Condición** inmediatamente después del desencadenador:
  - **Condición**: `clientKey` es igual a `LDS_TERNAS_FIELD_2026`
  - **Si no coincide**: Acción **Terminar** (Código de estado `403 Cancelado`). Esto evita que usuarios no autorizados envíen datos falsos a tu lista de SharePoint.

### 3. Política de Seguridad de Contenido (CSP) y Privacidad
- `<meta http-equiv="Content-Security-Policy">`: Bloquea inyecciones de código malicioso y limita las conexiones exclusivamente a PowerPlatform / SharePoint.
- `<meta name="referrer" content="no-referrer">`: Evita filtrar la URL interna de origen en las cabeceras HTTP.
- Sanitización estricta mediante `escapeHtml()` contra ataques XSS.

---

## ⚡ Rendimiento en Redes Móviles Inestables (Campo)

- **Compresión Inteligente en Smartphone**: Reduce fotos de 12MP/50MP tomadas con cámara a resolución técnica óptima (1280px HD) pesando solo ~120KB-150KB por foto.
- **Capacidad Multiphoto (hasta 20+ fotos)**: Un lote de 17 fotos pesa apenas ~2.2 MB en total en vez de 15 MB.
- **Timeout Adaptativo**: El tiempo de espera se calcula dinámicamente: base de 3 minutos + 15 segundos por cada foto, evitando errores de tiempo de espera en zonas con baja cobertura celular.
- **Almacenamiento Local Seguro**: Guarda copias locales de respaldo sin saturar la cuota de memoria del navegador (`QuotaExceededError`).
