// Color mapping with translations
const COLOR_MAP = {
    // Base colors
    'black': 'black',
    'white': 'white',
    'red': 'red',
    'blue': 'blue',
    'green': 'green',
    'yellow': 'yellow',
    'purple': 'purple',
    'pink': 'pink',
    'orange': 'orange',
    'brown': 'brown',
    'gray': 'gray',
    'beige': 'beige',
    'navy': 'navy blue',
    'cream': 'cream',
    'gold': 'gold',
    'silver': 'silver',
    'khaki': 'khaki',
    'olive': 'olive',
  
    // German translations
    'schwarz': 'black',
    'weiß': 'white',
    'weiss': 'white',
    'rot': 'red',
    'blau': 'blue',
    'grün': 'green',
    'gelb': 'yellow',
    'lila': 'purple',
    'rosa': 'pink',
    'orange': 'orange',
    'braun': 'brown',
    'grau': 'gray',
    'beige': 'beige',
    'marine': 'navy blue',
    'creme': 'cream',
    'gold': 'gold',
    'silber': 'silver',
    'khaki': 'khaki',
    'oliv': 'olive',
    'dunkel': 'dark',
    'hell': 'light',
    'dunkelblau': 'navy blue',
    'hellblau': 'light blue',
    'dunkelgrau': 'dark gray',
    'hellgrau': 'light gray',
    'dunkelgrün': 'dark green',
    'hellgrün': 'light green',
  
    // Spanish translations
    'negro': 'black',
    'blanco': 'white',
    'rojo': 'red',
    'azul': 'blue',
    'verde': 'green',
    'amarillo': 'yellow',
    'morado': 'purple',
    'rosa': 'pink',
    'naranja': 'orange',
    'marrón': 'brown',
    'gris': 'gray',
    'beige': 'beige',
    'marino': 'navy blue',
    'crema': 'cream',
    'dorado': 'gold',
    'plateado': 'silver',
    'caqui': 'khaki',
    'oliva': 'olive',
    'oscuro': 'dark',
    'claro': 'light',
    'azul marino': 'navy blue',
    'azul claro': 'light blue',
    'gris oscuro': 'dark gray',
    'gris claro': 'light gray',
    'verde oscuro': 'dark green',
    'verde claro': 'light green'
  };
  
  export function normalizeColor(color) {
    if (!color) return null;
    
    const normalized = color.toLowerCase().trim();
  
    // Handle compound colors (e.g., "dark blue", "light gray")
    const parts = normalized.split(/\s+/);
    if (parts.length > 1) {
      // Check if first word is a modifier
      const modifiers = ['dark', 'light', 'bright', 'pale', 'deep'];
      if (modifiers.includes(parts[0])) {
        const baseColor = parts.slice(1).join(' ');
        const translatedBase = COLOR_MAP[baseColor];
        if (translatedBase) {
          return `${parts[0]} ${translatedBase}`;
        }
      }
  
      // Try the full compound color
      const fullColor = COLOR_MAP[normalized];
      if (fullColor) {
        return fullColor;
      }
    }
  
    // Try direct translation
    return COLOR_MAP[normalized] || normalized;
  }
  
  export function normalizeText(text) {
    return text?.trim() || null;
  }
  
  export function extractPrice(text) {
    if (!text) return null;
    
    // Handle European price format (e.g., "12,95€")
    const match = text.match(/(\d+)[,.](\d{2})/);
    if (match) {
      const euros = parseInt(match[1], 10);
      const cents = parseInt(match[2], 10);
      return euros + (cents / 100);
    }
    
    // Fallback to basic number extraction
    const normalized = text.replace(/[^\d.,]/g, '')
                         .replace(',', '.');
    const price = parseFloat(normalized);
    
    return isNaN(price) ? null : price;
  }