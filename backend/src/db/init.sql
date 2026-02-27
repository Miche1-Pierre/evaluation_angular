-- ============================================
-- DATABASE INITIALIZATION - STRUCTURE ONLY
-- Pi & Rho's Games - Angular Evaluation Project
-- ============================================

-- Create database (run this first as superuser if needed)
-- CREATE DATABASE angular;

-- Connect to the database
\c angular;

-- ============================================
-- Drop existing tables and types (for clean init)
-- ============================================
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
-- Catégories de produits (générées depuis DummyJSON)
-- ============================================
CREATE TABLE themes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: products
-- Produits liés à un theme
-- ============================================
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: sessions
-- Sessions de jeu
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
-- Les 4 produits sélectionnés pour une session
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
-- Participants à une session
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
-- Réponses d'un participant pour chaque produit
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
-- Relations d'amitié (bidirectionnelle)
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
-- Demandes d'amitié en attente
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
-- Invitations aux sessions privées
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
-- Messages entre amis
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

-- ============================================
-- Afficher les tables créées
-- ============================================
\dt

SELECT '✅ Database structure initialized successfully!' as status;

