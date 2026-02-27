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

/**
 * Insère des utilisateurs de test
 * Mot de passe pour tous : "password123" (hash bcrypt)
 */
async function seedUsers() {
  console.log('👥 Insertion des utilisateurs de test...');
  
  const users = [
    { email: 'admin@dfs.com', username: 'AdminDFS', role: 'admin', total_score: 0, games_played: 0, best_session_score: 0, average_score: 0 },
    { email: 'alice@test.com', username: 'Alice', role: 'user', total_score: 285, games_played: 3, best_session_score: 98, average_score: 95 },
    { email: 'bob@test.com', username: 'Bob', role: 'user', total_score: 242, games_played: 3, best_session_score: 87, average_score: 80.67 },
    { email: 'charlie@test.com', username: 'Charlie', role: 'user', total_score: 156, games_played: 2, best_session_score: 82, average_score: 78 },
    { email: 'diana@test.com', username: 'Diana', role: 'user', total_score: 198, games_played: 2, best_session_score: 102, average_score: 99 },
  ];

  const passwordHash = '$2b$10$WFlgzzJiv4PaGCEcJzn24O.RZkjnNvK2l/C4D4O39uyqE9JzJfQTG'; // "password123"

  for (const user of users) {
    await pool.query(
      `INSERT INTO users (email, username, password_hash, role, total_score, games_played, best_session_score, average_score) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO NOTHING`,
      [user.email, user.username, passwordHash, user.role, user.total_score, user.games_played, user.best_session_score, user.average_score]
    );
  }

  console.log(`✅ ${users.length} utilisateurs insérés (mot de passe: "password123")\n`);
}

/**
 * Insère des amitiés de test
 */
async function seedFriendships() {
  console.log('🤝 Création des amitiés...');
  
  const friendships = [
    [2, 3], // Alice et Bob
    [3, 4], // Bob et Charlie
    [4, 5], // Charlie et Diana
  ];

  for (const [user1, user2] of friendships) {
    await pool.query(
      'INSERT INTO friendships (user_id_1, user_id_2) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [user1, user2]
    );
  }

  console.log(`✅ ${friendships.length} amitiés créées\n`);
}

/**
 * Insère des demandes d'amitié de test
 */
async function seedFriendRequests() {
  console.log('📨 Création des demandes d\'amitié...');
  
  const requests = [
    { sender: 5, receiver: 2, status: 'pending' },  // Diana -> Alice (en attente)
    { sender: 4, receiver: 2, status: 'rejected' }, // Charlie -> Alice (rejetée)
  ];

  for (const request of requests) {
    await pool.query(
      'INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [request.sender, request.receiver, request.status]
    );
  }

  console.log(`✅ ${requests.length} demandes d'amitié créées\n`);
}

/**
 * Crée des sessions de test avec des produits aléatoires
 */
async function seedSessions() {
  console.log('🎮 Création des sessions de jeu...');
  
  // Récupérer quelques produits aléatoires
  const productsResult = await pool.query('SELECT id FROM products ORDER BY RANDOM() LIMIT 12');
  const productIds = productsResult.rows.map((row: any) => row.id);

  if (productIds.length < 12) {
    console.log('⚠️  Pas assez de produits (minimum 12 requis). Lancez d\'abord: npm run seed:products');
    return;
  }

  // Session 1: Active, friends_only
  const session1 = await pool.query(
    `INSERT INTO sessions (name, creator_id, status, difficulty, visibility, max_participants) 
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    ['DFS 25-26', 1, 'active', 'medium', 'friends_only', 5]
  );
  const session1Id = session1.rows[0].id;

  // Produits pour session 1
  for (let i = 0; i < 4; i++) {
    await pool.query(
      'INSERT INTO session_products (session_id, product_id, position) VALUES ($1, $2, $3)',
      [session1Id, productIds[i], i + 1]
    );
  }

  // Session 2: Completed, public
  const session2 = await pool.query(
    `INSERT INTO sessions (name, creator_id, status, difficulty, visibility, max_participants) 
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    ['Session Winter 2026', 1, 'completed', 'hard', 'public', 10]
  );
  const session2Id = session2.rows[0].id;

  // Produits pour session 2
  for (let i = 0; i < 4; i++) {
    await pool.query(
      'INSERT INTO session_products (session_id, product_id, position) VALUES ($1, $2, $3)',
      [session2Id, productIds[i + 4], i + 1]
    );
  }

  // Session 3: Active, private
  const session3 = await pool.query(
    `INSERT INTO sessions (name, creator_id, status, difficulty, visibility, max_participants) 
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    ['Best of Tech', 1, 'active', 'easy', 'private', 10]
  );
  const session3Id = session3.rows[0].id;

  // Produits pour session 3
  for (let i = 0; i < 4; i++) {
    await pool.query(
      'INSERT INTO session_products (session_id, product_id, position) VALUES ($1, $2, $3)',
      [session3Id, productIds[i + 8], i + 1]
    );
  }

  console.log('✅ 3 sessions créées avec 4 produits chacune\n');

  // Invitations à la session 3 (private)
  await pool.query(
    'INSERT INTO session_invites (session_id, inviter_id, invitee_id, status) VALUES ($1, $2, $3, $4)',
    [session3Id, 1, 3, 'pending'] // Admin invite Bob
  );
  await pool.query(
    'INSERT INTO session_invites (session_id, inviter_id, invitee_id, status) VALUES ($1, $2, $3, $4)',
    [session3Id, 1, 2, 'accepted'] // Admin invite Alice (acceptée)
  );

  return { session1Id, session2Id, session3Id, productIds };
}

/**
 * Ajoute des participants et réponses à la session complétée
 */
async function seedParticipantsAndAnswers(session2Id: number, productIds: number[]) {
  console.log('🎯 Ajout des participants et réponses...');

  // Alice participe à la session 1 (en cours)
  // Pas d'insertion ici car on ne sait pas l'ID de session1

  // Bob, Charlie et Diana ont participé à la session 2
  const bobParticipant = await pool.query(
    'INSERT INTO participants (session_id, user_id, session_score, completed) VALUES ($1, $2, $3, $4) RETURNING id',
    [session2Id, 3, 230, true] // Bob
  );
  const charlieParticipant = await pool.query(
    'INSERT INTO participants (session_id, user_id, session_score, completed) VALUES ($1, $2, $3, $4) RETURNING id',
    [session2Id, 4, 124, true] // Charlie
  );
  const dianaParticipant = await pool.query(
    'INSERT INTO participants (session_id, user_id, session_score, completed) VALUES ($1, $2, $3, $4) RETURNING id',
    [session2Id, 5, 246, true] // Diana
  );

  const bobParticipantId = bobParticipant.rows[0].id;
  const charlieParticipantId = charlieParticipant.rows[0].id;
  const dianaParticipantId = dianaParticipant.rows[0].id;

  // Session 2 a les produits productIds[4-7]
  const session2Products = productIds.slice(4, 8);

  // Réponses de Bob
  const bobAnswers = [
    { guessed_price: 500, score: 75 },
    { guessed_price: 300, score: 65 },
    { guessed_price: 150, score: 45 },
    { guessed_price: 80, score: 45 },
  ];

  for (let i = 0; i < 4; i++) {
    await pool.query(
      'INSERT INTO answers (participant_id, product_id, guessed_price, score) VALUES ($1, $2, $3, $4)',
      [bobParticipantId, session2Products[i], bobAnswers[i].guessed_price, bobAnswers[i].score]
    );
  }

  // Réponses de Charlie
  const charlieAnswers = [
    { guessed_price: 450, score: 55 },
    { guessed_price: 250, score: 45 },
    { guessed_price: 120, score: 22 },
    { guessed_price: 60, score: 2 },
  ];

  for (let i = 0; i < 4; i++) {
    await pool.query(
      'INSERT INTO answers (participant_id, product_id, guessed_price, score) VALUES ($1, $2, $3, $4)',
      [charlieParticipantId, session2Products[i], charlieAnswers[i].guessed_price, charlieAnswers[i].score]
    );
  }

  // Réponses de Diana
  const dianaAnswers = [
    { guessed_price: 520, score: 85 },
    { guessed_price: 310, score: 70 },
    { guessed_price: 155, score: 50 },
    { guessed_price: 85, score: 41 },
  ];

  for (let i = 0; i < 4; i++) {
    await pool.query(
      'INSERT INTO answers (participant_id, product_id, guessed_price, score) VALUES ($1, $2, $3, $4)',
      [dianaParticipantId, session2Products[i], dianaAnswers[i].guessed_price, dianaAnswers[i].score]
    );
  }

  console.log('✅ Participants et réponses ajoutés\n');
}

/**
 * Script principal
 */
async function seedTestData() {
  try {
    console.log('🔧 Peuplement de la base avec des données de test...\n');
    console.log('═'.repeat(60));
    console.log();

    await seedUsers();
    await seedFriendships();
    await seedFriendRequests();
    
    const sessionData = await seedSessions();
    if (sessionData) {
      await seedParticipantsAndAnswers(sessionData.session2Id, sessionData.productIds);
    }

    console.log('═'.repeat(60));
    console.log('✅ Données de test insérées avec succès!\n');

    // Afficher un résumé
    const summary = await pool.query(`
      SELECT 'Users' as table_name, COUNT(*) as count FROM users
      UNION ALL SELECT 'Themes', COUNT(*) FROM themes
      UNION ALL SELECT 'Products', COUNT(*) FROM products
      UNION ALL SELECT 'Sessions', COUNT(*) FROM sessions
      UNION ALL SELECT 'Participants', COUNT(*) FROM participants
      UNION ALL SELECT 'Friendships', COUNT(*) FROM friendships
      ORDER BY table_name
    `);

    console.log('📊 Résumé de la base de données:');
    console.log('─'.repeat(60));
    summary.rows.forEach((row: any) => {
      console.log(`   ${row.table_name.padEnd(20, ' ')}: ${row.count}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécution
seedTestData();
