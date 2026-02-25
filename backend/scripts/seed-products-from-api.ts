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
    const products = await fetchAllProducts();
    console.log(`✅ ${products.length} produits récupérés\n`);
    
    // 3. Filtrer et mapper vers nos thèmes
    const mappedProducts = products
      .filter(p => themeMap.has(p.category)) // Garder uniquement les catégories qui existent en theme
      .map(p => ({
        themeId: themeMap.get(p.category)!,
        name: p.title,
        description: p.description,
        price: p.price,
        imageUrl: p.thumbnail || p.images[0] || 'https://via.placeholder.com/400'
      }));
    
    console.log(`🎯 ${mappedProducts.length} produits mappés vers les themes\n`);
    
    // 4. Compter par thème
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
    
    // 5. Supprimer les anciens produits
    await clearProducts();
    
    // 6. Insérer les nouveaux produits
    console.log('💾 Insertion des produits dans la base de données...');
    
    for (const product of mappedProducts) {
      await pool.query(
        'INSERT INTO products (theme_id, name, description, price, image_url) VALUES ($1, $2, $3, $4, $5)',
        [product.themeId, product.name, product.description, product.price, product.imageUrl]
      );
    }
    
    console.log(`✅ ${mappedProducts.length} produits insérés avec succès!\n`);
    
    // 7. Vérification finale
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
