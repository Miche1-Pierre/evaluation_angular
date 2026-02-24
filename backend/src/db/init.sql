-- Create database (run this first as superuser if needed)
-- CREATE DATABASE angular;

-- Connect to the database
\c angular;

-- Drop existing tables and types (for clean init)
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS session_products CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS session_status CASCADE;
DROP TYPE IF EXISTS session_difficulty CASCADE;

-- ============================================
-- ENUM Types
-- ============================================
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE session_status AS ENUM ('active', 'completed', 'archived');
CREATE TYPE session_difficulty AS ENUM ('easy', 'medium', 'hard');

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
-- Une session de jeu créée par un administrateur
-- ============================================
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status session_status DEFAULT 'active',
  difficulty session_difficulty DEFAULT 'medium',
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
-- Indexes pour optimiser les performances
-- ============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_sessions_creator ON sessions(creator_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_session_products_session ON session_products(session_id);
CREATE INDEX idx_participants_session ON participants(session_id);
CREATE INDEX idx_participants_user ON participants(user_id);
CREATE INDEX idx_answers_participant ON answers(participant_id);

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
SELECT 'Answers', COUNT(*) FROM answers;

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
