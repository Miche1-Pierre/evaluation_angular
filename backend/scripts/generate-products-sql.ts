import * as fs from 'fs';
import * as path from 'path';

// Mapping des catégories DummyJSON vers nos thèmes
const CATEGORY_TO_THEME: Record<string, number> = {
  'smartphones': 1,           // Tech & Gadgets
  'laptops': 1,              // Tech & Gadgets
  'fragrances': 3,           // Mode & Accessoires
  'skincare': 3,             // Mode & Accessoires
  'groceries': 4,            // Gastronomie
  'home-decoration': 8,      // Immobilier
  'furniture': 8,            // Immobilier
  'tops': 3,                 // Mode & Accessoires
  'womens-dresses': 3,       // Mode & Accessoires
  'womens-shoes': 3,         // Mode & Accessoires
  'mens-shirts': 3,          // Mode & Accessoires
  'mens-shoes': 3,           // Mode & Accessoires
  'mens-watches': 6,         // Montres de Luxe
  'womens-watches': 6,       // Montres de Luxe
  'womens-bags': 3,          // Mode & Accessoires
  'womens-jewellery': 3,     // Mode & Accessoires
  'sunglasses': 3,           // Mode & Accessoires
  'automotive': 2,           // Voitures de Luxe
  'motorcycle': 2,           // Voitures de Luxe
  'lighting': 8,             // Immobilier
  'sports-accessories': 10,  // Sport & Fitness
};

interface DummyProduct {
  id: number;
  title: string;
  price: number;
  category: string;
  thumbnail: string;
  images: string[];
}

interface DummyResponse {
  products: DummyProduct[];
  total: number;
  skip: number;
  limit: number;
}

async function fetchAllProducts(): Promise<DummyProduct[]> {
  const allProducts: DummyProduct[] = [];
  let skip = 0;
  const limit = 100;
  
  console.log('📥 Récupération des produits depuis DummyJSON...');
  
  while (true) {
    const response = await fetch(`https://dummyjson.com/products?limit=${limit}&skip=${skip}`);
    const data: DummyResponse = await response.json();
    
    allProducts.push(...data.products);
    console.log(`   - Récupérés: ${allProducts.length}/${data.total}`);
    
    if (skip + limit >= data.total) break;
    skip += limit;
  }
  
  return allProducts;
}

function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''");
}

async function generateProductsSQL() {
  try {
    // 1. Récupérer tous les produits de l'API
    const products = await fetchAllProducts();
    console.log(`✅ ${products.length} produits récupérés\n`);
    
    // 2. Filtrer et mapper vers nos thèmes
    const mappedProducts = products
      .filter(p => CATEGORY_TO_THEME[p.category])
      .map(p => ({
        themeId: CATEGORY_TO_THEME[p.category],
        name: p.title,
        price: p.price,
        imageUrl: p.thumbnail || p.images[0] || 'https://via.placeholder.com/400'
      }));
    
    console.log(`🎯 ${mappedProducts.length} produits mappés\n`);
    
    // 3. Grouper par thème
    const productsByTheme: Record<number, typeof mappedProducts> = {};
    mappedProducts.forEach(p => {
      if (!productsByTheme[p.themeId]) {
        productsByTheme[p.themeId] = [];
      }
      productsByTheme[p.themeId].push(p);
    });
    
    // 4. Générer le SQL
    let sql = `-- ============================================
-- PRODUCTS - Données depuis DummyJSON API
-- Généré le ${new Date().toLocaleString('fr-FR')}
-- ============================================

-- Suppression des anciens produits
DELETE FROM products;

`;

    const themeNames: Record<number, string> = {
      1: 'Tech & Gadgets',
      2: 'Voitures de Luxe',
      3: 'Mode & Accessoires',
      4: 'Gastronomie',
      5: 'Vins & Spiritueux',
      6: 'Montres de Luxe',
      7: 'Voyages & Hotels',
      8: 'Immobilier',
      9: 'Art & Oeuvres',
      10: 'Sport & Fitness',
    };

    // Générer les INSERT par thème
    for (const themeId of Object.keys(productsByTheme).map(Number).sort()) {
      const products = productsByTheme[themeId];
      
      sql += `-- Theme ${themeId}: ${themeNames[themeId]} (${products.length} produits)\n`;
      sql += `INSERT INTO products (theme_id, name, price, image_url) VALUES\n`;
      
      products.forEach((product, index) => {
        const isLast = index === products.length - 1;
        sql += `  (${product.themeId}, '${escapeSqlString(product.name)}', ${product.price.toFixed(2)}, '${product.imageUrl}')`;
        sql += isLast ? ';\n\n' : ',\n';
      });
    }
    
    // 5. Écrire dans un fichier
    const outputPath = path.join(__dirname, '..', 'src', 'db', 'products-from-api.sql');
    fs.writeFileSync(outputPath, sql, 'utf-8');
    
    console.log(`✅ Fichier SQL généré: ${outputPath}`);
    console.log(`📊 ${mappedProducts.length} produits au total\n`);
    
    // Afficher les stats
    console.log('Répartition par thème:');
    Object.entries(productsByTheme)
      .sort(([a], [b]) => Number(a) - Number(b))
      .forEach(([themeId, prods]) => {
        console.log(`   Theme ${themeId} (${themeNames[Number(themeId)]}): ${prods.length} produits`);
      });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

// Exécution
generateProductsSQL();
