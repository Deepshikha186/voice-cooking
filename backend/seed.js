import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Recipe from './models/Recipe.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cooking-app';

const sampleRecipes = [
  {
    title: "Perfect Boiled Pasta",
    description: "A simple recipe for perfectly cooked al dente pasta.",
    imageUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80",
    ingredients: [
      "1 lb dried pasta (spaghetti or penne)",
      "4 quarts water",
      "2 tablespoons salt"
    ],
    steps: [
      {
        instruction: "First, prepare your ingredients. Get your pasta, salt, and a large pot.",
        timerSeconds: null
      },
      {
        instruction: "Fill the large pot with 4 quarts of water and place it on the stove over high heat.",
        timerSeconds: null
      },
      {
        instruction: "Wait for the water to come to a rolling boil. This usually takes about 10 minutes.",
        timerSeconds: 15 // Shortened for demo/testing purposes. Normally 600
      },
      {
        instruction: "The water is boiling! Add 2 tablespoons of salt to the water.",
        timerSeconds: null
      },
      {
        instruction: "Add the pasta to the boiling water and stir gently to prevent sticking.",
        timerSeconds: null
      },
      {
        instruction: "Boil the pasta until al dente.",
        timerSeconds: 30 // Shortened for demo/testing. Normally 480-600
      },
      {
        instruction: "The pasta is ready! Carefully drain the pasta in a colander in the sink. The recipe is complete.",
        timerSeconds: null
      }
    ]
  },
  {
    title: "Quick Microwave Oatmeal",
    description: "A fast and healthy breakfast ready in minutes.",
    imageUrl: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=800&q=80",
    ingredients: [
      "1/2 cup rolled oats",
      "1 cup milk or water",
      "Pinch of salt",
      "Toppings of your choice"
    ],
    steps: [
      {
        instruction: "Combine the oats, milk, and a pinch of salt in a microwave-safe bowl.",
        timerSeconds: null
      },
      {
        instruction: "Microwave on high for one and a half minutes.",
        timerSeconds: 20 // Shortened for demo
      },
      {
        instruction: "Carefully remove the bowl from the microwave. Stir well.",
        timerSeconds: null
      },
      {
        instruction: "Microwave for another 30 seconds if needed, otherwise it's done. Let it cool for a minute and add your favorite toppings.",
        timerSeconds: null
      }
    ]
  }
];

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB. Seeding database...');
    await Recipe.deleteMany({});
    console.log('Cleared existing recipes.');
    const inserted = await Recipe.insertMany(sampleRecipes);
    console.log(`Successfully seeded ${inserted.length} recipes.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  });
