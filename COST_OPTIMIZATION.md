# 💰 Guía de Optimización de Costos - Claude AI

Esta guía te ayudará a **reducir los costos hasta un 80-90%** en el uso de Claude AI para NoTwins.

## 📊 Análisis de Costos Actual

### Costos Base (sin optimización)
```
Análisis de imagen:        ~$0.006 por imagen
Detección de duplicados:   ~$0.002 por comparación
Generación de sugerencias: ~$0.008 por sugerencia
Scraping interpretation:   ~$0.001 por producto

Estimado mensual (100 usuarios): $50-100
```

### Costos Optimizados (con estrategias)
```
Análisis de imagen:        ~$0.001 por imagen (-83%)
Detección de duplicados:   ~$0.0002 por comparación (-90%)
Generación de sugerencias: ~$0.001 por sugerencia (-87%)
Scraping interpretation:   ~$0.0001 por producto (-90%)

Estimado mensual (100 usuarios): $10-20 (-80% ahorro!)
```

## 🎯 Estrategias de Optimización

### 1. ⭐ Prompt Caching (MÁXIMA REDUCCIÓN: 90%)

**Qué es:** Claude cachea automáticamente los prompts del sistema que no cambian.

**Cómo funciona:**
- Los system prompts se cachean por 5 minutos
- Cuesta solo el 10% del precio normal
- Se activa automáticamente con el parámetro correcto

**Implementación:**
```javascript
const response = await claudeClient.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  system: [
    {
      type: "text",
      text: "Tu prompt largo del sistema aquí...",
      cache_control: { type: "ephemeral" } // ⭐ ACTIVA EL CACHÉ
    }
  ],
  messages: [...]
});
```

**Ahorro:** 70-90% en llamadas repetidas

---

### 2. 💎 Usar Claude Haiku para Tareas Simples (80% más barato)

**Claude Haiku vs Sonnet:**
```
Haiku:  Input $0.25/M tokens  | Output $1.25/M tokens
Sonnet: Input $3/M tokens     | Output $15/M tokens
```

**Cuándo usar Haiku:**
- ✅ Comparaciones simples de nombres
- ✅ Extracción básica de datos de scraping
- ✅ Categorización simple

**Cuándo mantener Sonnet:**
- 🎯 Análisis de imágenes
- 🎯 Detección de duplicados complejos
- 🎯 Generación de sugerencias creativas

**Implementación:**
```javascript
// Para tareas simples
const response = await claudeClient.messages.create({
  model: "claude-3-haiku-20240307", // ⭐ 80% más barato
  max_tokens: 500,
  messages: [...]
});
```

**Ahorro:** 80% en tareas simples

---

### 3. 🖼️ Optimización de Imágenes (50% reducción)

**Problema:** Imágenes grandes cuestan más de procesar.

**Soluciones:**
1. **Redimensionar antes de enviar:**
   - Máximo: 800x800px (suficiente para ropa)
   - Actual: Posiblemente 1920x1080 o mayor

2. **Comprimir calidad:**
   - JPEG calidad 80% es suficiente
   - Actual: Probablemente 100%

3. **Usar WebP:**
   - 30% más pequeño que JPEG
   - Compatible con Claude

**Implementación:**
```javascript
import sharp from 'sharp';

// Optimizar imagen antes de enviar a Claude
async function optimizeImage(imageBuffer) {
  return await sharp(imageBuffer)
    .resize(800, 800, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality: 80 })
    .toBuffer();
}
```

**Ahorro:** 40-60% en costos de imagen

---

### 4. 💾 Caché Local de Resultados (100% en repetidos)

**Qué cachear:**
- ✅ Análisis de imágenes (por hash de imagen)
- ✅ Productos scraped (por URL)
- ✅ Detección de duplicados (por pares de productos)

**Implementación con Redis:**
```javascript
import Redis from 'ioredis';
const redis = new Redis();

async function analyzeGarmentImageCached(imageUrl) {
  // Generar hash de la imagen
  const imageHash = crypto.createHash('md5').update(imageUrl).digest('hex');
  const cacheKey = `image:${imageHash}`;

  // Buscar en caché
  const cached = await redis.get(cacheKey);
  if (cached) {
    logger.info('Cache HIT - usando resultado guardado');
    return JSON.parse(cached);
  }

  // Si no está en caché, analizar con Claude
  const result = await claudeAnalyzeImage(imageUrl);

  // Guardar en caché (24 horas)
  await redis.setex(cacheKey, 86400, JSON.stringify(result));

  return result;
}
```

**Ahorro:** 100% en imágenes repetidas (muy común en eventos)

---

### 5. ✂️ Reducir Tamaño de Prompts (30% reducción)

**Problema:** Prompts largos cuestan más.

**Optimizaciones:**
1. Remover ejemplos innecesarios
2. Usar abreviaciones
3. Consolidar instrucciones
4. Remover explicaciones redundantes

**Antes (500 tokens):**
```javascript
const prompt = `Eres un experto en moda española. Analiza esta imagen...
INSTRUCCIONES DETALLADAS:
1. Primero mira el tipo de prenda...
2. Luego identifica el color...
3. Después busca la marca...
... (mucho texto) ...

EJEMPLOS:
- Ejemplo 1: Si ves zapatos...
- Ejemplo 2: Si ves un vestido...
... (más ejemplos) ...`;
```

**Después (150 tokens):**
```javascript
const prompt = `Experto moda ES. Analiza imagen:
- Tipo prenda (vestido/zapatos/bolso/etc)
- Color principal
- Marca si visible
- Categoría

JSON: {name, color, brand, type}`;
```

**Ahorro:** 60-70% en tokens de prompt

---

### 6. 🔄 Batch Processing (20% reducción)

**Qué es:** Procesar múltiples items en una sola llamada.

**Cuándo usar:**
- Comparar un item vs 10 items existentes
- Analizar múltiples sugerencias a la vez

**Implementación:**
```javascript
// ANTES: 10 llamadas separadas
for (const item of existingItems) {
  await compareSimilarity(newItem, item); // 10 llamadas
}

// DESPUÉS: 1 llamada batch
await compareSimilarityBatch(newItem, existingItems); // 1 llamada
```

**Ahorro:** 15-25% por overhead reducido

---

## 🚀 Plan de Implementación Recomendado

### Fase 1: Ganancias Rápidas (1-2 horas)
1. ✅ Activar Prompt Caching → **70% ahorro**
2. ✅ Implementar caché local básico → **50% ahorro en repetidos**
3. ✅ Reducir tamaño de prompts → **30% ahorro**

**Ahorro estimado Fase 1:** 50-60% reducción total

### Fase 2: Optimizaciones Medias (1 día)
4. Implementar optimización de imágenes → **40% ahorro en imágenes**
5. Usar Haiku para tareas simples → **80% ahorro en tareas básicas**

**Ahorro estimado Fase 2:** 65-75% reducción total

### Fase 3: Optimizaciones Avanzadas (2-3 días)
6. Implementar Redis para caché persistente
7. Batch processing inteligente
8. Monitoreo y alertas de costos

**Ahorro estimado Fase 3:** 80-90% reducción total

---

## 📦 Dependencias Adicionales Necesarias

### Para Optimización de Imágenes:
```bash
npm install sharp
```

### Para Caché (Opcional pero recomendado):
```bash
npm install ioredis
# También necesitas Redis server: docker run -d -p 6379:6379 redis
```

---

## 💡 Implementación Inmediata (Código Listo)

### 1. Activar Prompt Caching Ahora

Te puedo modificar tu código actual para activar prompt caching en:
- `analyzeGarmentImage` → 70% ahorro
- `analyzeSimilarItems` → 80% ahorro
- `generateDuplicateSuggestions` → 75% ahorro

Solo necesito modificar los archivos existentes.

### 2. Implementar Caché Simple con Node-Cache

Ya tienes `node-cache` instalado! Puedo implementar caché en memoria ahora mismo:
- Sin dependencias adicionales
- 100% ahorro en resultados repetidos
- Fácil de implementar (15 minutos)

---

## 📊 Comparación de Costos

| Escenario | Sin Optimizar | Con Fase 1 | Con Todas |
|-----------|---------------|------------|-----------|
| 100 usuarios/mes | $50-100 | $20-40 | $10-20 |
| 500 usuarios/mes | $250-500 | $100-200 | $50-100 |
| 1000 usuarios/mes | $500-1000 | $200-400 | $100-200 |

---

## ⚠️ Trade-offs a Considerar

### Prompt Caching
- ✅ Pros: Ahorro masivo, fácil de implementar
- ⚠️ Contras: Cache de 5 minutos (no es problema para tu caso)

### Claude Haiku
- ✅ Pros: 80% más barato
- ⚠️ Contras: Menos "inteligente" para tareas complejas

### Caché Local
- ✅ Pros: 100% ahorro en repetidos
- ⚠️ Contras: Usa memoria RAM o necesita Redis

### Optimización de Imágenes
- ✅ Pros: Ahorro significativo, mejor performance
- ⚠️ Contras: Necesita procesamiento adicional

---

## 🎯 Mi Recomendación

**Para empezar AHORA (10 minutos):**
1. Activar Prompt Caching (modifico 3 archivos)
2. Implementar caché en memoria con node-cache

**Ahorro inmediato:** 60-70%
**Costo estimado nuevo:** $15-30/mes (vs $50-100)

¿Quieres que implemente estas optimizaciones ahora?
