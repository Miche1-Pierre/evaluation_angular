-- Create database (run this first as superuser if needed)
-- CREATE DATABASE angular;

-- Connect to the database
\c angular;

-- Drop existing tables and types (for clean init)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS session_invites CASCADE;
DROP TABLE IF EXISTS friend_requests CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS session_products CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS session_status CASCADE;
DROP TYPE IF EXISTS session_difficulty CASCADE;
DROP TYPE IF EXISTS friend_request_status CASCADE;
DROP TYPE IF EXISTS session_invite_status CASCADE;
DROP TYPE IF EXISTS session_visibility CASCADE;

-- ============================================
-- ENUM Types
-- ============================================
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE session_status AS ENUM ('active', 'completed', 'archived');
CREATE TYPE session_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE friend_request_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE session_invite_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE session_visibility AS ENUM ('public', 'private', 'friends_only');

-- ============================================
-- Table: users
-- Compuser_role DEFAULT 'user'
-- ============================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  -- Statistiques globales
  total_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  best_session_score INTEGER DEFAULT 0,
  average_score DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- ============================================
-- Table: products
-- Contient la liste de tous les produits disponibles
-- ============================================
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: sessions
-- Une session de jeu créée par un utilisateur ou administrateur
-- ============================================
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status session_status DEFAULT 'active',
  difficulty session_difficulty DEFAULT 'medium',
  visibility session_visibility DEFAULT 'public',
  max_participants INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: session_products
-- Les 4 produits sélectionnés pour une session (relation many-to-many)
-- ============================================
CREATE TABLE session_products (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, product_id),
  UNIQUE(session_id, position)
);

-- ============================================
-- Table: participants
-- Un participant à une session
-- ============================================
CREATE TABLE participants (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_score INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, user_id)
);

-- ============================================
-- Table: answers
-- Les réponses d'un participant pour chaque produit
-- ============================================
CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  guessed_price DECIMAL(10, 2) NOT NULL CHECK (guessed_price >= 0),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(participant_id, product_id)
);

-- ============================================
-- Table: friendships
-- Stores accepted friend relationships (bidirectional)
-- ============================================
CREATE TABLE friendships (
  id SERIAL PRIMARY KEY,
  user_id_1 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id_2 INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Ensure no duplicate friendships (order-independent)
  CHECK (user_id_1 < user_id_2),
  UNIQUE(user_id_1, user_id_2)
);

-- ============================================
-- Table: friend_requests
-- Pending friend requests
-- ============================================
CREATE TABLE friend_requests (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status friend_request_status DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Prevent sending request to yourself
  CHECK (sender_id != receiver_id),
  -- Only one pending request between two users
  UNIQUE(sender_id, receiver_id)
);

-- ============================================
-- Table: session_invites
-- Invitations to private/friends_only sessions
-- ============================================
CREATE TABLE session_invites (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  inviter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status session_invite_status DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- One invite per user per session
  UNIQUE(session_id, invitee_id)
);

-- ============================================
-- Table: messages
-- Chat messages between friends
-- ============================================
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (sender_id != receiver_id)
);

-- ============================================
-- Indexes pour optimiser les performances
-- ============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_sessions_creator ON sessions(creator_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_visibility ON sessions(visibility);
CREATE INDEX idx_session_products_session ON session_products(session_id);
CREATE INDEX idx_participants_session ON participants(session_id);
CREATE INDEX idx_participants_user ON participants(user_id);
CREATE INDEX idx_answers_participant ON answers(participant_id);
CREATE INDEX idx_friendships_user1 ON friendships(user_id_1);
CREATE INDEX idx_friendships_user2 ON friendships(user_id_2);
CREATE INDEX idx_friend_requests_sender ON friend_requests(sender_id);
CREATE INDEX idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);
CREATE INDEX idx_session_invites_session ON session_invites(session_id);
CREATE INDEX idx_session_invites_invitee ON session_invites(invitee_id);
CREATE INDEX idx_session_invites_status ON session_invites(status);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- ============================================
-- Données de test : Utilisateurs
-- Mot de passe pour tous : "password123" (hash bcrypt)
-- ============================================
INSERT INTO users (email, username, password_hash, role, total_score, games_played, best_session_score, average_score) VALUES
  ('admin@dfs.com', 'AdminDFS', '$2b$10$WFlgzzJiv4PaGCEcJzn24O.RZkjnNvK2l/C4D4O39uyqE9JzJfQTG', 'admin', 0, 0, 0, 0),
  ('alice@test.com', 'Alice', '$2b$10$WFlgzzJiv4PaGCEcJzn24O.RZkjnNvK2l/C4D4O39uyqE9JzJfQTG', 'user', 285, 3, 98, 95),
  ('bob@test.com', 'Bob', '$2b$10$WFlgzzJiv4PaGCEcJzn24O.RZkjnNvK2l/C4D4O39uyqE9JzJfQTG', 'user', 242, 3, 87, 80.67),
  ('charlie@test.com', 'Charlie', '$2b$10$WFlgzzJiv4PaGCEcJzn24O.RZkjnNvK2l/C4D4O39uyqE9JzJfQTG', 'user', 156, 2, 82, 78),
  ('diana@test.com', 'Diana', '$2b$10$WFlgzzJiv4PaGCEcJzn24O.RZkjnNvK2l/C4D4O39uyqE9JzJfQTG', 'user', 198, 2, 102, 99);

-- ============================================
-- Données de test : Produits
-- ============================================
INSERT INTO products (name, price, image_url) VALUES
  ('iPhone 15 Pro', 1229.00, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400'),
  ('MacBook Air M2', 1199.00, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'),
  ('AirPods Pro', 279.00, 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400'),
  ('iPad Pro 12.9"', 1449.00, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400'),
  ('Apple Watch Ultra', 899.00, 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400'),
  ('PS5', 549.99, 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400'),
  ('Nintendo Switch OLED', 349.99, 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400'),
  ('Xbox Series X', 499.99, 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400'),
  ('Samsung Galaxy S24 Ultra', 1299.00, 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400'),
  ('Sony WH-1000XM5', 399.00, 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400'),
  ('DJI Mini 3 Pro', 759.00, 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400'),
  ('GoPro Hero 12', 449.99, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'),
  ('Kindle Paperwhite', 149.99, 'https://images.unsplash.com/photo-1592168415497-102b8d37f1e4?w=400'),
  ('Ring Video Doorbell', 99.99, 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400'),
  ('Dyson V15 Detect', 749.00, 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400'),
  ('Nespresso Vertuo', 179.00, 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400'),
  ('Logitech MX Master 3S', 109.99, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'),
  ('Herman Miller Aeron Chair', 1795.00, 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400'),
  ('LG C3 OLED 55"', 1799.00, 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400'),
  ('Bose SoundLink Revolve+', 329.00, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400');

-- ============================================
-- Sessions de test
-- ============================================
INSERT INTO sessions (name, creator_id, status, difficulty) VALUES
  ('DFS 25-26', 1, 'active', 'medium'),
  ('Session Winter 2026', 1, 'completed', 'hard'),
  ('Best of Tech', 1, 'active', 'easy');

-- Sélectionner 4 produits pour chaque session
-- Session 1: iPhone, PS5, Sony Headphones, Kindle
INSERT INTO session_products (session_id, product_id, position) VALUES
  (1, 1, 1),  -- iPhone 15 Pro
  (1, 6, 2),  -- PS5
  (1, 10, 3), -- Sony WH-1000XM5
  (1, 13, 4); -- Kindle Paperwhite

-- Session 2: MacBook, iPad, Apple Watch, AirPods
INSERT INTO session_products (session_id, product_id, position) VALUES
  (2, 2, 1),  -- MacBook Air M2
  (2, 4, 2),  -- iPad Pro
  (2, 5, 3),  -- Apple Watch Ultra
  (2, 3, 4);  -- AirPods Pro

-- Session 3: PS5, Xbox, Switch, Samsung
INSERT INTO session_products (session_id, product_id, position) VALUES
  (3, 6, 1),  -- PS5
  (3, 8, 2),  -- Xbox Series X
  (3, 7, 3),  -- Nintendo Switch
  (3, 9, 4);  -- Samsung Galaxy S24

-- ============================================
-- Participants et réponses de test
-- ============================================
-- Alice participe à la session 1 (en cours)
INSERT INTO participants (session_id, user_id, session_score, completed) VALUES
  (1, 2, 0, false);

-- Bob, Charlie et Diana ont participé à la session 2 (complétée)
INSERT INTO participants (session_id, user_id, session_score, completed) VALUES
  (2, 3, 285, true),
  (2, 4, 242, true),
  (2, 5, 198, true);

-- Réponses de Bob pour la session 2
INSERT INTO answers (participant_id, product_id, guessed_price, score) VALUES
  (2, 2, 1150.00, 51),   -- MacBook (vrai: 1199, diff: 49)
  (2, 4, 1400.00, 51),   -- iPad (vrai: 1449, diff: 49)
  (2, 5, 950.00, 49),    -- Apple Watch (vrai: 899, diff: 51)
  (2, 3, 300.00, 79);    -- AirPods (vrai: 279, diff: 21)

-- Réponses de Charlie pour la session 2
INSERT INTO answers (participant_id, product_id, guessed_price, score) VALUES
  (3, 2, 1100.00, 1),    -- MacBook (diff: 99)
  (3, 4, 1350.00, 1),    -- iPad (diff: 99)
  (3, 5, 850.00, 51),    -- Apple Watch (diff: 49)
  (3, 3, 250.00, 71);    -- AirPods (diff: 29)

-- Réponses de Diana pour la session 2
INSERT INTO answers (participant_id, product_id, guessed_price, score) VALUES
  (4, 2, 1250.00, 49),   -- MacBook (diff: 51)
  (4, 4, 1500.00, 49),   -- iPad (diff: 51)
  (4, 5, 900.00, 99),    -- Apple Watch (diff: 1)
  (4, 3, 280.00, 99);    -- AirPods (diff: 1)

-- ============================================
-- Mettre à jour la visibilité des sessions
-- ============================================
UPDATE sessions SET visibility = 'friends_only', max_participants = 5 WHERE id = 1;
UPDATE sessions SET visibility = 'public' WHERE id = 2;
UPDATE sessions SET visibility = 'private' WHERE id = 3;

-- ============================================
-- Données de test : Friendships
-- ============================================
-- Alice et Bob sont amis
INSERT INTO friendships (user_id_1, user_id_2) VALUES (2, 3);
-- Charlie et Diana sont amis
INSERT INTO friendships (user_id_1, user_id_2) VALUES (4, 5);
-- Bob et Charlie sont amis
INSERT INTO friendships (user_id_1, user_id_2) VALUES (3, 4);

-- ============================================
-- Données de test : Friend Requests
-- ============================================
-- Diana a envoyé une demande à Alice (en attente)
INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (5, 2, 'pending');
-- Charlie a envoyé une demande à Alice (rejetée)
INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (4, 2, 'rejected');

-- ============================================
-- Données de test : Session Invites
-- ============================================
-- Admin invite Bob à la session 3 (private)
INSERT INTO session_invites (session_id, inviter_id, invitee_id, status) VALUES (3, 1, 3, 'pending');
-- Admin invite Alice à la session 3 (acceptée)
INSERT INTO session_invites (session_id, inviter_id, invitee_id, status) VALUES (3, 1, 2, 'accepted');

-- ============================================
-- Afficher les tables créées
-- ============================================
\dt

-- ============================================
-- Afficher un résumé des données
-- ============================================
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Products', COUNT(*) FROM products
UNION ALL
SELECT 'Sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'Session Products', COUNT(*) FROM session_products
UNION ALL
SELECT 'Participants', COUNT(*) FROM participants
UNION ALL
SELECT 'Answers', COUNT(*) FROM answers
UNION ALL
SELECT 'Friendships', COUNT(*) FROM friendships
UNION ALL
SELECT 'Friend Requests', COUNT(*) FROM friend_requests
UNION ALL
SELECT 'Session Invites', COUNT(*) FROM session_invites
UNION ALL
SELECT 'Messages', COUNT(*) FROM messages;

-- ============================================
-- Classement mondial des joueurs
-- ============================================
SELECT 
  username,
  total_score,
  games_played,
  ROUND(average_score, 2) as avg_score,
  best_session_score
FROM users
WHERE role = 'user'
ORDER BY total_score DESC
LIMIT 10;

-- ============================================
-- Vue helper: Liste des amis d'un utilisateur
-- ============================================
CREATE OR REPLACE VIEW user_friends AS
SELECT 
  user_id_1 as user_id,
  user_id_2 as friend_id,
  u.username as friend_username,
  u.email as friend_email,
  f.created_at
FROM friendships f
JOIN users u ON u.id = f.user_id_2
UNION ALL
SELECT 
  user_id_2 as user_id,
  user_id_1 as friend_id,
  u.username as friend_username,
  u.email as friend_email,
  f.created_at
FROM friendships f
JOIN users u ON u.id = f.user_id_1;

COMMENT ON VIEW user_friends IS 'Bidirectional view of friendships for easy querying';
