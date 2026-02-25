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

// Mapping des icônes pour chaque catégorie
const CATEGORY_ICONS: Record<string, string> = {
  'smartphones': 'bx-mobile',
  'laptops': 'bx-laptop',
  'fragrances': 'bx-spray-can',
  'skincare': 'bx-face',
  'groceries': 'bx-food-menu',
  'home-decoration': 'bx-home-heart',
  'furniture': 'bx-chair',
  'tops': 'bx-closet',
  'womens-dresses': 'bx-female',
  'womens-shoes': 'bx-walk',
  'mens-shirts': 'bx-male',
  'mens-shoes': 'bx-closet',
  'mens-watches': 'bx-time-five',
  'womens-watches': 'bx-time',
  'womens-bags': 'bx-shopping-bag',
  'womens-jewellery': 'bxs-diamond',
  'sunglasses': 'bx-sun',
  'automotive': 'bx-car',
  'motorcycle': 'bx-cycling',
  'lighting': 'bx-bulb',
  'sports-accessories': 'bx-dumbbell',
  'mobile-accessories': 'bx-plug',
  'kitchen-accessories': 'bx-dish',
  'tablets': 'bx-tablet',
  'vehicle': 'bx-car',
};

// Descriptions personnalisées pour chaque catégorie
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'smartphones': 'Les derniers smartphones et téléphones mobiles',
  'laptops': 'Ordinateurs portables pour tous les usages',
  'fragrances': 'Parfums et eaux de toilette',
  'skincare': 'Produits de soin de la peau',
  'groceries': 'Produits alimentaires et épicerie',
  'home-decoration': 'Décoration et accessoires pour la maison',
  'furniture': 'Meubles pour la maison et le bureau',
  'tops': 'Hauts et t-shirts',
  'womens-dresses': 'Robes pour femmes',
  'womens-shoes': 'Chaussures pour femmes',
  'mens-shirts': 'Chemises pour hommes',
  'mens-shoes': 'Chaussures pour hommes',
  'mens-watches': 'Montres pour hommes',
  'womens-watches': 'Montres pour femmes',
  'womens-bags': 'Sacs à main pour femmes',
  'womens-jewellery': 'Bijoux et accessoires',
  'sunglasses': 'Lunettes de soleil',
  'automotive': 'Pièces et accessoires automobiles',
  'motorcycle': 'Motos et équipement',
  'lighting': 'Luminaires et éclairage',
  'sports-accessories': 'Accessoires et équipements sportifs',
  'mobile-accessories': 'Accessoires pour téléphones mobiles',
  'kitchen-accessories': 'Accessoires de cuisine',
  'tablets': 'Tablettes et accessoires',
  'vehicle': 'Véhicules et équipements',
};

interface DummyCategory {
  slug: string;
  name: string;
  url: string;
}

/**
 * Récupère toutes les catégories depuis l'API DummyJSON
 */
async function fetchCategories(): Promise<DummyCategory[]> {
  console.log('📥 Récupération des catégories depuis DummyJSON...');
  const response = await fetch('https://dummyjson.com/products/categories');
  const categories: DummyCategory[] = await response.json();
  console.log(`✅ ${categories.length} catégories récupérées\n`);
  return categories;
}

/**
 * Formate le nom de la catégorie pour l'affichage
 */
function formatCategoryName(name: string): string {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Supprime les anciens themes
 */
async function clearThemes() {
  console.log('🗑️  Suppression des anciens themes...');
  await pool.query('DELETE FROM themes');
  console.log('✅ Themes supprimés\n');
}

/**
 * Insère les catégories comme themes dans la base de données
 */
async function seedThemes() {
  try {
    // Récupérer les catégories
    const categories = await fetchCategories();

    // Supprimer les anciens themes
    await clearThemes();

    // Insérer les nouveaux themes
    console.log('💾 Insertion des themes dans la base de données...');
    
    for (const category of categories) {
      const name = formatCategoryName(category.name);
      const slug = category.slug;
      const description = CATEGORY_DESCRIPTIONS[slug] || `Produits de la catégorie ${name}`;
      const icon = CATEGORY_ICONS[slug] || 'bx-package';

      await pool.query(
        'INSERT INTO themes (name, slug, description, icon) VALUES ($1, $2, $3, $4)',
        [name, slug, description, icon]
      );

      console.log(`   ✓ ${name} (${slug})`);
    }

    console.log(`\n✅ ${categories.length} themes insérés avec succès!`);

    // Afficher un résumé
    const result = await pool.query('SELECT id, name, slug FROM themes ORDER BY id');
    console.log('\n📊 Themes créés:');
    console.log('─'.repeat(60));
    result.rows.forEach((row: any) => {
      console.log(`   ${row.id.toString().padStart(2, ' ')}. ${row.name.padEnd(30, ' ')} (${row.slug})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécuter le script
seedThemes();
