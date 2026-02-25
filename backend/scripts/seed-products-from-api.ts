import { Pool } from 'pg';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Configuration de la base de données
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'angular',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5433'),
});

interface DummyProduct {
  id: number;
  title: string;
  description: string;
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

interface Theme {
  id: number;
  slug: string;
  name: string;
}

/**
 * Récupère tous les themes depuis la base de données
 */
async function fetchThemes(): Promise<Map<string, number>> {
  const result = await pool.query('SELECT id, slug FROM themes');
  const themeMap = new Map<string, number>();
  
  result.rows.forEach((row: Theme) => {
    themeMap.set(row.slug, row.id);
  });
  
  return themeMap;
}

/**
 * Récupère tous les produits depuis DummyJSON
 */
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

/**
 * Crée des variations d'un produit pour enrichir le catalogue
 */
function createProductVariations(product: DummyProduct, count: number): DummyProduct[] {
  const variations: DummyProduct[] = [product];
  
  const prefixes = ['Premium', 'Deluxe', 'Pro', 'Elite', 'Classic', 'Modern', 'Vintage', 'Smart', 'Ultra', 'Super'];
  const suffixes = ['Plus', 'Max', 'Mini', 'Lite', 'Pro', 'XL', 'Edition', 'Special', 'Advanced', 'Ultimate'];
  const priceMultipliers = [0.8, 0.9, 1.1, 1.2, 1.3, 1.5, 0.7, 1.4];
  
  for (let i = 1; i < count; i++) {
    const variation: DummyProduct = {
      ...product,
      id: product.id * 1000 + i, // ID unique
      title: i % 2 === 0 
        ? `${prefixes[i % prefixes.length]} ${product.title}`
        : `${product.title} ${suffixes[i % suffixes.length]}`,
      price: parseFloat((product.price * priceMultipliers[i % priceMultipliers.length]).toFixed(2)),
      description: product.description // Garde la même description
    };
    variations.push(variation);
  }
  
  return variations;
}

/**
 * Enrichit les catégories qui ont peu de produits
 */
function enrichProducts(products: DummyProduct[], minProductsPerCategory: number = 15): DummyProduct[] {
  // Grouper par catégorie
  const byCategory: Record<string, DummyProduct[]> = {};
  products.forEach(p => {
    if (!byCategory[p.category]) {
      byCategory[p.category] = [];
    }
    byCategory[p.category].push(p);
  });
  
  const enrichedProducts: DummyProduct[] = [];
  
  console.log('\n🔄 Enrichissement des catégories...');
  
  Object.entries(byCategory).forEach(([category, categoryProducts]) => {
    const currentCount = categoryProducts.length;
    
    if (currentCount < minProductsPerCategory) {
      console.log(`   ${category}: ${currentCount} produits → ajout de ${minProductsPerCategory - currentCount} variations`);
      
      // Ajouter les produits originaux
      enrichedProducts.push(...categoryProducts);
      
      // Calculer combien de produits manquent
      const needed = minProductsPerCategory - currentCount;
      const variationsPerProduct = Math.ceil(needed / currentCount);
      
      // Créer des variations
      categoryProducts.forEach(product => {
        const variations = createProductVariations(product, variationsPerProduct + 1);
        // Skip le premier (original déjà ajouté) et ajouter les variations
        enrichedProducts.push(...variations.slice(1));
      });
    } else {
      console.log(`   ${category}: ${currentCount} produits ✓`);
      enrichedProducts.push(...categoryProducts);
    }
  });
  
  return enrichedProducts;
}

/**
 * Supprime les anciens produits
 */
async function clearProducts() {
  console.log('🗑️  Suppression des anciens produits...');
  await pool.query('DELETE FROM products');
  console.log('✅ Produits supprimés\n');
}

/**
 * Insère les produits dans la base de données
 */
async function seedProducts() {
  try {
    // 1. Récupérer les themes depuis la DB
    console.log('📚 Chargement des themes depuis la base de données...');
    const themeMap = await fetchThemes();
    console.log(`✅ ${themeMap.size} themes chargés\n`);
    
    // 2. Récupérer tous les produits de l'API
    const baseProducts = await fetchAllProducts();
    console.log(`✅ ${baseProducts.length} produits récupérés\n`);
    
    // 3. Enrichir les catégories qui ont peu de produits
    const enrichedProducts = enrichProducts(baseProducts, 15);
    console.log(`✅ ${enrichedProducts.length} produits après enrichissement\n`);
    
    // 4. Filtrer et mapper vers nos thèmes
    const mappedProducts = enrichedProducts
      .filter(p => themeMap.has(p.category)) // Garder uniquement les catégories qui existent en theme
      .map(p => ({
        themeId: themeMap.get(p.category)!,
        name: p.title,
        description: p.description,
        price: p.price,
        imageUrl: p.thumbnail || p.images[0] || 'https://via.placeholder.com/400'
      }));
    
    console.log(`🎯 ${mappedProducts.length} produits mappés vers les themes\n`);
    
    // 5. Compter par thème
    const countByTheme: Record<number, number> = {};
    mappedProducts.forEach(p => {
      countByTheme[p.themeId] = (countByTheme[p.themeId] || 0) + 1;
    });
    
    console.log('📊 Répartition par theme:');
    Object.entries(countByTheme)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([themeId, count]) => {
        console.log(`   Theme ${themeId}: ${count} produits`);
      });
    console.log();
    
    // 6. Supprimer les anciens produits
    await clearProducts();
    
    // 7. Insérer les nouveaux produits
    console.log('💾 Insertion des produits dans la base de données...');
    
    for (const product of mappedProducts) {
      await pool.query(
        'INSERT INTO products (theme_id, name, description, price, image_url) VALUES ($1, $2, $3, $4, $5)',
        [product.themeId, product.name, product.description, product.price, product.imageUrl]
      );
    }
    
    console.log(`✅ ${mappedProducts.length} produits insérés avec succès!\n`);
    
    // 8. Vérification finale
    const result = await pool.query(`
      SELECT t.name as theme_name, COUNT(p.*) as product_count
      FROM themes t
      LEFT JOIN products p ON p.theme_id = t.id
      GROUP BY t.id, t.name
      ORDER BY t.id
    `);
    
    console.log('📋 Résumé par theme:');
    console.log('─'.repeat(60));
    result.rows.forEach((row: any) => {
      console.log(`   ${row.theme_name.padEnd(30, ' ')}: ${row.product_count} produits`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécution
seedProducts();
