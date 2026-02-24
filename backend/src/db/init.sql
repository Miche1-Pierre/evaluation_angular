-- Create database (run this first as superuser)
-- CREATE DATABASE evaluation_angular;

-- Connect to the database
\c evaluation_angular;

-- Create examples table
CREATE TABLE IF NOT EXISTS examples (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO examples (name, description) VALUES
  ('Example 1', 'This is the first example'),
  ('Example 2', 'This is the second example'),
  ('Example 3', 'This is the third example');

-- Create index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_examples_name ON examples(name);

-- Display all tables
\dt
