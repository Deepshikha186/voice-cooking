import express from 'express';
import Recipe from '../models/Recipe.js';

const router = express.Router();

// Get all recipes or search by query
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    let query = {};
    if (q) {
      query = { title: { $regex: q, $options: 'i' } };
    }
    const recipes = await Recipe.find(query);
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single recipe by ID
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
