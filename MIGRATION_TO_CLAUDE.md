# Migración a Claude AI - NoTwins

## 🎯 Resumen de Cambios

Este proyecto ha sido migrado de usar **3 servicios de IA diferentes** (Google Cloud Vision + DeepSeek + Grok) a usar **solo Claude AI (Anthropic)** para todas las funciones de inteligencia artificial.

### ✅ Beneficios de la Migración

1. **Simplificación**: 3 APIs → 1 API
2. **Mejor calidad**: Claude es superior en razonamiento contextual y detección de duplicados
3. **Menos configuración**: Solo necesitas una API key en lugar de tres
4. **Costos más predecibles**: Un solo proveedor para gestionar
5. **Mejor soporte multilingüe**: Excelente en español, inglés, francés, italiano

## 🔄 Qué Ha Cambiado

### Antes (3 servicios):
```
1. Google Cloud Vision → Análisis de imágenes
2. DeepSeek → Interpretación de datos y scraping
3. Grok (xAI) → Detección de duplicados y sugerencias
```

### Después (1 servicio):
```
Claude AI → TODO:
  ✓ Análisis de imágenes
  ✓ Interpretación de productos scraped
  ✓ Detección de duplicados
  ✓ Generación de sugerencias
```

### Mantenido:
```
Puppeteer/Cheerio → Scraping web (sin cambios)
```

## 📋 Archivos Modificados

### Nuevos Archivos
- `server/utils/claude/index.js` - Módulo principal de Claude AI

### Archivos Actualizados
- `server/utils/vision/index.js` - Ahora usa Claude en lugar de Vision + DeepSeek
- `server/utils/duplicates/aiSimilarity.js` - Ahora usa Claude en lugar de Grok
- `server/utils/suggestions/aiSuggestions.js` - Ahora usa Claude en lugar de Grok
- `server/utils/scraping/adaptiveExtractor.js` - Ahora usa Claude para interpretar HTML
- `server/package.json` - Agregado `@anthropic-ai/sdk`
- `.env.example` - Actualizado con nueva configuración

## 🚀 Cómo Configurar

### 1. Obtener API Key de Claude

1. Ve a [console.anthropic.com](https://console.anthropic.com/)
2. Crea una cuenta o inicia sesión
3. Ve a "API Keys"
4. Crea una nueva API key
5. Copia la key (la necesitarás en el siguiente paso)

### 2. Actualizar Variables de Entorno

Actualiza tu archivo `.env` (o `.env.development`):

```bash
# REQUERIDO: Claude AI
ANTHROPIC_API_KEY=sk-ant-api03-...

# OPCIONAL: Para scraping de URLs de productos
SCRAPER_API_KEY=tu-scraper-api-key

# YA NO NECESITAS ESTAS:
# GOOGLE_CLOUD_PROJECT_ID=...
# GOOGLE_CLOUD_CLIENT_EMAIL=...
# GOOGLE_CLOUD_PRIVATE_KEY=...
# DEEPSEEK_API_KEY=...
# GROK_API_KEY=...
```

### 3. Instalar Dependencias

```bash
cd server
npm install
```

### 4. Probar la Configuración

```bash
cd server
npm start
```

El servidor debería iniciar sin errores. Puedes verificar que Claude está funcionando:
1. Sube una imagen de una prenda
2. Intenta agregar un producto mediante URL
3. Verifica detección de duplicados

## 💰 Costos Estimados de Claude

Claude 3.5 Sonnet (el modelo usado):
- **Input**: $3 por 1M tokens (~750,000 palabras)
- **Output**: $15 por 1M tokens (~750,000 palabras)
- **Imágenes**: ~$0.48 por 100 imágenes (dependiendo del tamaño)

### Ejemplo de uso típico:
```
Análisis de 100 imágenes de ropa:
- Imágenes: ~$0.48
- Procesamiento texto: ~$0.10
- Total: ~$0.60

Detección de duplicados (100 comparaciones):
- Input: ~$0.05
- Output: ~$0.15
- Total: ~$0.20

Generación de sugerencias (50 casos):
- Input: ~$0.10
- Output: ~$0.30
- Total: ~$0.40
```

**Costo estimado mensual** (100 usuarios activos): $50-100 USD

## 📊 Comparación con Stack Anterior

| Aspecto | Antes (3 APIs) | Ahora (Claude) |
|---------|----------------|----------------|
| **APIs a gestionar** | 3 (Vision, DeepSeek, Grok) | 1 (Claude) |
| **Configuración** | Compleja (credenciales JSON) | Simple (1 API key) |
| **Costo mensual estimado** | ~$80-150 | ~$50-100 |
| **Calidad duplicados** | Buena | Excelente |
| **Soporte multilingüe** | Limitado | Excelente |
| **Velocidad** | Variable | Consistente |

## 🔧 Troubleshooting

### Error: "Missing ANTHROPIC_API_KEY"
**Solución**: Asegúrate de haber agregado la API key en tu archivo `.env`:
```bash
ANTHROPIC_API_KEY=tu-api-key-aqui
```

### Error: "Claude image analysis failed"
**Causas posibles**:
1. API key inválida o expirada
2. Límite de rate excedido (espera 1 minuto)
3. Imagen demasiado grande (máx 5MB)

**Solución**: Verifica tu API key y los límites en console.anthropic.com

### Error: "Failed to find real products"
**Nota**: Esto es normal si no tienes SCRAPER_API_KEY configurado. El scraping de productos es opcional.

## 📚 Recursos

- [Documentación de Claude](https://docs.anthropic.com/)
- [Precios de Claude](https://www.anthropic.com/pricing)
- [Console de Anthropic](https://console.anthropic.com/)
- [SDK de Anthropic (Node.js)](https://github.com/anthropics/anthropic-sdk-typescript)

## 🆘 Soporte

Si encuentras problemas con la migración:
1. Revisa los logs del servidor (`npm start`)
2. Verifica que tu API key es válida
3. Consulta la documentación de Anthropic
4. Abre un issue en el repositorio

## 📝 Notas Técnicas

### Modelos Usados

**Para Análisis de Imágenes (Vision):**
- **Claude 3 Opus** (`claude-3-opus-20240229`)
- El modelo más potente de Claude 3
- Superior capacidad de OCR y detección de texto
- Mejor para reconocimiento de marcas, logos y etiquetas
- Contexto de 200K tokens

**Para Otras Tareas (Similarity, Suggestions, Scraping):**
- **Claude 3 Haiku** (`claude-3-haiku-20240307`)
- Rápido y económico
- Suficiente para análisis de texto y comparaciones

### Prompts Optimizados
Los prompts han sido diseñados específicamente para:
- Detección de prendas de moda española
- Reconocimiento de marcas locales (Carolina Herrera, Zara, Mango, etc.)
- Análisis multilingüe (ES, EN, FR, IT)
- Detección inteligente de duplicados entre idiomas

### Mantenimiento del Scraping
El sistema de scraping (Puppeteer/Cheerio) **se mantiene sin cambios**. Claude solo se usa para interpretar el HTML extraído, no para hacer el scraping en sí.

---

**Fecha de migración**: Noviembre 2025
**Versión**: 2.0.0
