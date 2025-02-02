import { Category } from './types';

export const CATEGORIES: Category[] = [
  {
    id: 'clothes',
    name: 'Clothes',
    subcategories: [
      {
        id: 'tops',
        name: 'Tops',
        keywords: [
          // English
          'basic tee', 'tank top', 'long sleeve', 'crop top',
          'formal shirt', 'casual shirt', 'denim shirt', 'linen shirt', 'printed shirt',
          'silk blouse', 'lace blouse', 'ruffle blouse',
          'cotton polo', 'technical polo', 'mandarin collar',
          'wool sweater', 'knit sweater', 'turtleneck', 'crew neck', 'v-neck',
          'hoodie', 'sweatshirt', 'oversized',
          'formal vest', 'casual vest', 'quilted vest', 'down vest',
          'sports bra', 'bralette',
          // Spanish
          'camiseta básica', 'tirantes', 'manga larga', 'crop top',
          'camisa formal', 'camisa informal', 'camisa vaquera', 'camisa lino', 'camisa estampada',
          'blusa seda', 'blusa encaje', 'blusa volantes',
          'polo algodón', 'polo técnico', 'cuello mao',
          'jersey lana', 'jersey punto', 'cuello alto', 'cuello redondo', 'cuello pico',
          'sudadera capucha', 'sudadera', 'oversize',
          'chaleco formal', 'chaleco informal', 'chaleco acolchado', 'chaleco plumas',
          'top deportivo', 'bralette'
        ]
      },
      {
        id: 'bottoms',
        name: 'Bottoms',
        keywords: [
          // English
          'dress pants', 'casual pants', 'jeans', 'cargo pants', 'linen pants', 'corduroy pants', 'joggers',
          'sports shorts', 'denim shorts', 'cargo shorts', 'bermuda shorts',
          'pencil skirt', 'pleated skirt', 'midi skirt', 'maxi skirt', 'asymmetric skirt', 'leather skirt',
          'sports leggings', 'thermal leggings', 'jeggings',
          // Spanish
          'pantalón vestir', 'pantalón casual', 'vaqueros', 'pantalón cargo', 'pantalón lino', 'pana', 'joggers',
          'shorts deportivos', 'shorts vaqueros', 'shorts cargo', 'bermudas',
          'falda lápiz', 'falda plisada', 'falda midi', 'falda maxi', 'falda asimétrica', 'falda cuero',
          'mallas deportivas', 'leggings térmicos', 'jeggings'
        ]
      },
      {
        id: 'dresses',
        name: 'Dresses',
        keywords: [
          // English
          'formal dress', 'evening dress', 'gala dress', 'cocktail dress',
          'casual dress', 'summer dress', 'boho dress',
          'jumpsuit', 'romper', 'fitted', 'flowing',
          'suit', 'tuxedo', 'tailored suit',
          // Spanish
          'vestido formal', 'vestido noche', 'vestido gala', 'vestido cóctel',
          'vestido informal', 'vestido verano', 'vestido bohemio',
          'mono largo', 'mono corto', 'ajustado', 'fluido',
          'traje', 'esmoquin', 'traje sastre'
        ]
      },
      {
        id: 'outerwear',
        name: 'Outerwear',
        keywords: [
          // English
          'wool coat', 'trench coat', 'parka', 'down jacket',
          'leather jacket', 'denim jacket', 'bomber jacket', 'biker jacket', 'blazer',
          'quilted jacket', 'suede jacket', 'shearling jacket',
          'duffle coat', 'cape', 'poncho',
          // Spanish
          'abrigo lana', 'gabardina', 'parka', 'plumífero',
          'chaqueta cuero', 'chaqueta vaquera', 'bomber', 'biker', 'blazer',
          'chaqueta acolchada', 'chaqueta ante', 'chaqueta borrego',
          'trenca', 'capa', 'poncho'
        ]
      }
    ]
  },
  {
    id: 'accessories',
    name: 'Accessories',
    subcategories: [
      {
        id: 'shoes',
        name: 'Shoes',
        keywords: [
          // English
          'shoes', 'boots', 'sandals', 'sneakers', 'heels', 'flats', 'loafers',
          'oxfords', 'pumps', 'espadrilles', 'ankle boots', 'knee-high boots',
          // Spanish
          'zapatos', 'botas', 'sandalias', 'zapatillas', 'tacones', 'bailarinas', 'mocasines',
          'oxford', 'salones', 'alpargatas', 'botines', 'botas altas'
        ]
      },
      {
        id: 'bags',
        name: 'Bags',
        keywords: [
          // English
          'handbag', 'shoulder bag', 'backpack', 'tote bag',
          'clutch', 'wallet', 'briefcase', 'messenger bag',
          // Spanish
          'bolso', 'bandolera', 'mochila', 'bolso tote',
          'cartera', 'billetera', 'maletín', 'mensajero'
        ]
      },
      {
        id: 'jewelry',
        name: 'Jewelry',
        keywords: [
          // English
          'necklace', 'bracelet', 'ring', 'earrings', 'pendant',
          'brooch', 'anklet', 'jewelry set',
          // Spanish
          'collar', 'pulsera', 'anillo', 'pendientes', 'colgante',
          'broche', 'tobillera', 'conjunto joyas'
        ]
      },
      {
        id: 'other_accessories',
        name: 'Other Accessories',
        keywords: [
          // English
          'scarf', 'belt', 'hat', 'gloves', 'sunglasses',
          'wallet', 'umbrella', 'watch', 'hair accessories',
          // Spanish
          'bufanda', 'cinturón', 'sombrero', 'guantes', 'gafas de sol',
          'cartera', 'paraguas', 'reloj', 'accesorios pelo'
        ]
      }
    ]
  }
];