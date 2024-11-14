// Color mappings with translations and variations
export const COLOR_MAPPINGS = {
    // English
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
    'grey': 'gray',
    'navy': 'navy blue',
    'beige': 'beige',
    'cream': 'cream',
    'ivory': 'ivory',
    'gold': 'gold',
    'silver': 'silver',
    'bronze': 'bronze',
    'burgundy': 'burgundy',
    'maroon': 'maroon',
    'teal': 'teal',
    'olive': 'olive',
    'khaki': 'khaki',
    'pastel pink': 'pastel pink',
    'pastelrosa': 'pastel pink',
    'hellblau': 'light blue',
    'pastell': 'pastel',
  
    // Spanish
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
    'dorado': 'gold',
    'plateado': 'silver',
    'crema': 'cream',
    'marfil': 'ivory',
  
    // German
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
    'golden': 'gold',
    'silber': 'silver',
    'beige': 'beige',
    'creme': 'cream',
    'elfenbein': 'ivory',
  
    // French
    'noir': 'black',
    'blanc': 'white',
    'rouge': 'red',
    'bleu': 'blue',
    'vert': 'green',
    'jaune': 'yellow',
    'violet': 'purple',
    'rose': 'pink',
    'orange': 'orange',
    'marron': 'brown',
    'gris': 'gray',
    'or': 'gold',
    'argent': 'silver',
    'beige': 'beige',
    'crème': 'cream',
    'ivoire': 'ivory',
  
    // Italian
    'nero': 'black',
    'bianco': 'white',
    'rosso': 'red',
    'blu': 'blue',
    'verde': 'green',
    'giallo': 'yellow',
    'viola': 'purple',
    'rosa': 'pink',
    'arancione': 'orange',
    'marrone': 'brown',
    'grigio': 'gray',
    'oro': 'gold',
    'argento': 'silver',
    'beige': 'beige',
    'crema': 'cream',
    'avorio': 'ivory'
  };
  
  // Article types with translations and variations
  export const ARTICLE_TYPES = {
    dress: [
      // English
      'dress', 'gown', 'frock', 'sundress', 'maxi dress', 'midi dress', 'mini dress',
      'evening dress', 'cocktail dress', 'party dress', 'wedding dress', 'prom dress',
      // Spanish
      'vestido', 'traje', 'vestido de noche', 'vestido de fiesta', 'vestido de novia',
      // German
      'kleid', 'abendkleid', 'cocktailkleid', 'partykleid', 'brautkleid',
      // French
      'robe', 'robe de soirée', 'robe cocktail', 'robe de mariée',
      // Italian
      'abito', 'vestito', 'abito da sera', 'abito da sposa'
    ],
    
    top: [
      // English
      'top', 'blouse', 'shirt', 't-shirt', 'tee', 'sweater', 'pullover', 'cardigan',
      'tank top', 'crop top', 'tunic', 'polo shirt', 'jersey', 'sweatshirt', 'hoodie',
      // Spanish
      'camiseta', 'blusa', 'camisa', 'suéter', 'jersey', 'sudadera', 'polo',
      // German
      'oberteil', 'bluse', 'hemd', 't-shirt', 'pullover', 'strickjacke', 'pulli',
      'shirt', 'tshirt', 'oxford-bluse', 'oxford bluse',
      // French
      'haut', 'chemise', 'chemisier', 'pull', 'gilet', 'maillot',
      // Italian
      'maglia', 'camicia', 'maglione', 'felpa', 'polo'
    ],
  
    pants: [
      // English
      'pants', 'trousers', 'jeans', 'leggings', 'shorts', 'slacks', 'chinos',
      'sweatpants', 'joggers', 'culottes', 'palazzo pants',
      // Spanish
      'pantalón', 'pantalones', 'vaqueros', 'leggins', 'bermudas',
      // German
      'hose', 'jeans', 'leggings', 'shorts', 'jogginghose',
      // French
      'pantalon', 'jean', 'legging', 'short', 'jogging',
      // Italian
      'pantalone', 'jeans', 'leggings', 'pantaloncini'
    ],
  
    skirt: [
      // English
      'skirt', 'midi skirt', 'mini skirt', 'maxi skirt', 'pleated skirt',
      'a-line skirt', 'pencil skirt',
      // Spanish
      'falda', 'minifalda', 'maxifalda',
      // German
      'rock', 'minirock', 'maxirock',
      // French
      'jupe', 'minijupe', 'maxijupe',
      // Italian
      'gonna', 'minigonna', 'maxigonna'
    ],
  
    outerwear: [
      // English
      'jacket', 'coat', 'blazer', 'parka', 'raincoat', 'windbreaker', 'bomber',
      'trench coat', 'peacoat',
      // Spanish
      'chaqueta', 'abrigo', 'gabardina', 'cazadora',
      // German
      'jacke', 'mantel', 'blazer', 'parka', 'regenmantel',
      // French
      'veste', 'manteau', 'blazer', 'imperméable',
      // Italian
      'giacca', 'cappotto', 'blazer', 'impermeabile'
    ],
  
    shoes: [
      // English
      'shoes', 'boots', 'sandals', 'sneakers', 'heels', 'flats', 'loafers',
      'oxfords', 'pumps', 'espadrilles',
      // Spanish
      'zapatos', 'botas', 'sandalias', 'zapatillas', 'tacones',
      // German
      'schuhe', 'stiefel', 'sandalen', 'sneaker', 'absatzschuhe',
      // French
      'chaussures', 'bottes', 'sandales', 'baskets', 'talons',
      // Italian
      'scarpe', 'stivali', 'sandali', 'sneakers', 'tacchi'
    ],
  
    bags: [
      // English
      'bag', 'handbag', 'purse', 'tote', 'clutch', 'backpack', 'satchel',
      'messenger bag', 'shoulder bag',
      // Spanish
      'bolso', 'cartera', 'mochila', 'bolsa',
      // German
      'tasche', 'handtasche', 'geldbörse', 'rucksack',
      // French
      'sac', 'sac à main', 'portefeuille', 'sac à dos',
      // Italian
      'borsa', 'borsetta', 'portafoglio', 'zaino'
    ],
  
    jewelry: [
      // English
      'jewelry', 'necklace', 'bracelet', 'ring', 'earrings', 'pendant',
      'brooch', 'anklet',
      // Spanish
      'joya', 'collar', 'pulsera', 'anillo', 'pendientes', 'colgante',
      // German
      'schmuck', 'halskette', 'armband', 'ring', 'ohrringe', 'anhänger',
      // French
      'bijoux', 'collier', 'bracelet', 'bague', 'boucles d\'oreilles',
      // Italian
      'gioielli', 'collana', 'bracciale', 'anello', 'orecchini'
    ],
  
    accessories: [
      // English
      'accessory', 'scarf', 'belt', 'hat', 'gloves', 'sunglasses', 'wallet',
      'watch', 'umbrella',
      // Spanish
      'accesorio', 'bufanda', 'cinturón', 'sombrero', 'guantes', 'gafas de sol',
      // German
      'accessoire', 'schal', 'gürtel', 'hut', 'handschuhe', 'sonnenbrille',
      // French
      'accessoire', 'écharpe', 'ceinture', 'chapeau', 'gants', 'lunettes de soleil',
      // Italian
      'accessorio', 'sciarpa', 'cintura', 'cappello', 'guanti', 'occhiali da sole'
    ],
  
    swimwear: [
      // English
      'swimwear', 'swimsuit', 'bikini', 'swimming trunks', 'bathing suit',
      // Spanish
      'bañador', 'traje de baño', 'bikini',
      // German
      'bademode', 'badeanzug', 'bikini', 'badehose',
      // French
      'maillot de bain', 'bikini',
      // Italian
      'costume da bagno', 'bikini'
    ],
  
    lingerie: [
      // English
      'lingerie', 'underwear', 'bra', 'panties', 'sleepwear', 'pajamas',
      'nightgown', 'robe',
      // Spanish
      'lencería', 'ropa interior', 'sujetador', 'bragas', 'pijama',
      // German
      'unterwäsche', 'dessous', 'bh', 'slip', 'nachtwäsche', 'pyjama',
      // French
      'lingerie', 'sous-vêtements', 'soutien-gorge', 'culotte', 'pyjama',
      // Italian
      'lingerie', 'intimo', 'reggiseno', 'mutande', 'pigiama'
    ]
  };