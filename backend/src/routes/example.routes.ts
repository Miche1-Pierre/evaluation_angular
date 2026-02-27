import { Router, Request, Response } from 'express';
import { pool } from '../config/database';

const router = Router();

// GET all examples
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM examples ORDER BY id DESC');
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching examples:', error);
    res.status(500).json({ error: 'Failed to fetch examples' });
  }
});

// GET single example by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM examples WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Example not found' });
    }
    
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching example:', error);
    res.status(500).json({ error: 'Failed to fetch example' });
  }
});

// POST create new example
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const result = await pool.query(
      'INSERT INTO examples (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error creating example:', error);
    res.status(500).json({ error: 'Failed to create example' });
  }
});

// PUT update example
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const result = await pool.query(
      'UPDATE examples SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Example not found' });
    }
    
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error updating example:', error);
    res.status(500).json({ error: 'Failed to update example' });
  }
});

// DELETE example
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM examples WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Example not found' });
    }
    
    res.json({ message: 'Example deleted successfully', data: result.rows[0] });
  } catch (error) {
    console.error('Error deleting example:', error);
    res.status(500).json({ error: 'Failed to delete example' });
  }
});

export default router;
