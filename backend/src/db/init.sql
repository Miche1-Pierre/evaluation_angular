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
DROP TABLE IF EXISTS themes CASCADE;
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
-- Table: themes
-- Contient les thèmes de produits disponibles
-- ============================================
CREATE TABLE themes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: products
-- Contient la liste de tous les produits disponibles
-- ============================================
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
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
CREATE INDEX idx_products_theme ON products(theme_id);
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
-- Données de test : Thèmes
-- ============================================
INSERT INTO themes (name, description, icon) VALUES
  ('Tech & Gadgets', 'Smartphones, laptops, écouteurs et gadgets électroniques', 'bx-devices'),
  ('Voitures de Luxe', 'Voitures de prestige et véhicules haut de gamme', 'bx-car'),
  ('Mode & Accessoires', 'Vêtements, chaussures et accessoires de luxe', 'bx-shopping-bag'),
  ('Gastronomie', 'Plats de restaurants étoilés et expériences culinaires', 'bx-restaurant'),
  ('Vins & Spiritueux', 'Grands crus, champagnes et spiritueux d''exception', 'bx-wine'),
  ('Montres de Luxe', 'Montres de prestige et haute horlogerie', 'bx-time'),
  ('Voyages & Hôtels', 'Séjours de luxe et destinations d''exception', 'bx-map'),
  ('Immobilier', 'Propriétés, appartements et villas', 'bx-home'),
  ('Art & Œuvres', 'Tableaux, sculptures et œuvres d''art', 'bx-palette'),
  ('Sport & Fitness', 'Équipements sportifs et abonnements premium', 'bx-dumbbell');

-- ============================================
-- Données de test : Produits par thème
-- ============================================

-- Thème 1: Tech & Gadgets (20 produits)
INSERT INTO products (theme_id, name, price, image_url) VALUES
  (1, 'iPhone 15 Pro Max', 1479.00, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400'),
  (1, 'MacBook Air M3', 1299.00, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'),
  (1, 'Samsung Galaxy S24 Ultra', 1399.00, 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400'),
  (1, 'iPad Pro 12.9" M4', 1549.00, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400'),
  (1, 'Apple Watch Ultra 2', 899.00, 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400'),
  (1, 'AirPods Pro (2ème gen)', 279.00, 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=400'),
  (1, 'Sony WH-1000XM5', 399.00, 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400'),
  (1, 'PlayStation 5', 549.99, 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400'),
  (1, 'Xbox Series X', 499.99, 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400'),
  (1, 'Nintendo Switch OLED', 349.99, 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400'),
  (1, 'DJI Mini 4 Pro (Drone)', 759.00, 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400'),
  (1, 'GoPro Hero 12 Black', 449.99, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'),
  (1, 'Meta Quest 3 (VR)', 549.00, 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=400'),
  (1, 'Bose SoundLink Revolve+', 329.00, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400'),
  (1, 'Dyson V15 Detect', 749.00, 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400'),
  (1, 'Kindle Paperwhite Signature', 189.99, 'https://images.unsplash.com/photo-1592168415497-102b8d37f1e4?w=400'),
  (1, 'Ring Video Doorbell Pro 2', 249.99, 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400'),
  (1, 'Sonos Arc Soundbar', 899.00, 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=400'),
  (1, 'Logitech MX Master 3S', 109.99, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'),
  (1, 'Herman Miller Aeron Chair', 1795.00, 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400');

-- Thème 2: Voitures de Luxe (20 produits)
INSERT INTO products (theme_id, name, price, image_url) VALUES
  (2, 'Ferrari SF90 Stradale', 507000.00, 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400'),
  (2, 'Lamborghini Huracán EVO', 261274.00, 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400'),
  (2, 'Porsche 911 Turbo S', 207000.00, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400'),
  (2, 'Rolls-Royce Phantom', 460000.00, 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400'),
  (2, 'Bentley Continental GT', 214600.00, 'https://images.unsplash.com/photo-1612825173281-9a193378527e?w=400'),
  (2, 'Aston Martin DB11', 205600.00, 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400'),
  (2, 'McLaren 720S', 299000.00, 'https://images.unsplash.com/photo-1621135802920-133df287f89c?w=400'),
  (2, 'Mercedes-AMG GT Black Series', 325000.00, 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400'),
  (2, 'BMW M8 Competition', 147000.00, 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400'),
  (2, 'Audi R8 V10 Performance', 158600.00, 'https://images.unsplash.com/photo-1614165936126-403e013b2fcb?w=400'),
  (2, 'Jaguar F-Type R', 103200.00, 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=400'),
  (2, 'Maserati MC20', 212000.00, 'https://images.unsplash.com/photo-1614165908046-2c0506d8bea7?w=400'),
  (2, 'Corvette C8 Z06', 106395.00, 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=400'),
  (2, 'Tesla Model S Plaid', 107400.00, 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400'),
  (2, 'Lexus LC 500', 98000.00, 'https://images.unsplash.com/photo-1555626906-fcf10d6851b4?w=400'),
  (2, 'Alfa Romeo Giulia Quadrifoglio', 79945.00, 'https://images.unsplash.com/photo-1610712741822-61063f99ffa9?w=400'),
  (2, 'Genesis G90', 89350.00, 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=400'),
  (2, 'Cadillac CT5-V Blackwing', 89990.00, 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=400'),
  (2, 'Nissan GT-R Nismo', 215000.00, 'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=400'),
  (2, 'Acura NSX Type S', 169500.00, 'https://images.unsplash.com/photo-1606016159260-4818c7c3d5c2?w=400');

-- Thème 3: Mode & Accessoires (20 produits)
INSERT INTO products (theme_id, name, price, image_url) VALUES
  (3, 'Sac Hermès Birkin 35', 15000.00, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400'),
  (3, 'Sac Chanel Classic Flap', 8800.00, 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400'),
  (3, 'Sac Louis Vuitton Neverfull', 1760.00, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400'),
  (3, 'Baskets Nike Air Jordan 1 Retro High', 170.00, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'),
  (3, 'Baskets Balenciaga Triple S', 995.00, 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400'),
  (3, 'Baskets Yeezy Boost 350 V2', 220.00, 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=400'),
  (3, 'Montre Casio G-Shock Gold', 380.00, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'),
  (3, 'Blouson cuir Saint Laurent', 5990.00, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400'),
  (3, 'Manteau Burberry Trench', 2290.00, 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400'),
  (3, 'Jeans Levi''s 501 Original', 98.00, 'https://images.unsplash.com/photo-1542272454315-7f6b177567d3?w=400'),
  (3, 'Lunettes Ray-Ban Aviator', 154.00, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400'),
  (3, 'Lunettes Gucci GG0061S', 420.00, 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400'),
  (3, 'Ceinture Gucci GG', 450.00, 'https://images.unsplash.com/photo-1624222247344-550fb60583c2?w=400'),
  (3, 'Écharpe Burberry Cachemire', 490.00, 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400'),
  (3, 'Casquette Supreme Box Logo', 58.00, 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400'),
  (3, 'T-shirt Balmain Logo', 395.00, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'),
  (3, 'Chemise Ralph Lauren Oxford', 98.00, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400'),
  (3, 'Sweat Off-White Arrows', 685.00, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400'),
  (3, 'Boots Dr. Martens 1460', 170.00, 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400'),
  (3, 'Escarpins Louboutin So Kate', 795.00, 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400');

-- Thème 4: Gastronomie (20 produits)
INSERT INTO products (theme_id, name, price, image_url) VALUES
  (4, 'Menu dégustation Guy Savoy (3 étoiles)', 395.00, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400'),
  (4, 'Menu Alain Ducasse au Plaza Athénée', 395.00, 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400'),
  (4, 'Dîner Arpège (Alain Passard)', 340.00, 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=400'),
  (4, 'Menu Le Cinq (George V)', 310.00, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400'),
  (4, 'Wagyu A5 Kobe (200g)', 250.00, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400'),
  (4, 'Homard breton entier (1kg)', 85.00, 'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=400'),
  (4, 'Caviar Beluga Impérial (50g)', 420.00, 'https://images.unsplash.com/photo-1535140728325-a4d3707eee61?w=400'),
  (4, 'Plateau fruits de mer Royal', 125.00, 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400'),
  (4, 'Truffe blanche d''Alba (100g)', 450.00, 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=400'),
  (4, 'Foie gras entier du Périgord (500g)', 89.00, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400'),
  (4, 'Menu omakase Sushi Saito', 450.00, 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400'),
  (4, 'Brunch Four Seasons Hotel George V', 145.00, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400'),
  (4, 'Afternoon Tea Ritz Paris', 88.00, 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=400'),
  (4, 'Pizza Margherita Da Michele (Naples)', 12.00, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400'),
  (4, 'Burger Black Label (Le Comptoir)', 34.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'),
  (4, 'Ramen Ichiran Tonkotsu', 15.00, 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=400'),
  (4, 'Paëlla Valenciana (4 pers)', 68.00, 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=400'),
  (4, 'Bouillabaisse marseillaise', 55.00, 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=400'),
  (4, 'Tarte Tatin maison', 24.00, 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=400'),
  (4, 'Soufflé au Grand Marnier', 32.00, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400');

-- Thème 5: Vins & Spiritueux (20 produits)
INSERT INTO products (theme_id, name, price, image_url) VALUES
  (5, 'Champagne Dom Pérignon Vintage 2012', 189.00, 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=400'),
  (5, 'Champagne Krug Grande Cuvée', 215.00, 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=400'),
  (5, 'Château Margaux 2015', 850.00, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400'),
  (5, 'Château Lafite Rothschild 2010', 1200.00, 'https://images.unsplash.com/photo-1586370434639-0fe43b2d32d6?w=400'),
  (5, 'Pétrus Pomerol 2016', 3500.00, 'https://images.unsplash.com/photo-1566094351253-c88c2b039bc0?w=400'),
  (5, 'Romanée-Conti Grand Cru 2018', 15000.00, 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400'),
  (5, 'Whisky Macallan 25 ans', 2200.00, 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400'),
  (5, 'Whisky Glenfiddich 18 ans', 89.00, 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400'),
  (5, 'Cognac Louis XIII Rémy Martin', 3400.00, 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400'),
  (5, 'Armagnac Château de Laubade 1973', 450.00, 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400'),
  (5, 'Porto Vintage Taylor''s 1977', 380.00, 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400'),
  (5, 'Rhum Zacapa Centenario 23 ans', 68.00, 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400'),
  (5, 'Vodka Belvedere Intense', 45.00, 'https://images.unsplash.com/photo-1600699097842-a629575a3ab4?w=400'),
  (5, 'Gin Hendrick''s Orbium', 42.00, 'https://images.unsplash.com/photo-1621976360623-004223992275?w=400'),
  (5, 'Tequila Don Julio 1942', 165.00, 'https://images.unsplash.com/photo-1601024445121-e5b82f020549?w=400'),
  (5, 'Mezcal Del Maguey Vida', 38.00, 'https://images.unsplash.com/photo-1601024445121-e5b82f020549?w=400'),
  (5, 'Saké Dassai 23 Junmai Daiginjo', 150.00, 'https://images.unsplash.com/photo-1582106245687-0571a8a7b689?w=400'),
  (5, 'Vin jaune Château-Chalon 2012', 95.00, 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?w=400'),
  (5, 'Pommard 1er Cru Les Rugiens 2017', 125.00, 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400'),
  (5, 'Barolo Riserva Monfortino 2013', 380.00, 'https://images.unsplash.com/photo-1566094351253-c88c2b039bc0?w=400');

-- Thème 6: Montres de Luxe (20 produits)
INSERT INTO products (theme_id, name, price, image_url) VALUES
  (6, 'Rolex Submariner Date', 10500.00, 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400'),
  (6, 'Rolex Daytona Cosmograph', 35000.00, 'https://images.unsplash.com/photo-1587836374618-4fe6f0755b02?w=400'),
  (6, 'Patek Philippe Nautilus 5711', 85000.00, 'https://images.unsplash.com/photo-1587836374618-4fe6f0755b02?w=400'),
  (6, 'Audemars Piguet Royal Oak', 28000.00, 'https://images.unsplash.com/photo-1611128256228-dcf02d1e1b52?w=400'),
  (6, 'Omega Speedmaster Professional', 6800.00, 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=400'),
  (6, 'TAG Heuer Carrera Calibre 16', 4900.00, 'https://images.unsplash.com/photo-1606390348969-8d5a2c22a768?w=400'),
  (6, 'Hublot Big Bang Unico', 18900.00, 'https://images.unsplash.com/photo-1611087434929-a4c8cf7b1f17?w=400'),
  (6, 'Breitling Navitimer B01', 9100.00, 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=400'),
  (6, 'IWC Portuguese Chronograph', 12400.00, 'https://images.unsplash.com/photo-1611087434929-a4c8cf7b1f17?w=400'),
  (6, 'Cartier Santos de Cartier', 7750.00, 'https://images.unsplash.com/photo-1611087434929-a4c8cf7b1f17?w=400'),
  (6, 'Jaeger-LeCoultre Reverso', 6800.00, 'https://images.unsplash.com/photo-1611087434929-a4c8cf7b1f17?w=400'),
  (6, 'Vacheron Constantin Overseas', 24500.00, 'https://images.unsplash.com/photo-1611087434929-a4c8cf7b1f17?w=400'),
  (6, 'Panerai Luminor Marina', 8900.00, 'https://images.unsplash.com/photo-1611087434929-a4c8cf7b1f17?w=400'),
  (6, 'Breguet Classique', 17800.00, 'https://images.unsplash.com/photo-1611087434929-a4c8cf7b1f17?w=400'),
  (6, 'Zenith El Primero Chronomaster', 9200.00, 'https://images.unsplash.com/photo-1611087434929-a4c8cf7b1f17?w=400'),
  (6, 'Chopard L.U.C XPS', 11500.00, 'https://images.unsplash.com/photo-1611087434929-a4c8cf7b1f17?w=400'),
  (6, 'Tudor Black Bay Fifty-Eight', 3750.00, 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=400'),
  (6, 'Longines Master Collection', 2450.00, 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=400'),
  (6, 'Tissot PRX Powermatic 80', 675.00, 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=400'),
  (6, 'Seiko Prospex Diver', 450.00, 'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=400');

-- Thème 7: Voyages & Hôtels (20 produits)
INSERT INTO products (theme_id, name, price, image_url) VALUES
  (7, 'Suite Royale Burj Al Arab (1 nuit)', 24000.00, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400'),
  (7, 'Villa sur pilotis Maldives (7 nuits)', 15000.00, 'https://images.unsplash.com/photo-1540202404-1b927e27fa8b?w=400'),
  (7, 'Safari de luxe Tanzanie (10 jours)', 8500.00, 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400'),
  (7, 'Croisière Regent Seven Seas (14 jours)', 12000.00, 'https://images.unsplash.com/photo-1545554064-df58ac1462ad?w=400'),
  (7, 'Ritz Paris Suite Impériale (1 nuit)', 18000.00, 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400'),
  (7, 'Four Seasons Bora Bora (5 nuits)', 9500.00, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400'),
  (7, 'Aman Tokyo Suite (3 nuits)', 4800.00, 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400'),
  (7, 'Singita Kruger (4 nuits)', 7200.00, 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=400'),
  (7, 'Hôtel de Glace Suède (2 nuits)', 1200.00, 'https://images.unsplash.com/photo-1543257580-7269da773bf5?w=400'),
  (7, 'Atlantis The Palm Dubai (5 nuits)', 3500.00, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'),
  (7, 'Billet vol Business Class Paris-NYC', 4500.00, 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400'),
  (7, 'Billet First Class Emirates Dubai-Londres', 6800.00, 'https://images.unsplash.com/photo-1583511666407-5f06533f2113?w=400'),
  (7, 'Séjour ski Courchevel (1 semaine)', 5500.00, 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400'),
  (7, 'Tour privé Machu Picchu (5 jours)', 3200.00, 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=400'),
  (7, 'Retraite yoga Ubud Balii (7 jours)', 2800.00, 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=400'),
  (7, 'Plongée Grande Barrière Australie (5 jours)', 2400.00, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'),
  (7, 'Orient Express Venise-Istanbul (3 jours)', 8900.00, 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400'),
  (7, 'Road trip Islande (10 jours)', 4200.00, 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=400'),
  (7, 'Hélicoptère survol Grand Canyon', 450.00, 'https://images.unsplash.com/photo-1473163928189-364b2c4e1135?w=400'),
  (7, 'Montgolfière Cappadoce Turquie', 180.00, 'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=400');

-- Thème 8: Immobilier (20 produits)
INSERT INTO products (theme_id, name, price, image_url) VALUES
  (8, 'Villa Cannes Vue Mer (200m²)', 4500000.00, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400'),
  (8, 'Penthouse New York Manhattan', 12000000.00, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400'),
  (8, 'Château Bordeaux Vignoble (15 hectares)', 8500000.00, 'https://images.unsplash.com/photo-1605016622442-5892c2a14137?w=400'),
  (8, 'Appartement Paris Triangle d''Or (150m²)', 3800000.00, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'),
  (8, 'Chalet Méribel Ski-in/Ski-out', 5200000.00, 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400'),
  (8, 'Villa Ibiza Front de Mer', 6800000.00, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400'),
  (8, 'Loft Brooklyn Converti (300m²)', 2400000.00, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400'),
  (8, 'Mas Provençal Luberon (250m²)', 1800000.00, 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=400'),
  (8, 'Appartement Monaco Port Hercule', 15000000.00, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400'),
  (8, 'Maison Architecte Lyon Croix-Rousse', 1200000.00, 'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=400'),
  (8, 'Duplex Londres Notting Hill', 4200000.00, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400'),
  (8, 'Propriété Toscane Oliveraie', 3500000.00, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400'),
  (8, 'Studio Paris Quartier Latin (35m²)', 420000.00, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400'),
  (8, '3P Neuilly-sur-Seine (85m²)', 950000.00, 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400'),
  (8, 'Maison Bordeaux Chartrons (180m²)', 1350000.00, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400'),
  (8, 'Appartement Miami South Beach', 1800000.00, 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=400'),
  (8, 'Chalet Chamonix Mont-Blanc', 2200000.00, 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400'),
  (8, 'Riad Marrakech Médina', 680000.00, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400'),
  (8, 'Villa Bali Canggu (4 chambres)', 550000.00, 'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=400'),
  (8, 'Ferme rénovée Normandie (300m²)', 750000.00, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400');

-- Thème 9: Art & Œuvres (20 produits)
INSERT INTO products (theme_id, name, price, image_url) VALUES
  (9, 'Tableau Banksy "Girl with Balloon"', 1200000.00, 'https://imagesexpiresunsplash.com/photo-1547826039-bfc35e0f1ea8?w=400'),
  (9, 'Sculpture Rodin "Le Penseur" (reproduction certifiée)', 85000.00, 'https://images.unsplash.com/photo-1578926078052-1928d60d4df9?w=400'),
  (9, 'Lithographie Picasso signée', 45000.00, 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400'),
  (9, 'Photographie Ansel Adams "Moonrise"', 28000.00, 'https://images.unsplash.com/photo-1569172122301-bc5008bc09c5?w=400'),
  (9, 'Toile contemporaine Damien Hirst', 95000.00, 'https://images.unsplash.com/photo-1536924430914-91f9e2041b83?w=400'),
  (9, 'Gravure Rembrandt XVII siècle', 125000.00, 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400'),
  (9, 'Sculpture bronze Jeff Koons "Balloon Dog"', 450000.00, 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?w=400'),
  (9, 'Peinture abstraite Gerhard Richter', 180000.00, 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=400'),
  (9, 'Sérigraphie Andy Warhol "Campbell Soup"', 65000.00, 'https://images.unsplash.com/photo-1536924430914-91f9e2041b83?w=400'),
  (9, 'Sculpture Giacometti "L''Homme qui marche"', 850000.00, 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?w=400'),
  (9, 'Tableau street art Shepard Fairey', 25000.00, 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=400'),
  (9, 'Photographie Robert Doisneau "Le Baiser"', 15000.00, 'https://images.unsplash.com/photo-1569172122301-bc5008bc09c5?w=400'),
  (9, 'Figurine KAWS Companion (édition limitée)', 12000.00, 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400'),
  (9, 'Toile Basquiat style (attribution incertaine)', 220000.00, 'https://images.unsplash.com/photo-1536924430914-91f9e2041b83?w=400'),
  (9, 'Affiche vintage Toulouse-Lautrec originale', 38000.00, 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400'),
  (9, 'Sculpture bois Brancusi "Mademoiselle Pogany"', 95000.00, 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?w=400'),
  (9, 'Print digital Beeple NFT (certificat)', 18000.00, 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=400'),
  (9, 'Tableau orientaliste XIXe Delacroix', 145000.00, 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400'),
  (9, 'Céramique Picasso "Visage"', 32000.00, 'https://images.unsplash.com/photo-1578301978162-7aae4d755744?w=400'),
  (9, 'Installation Yayoi Kusama "Infinity Room"', 350000.00, 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?w=400');

-- Thème 10: Sport & Fitness (20 produits)
INSERT INTO products (theme_id, name, price, image_url) VALUES
  (10, 'Vélo Cervélo S5 Dura-Ace Di2', 12000.00, 'https://images.unsplash.com/photo-1571333250630-f0230c320b6d?w=400'),
  (10, 'Home Gym Technogym Kinesis', 15000.00, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400'),
  (10, 'Tapis de course Peloton Tread+', 4295.00, 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400'),
  (10, 'Vélo elliptique NordicTrack FS14i', 2499.00, 'https://images.unsplash.com/photo-1583454155184-870725bbe043?w=400'),
  (10, 'Raquette tennis Wilson Pro Staff RF97', 239.00, 'https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=400'),
  (10, 'Clubs golf Callaway Epic Max Full Set', 3500.00, 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400'),
  (10, 'Ski Rossignol Hero Elite Plus', 1200.00, 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400'),
  (10, 'Snowboard Burton Custom X', 729.00, 'https://images.unsplash.com/photo-1542562232-7a63a1722d52?w=400'),
  (10, 'Planche surf Channel Islands Al Merrick', 695.00, 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=400'),
  (10, 'Paddle gonflable Red Paddle Co Elite', 1599.00, 'https://images.unsplash.com/photo-1593462676865-f1e6450c8d85?w=400'),
  (10, 'Combinaison plongée Aqua Lung SolAfx', 549.00, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'),
  (10, 'VTT Santa Cruz Nomad Carbon', 8999.00, 'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=400'),
  (10, 'Ballon basket Wilson Evolution', 64.99, 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400'),
  (10, 'Gants boxe Everlast Pro style', 89.99, 'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=400'),
  (10, 'Kayak gonflable Advanced Elements', 849.00, 'https://images.unsplash.com/photo-1544363170-141dd04c7a95?w=400'),
  (10, 'Abonnement annuel Fitness Park', 299.00, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400'),
  (10, 'Coach sportif personnel (10 séances)', 800.00, 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'),
  (10, 'Tenue running Nike ZoomX Vaporfly NEXT%', 275.00, 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400'),
  (10, 'Montre GPS Garmin Fenix 7X Solar', 899.00, 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400'),
  (10, 'Drone FPV racing TBS Tango 2', 1250.00, 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400');

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
