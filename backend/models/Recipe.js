import mongoose from 'mongoose';

const stepSchema = new mongoose.Schema({
  instruction: {
    type: String,
    required: true,
  },
  timerSeconds: {
    type: Number,
    default: null,
  },
});

const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  ingredients: [{
    type: String,
  }],
  steps: [stepSchema],
  imageUrl: {
    type: String,
  }
}, { timestamps: true });

const Recipe = mongoose.model('Recipe', recipeSchema);

export default Recipe;
