import React, { useState, useEffect } from 'react';
import { Play, Clock, ChefHat } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5001/api/recipes';

const RecipeList = ({ searchQuery }) => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        const url = searchQuery 
          ? `${API_URL}?q=${encodeURIComponent(searchQuery)}` 
          : API_URL;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch recipes');
        }
        const data = await response.json();
        setRecipes(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Add a small debounce if typing text
    const timeoutId = setTimeout(() => {
      fetchRecipes();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div className="recording-indicator" style={{ background: 'var(--primary)' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
        <p>Error: {error}</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
          Make sure the backend server and MongoDB are running.
        </p>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
        <ChefHat size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
        <h3>No recipes found</h3>
        <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search query.</p>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
      gap: '2rem',
      marginTop: '2rem'
    }}>
      {recipes.map((recipe, index) => {
        // Calculate total time by summing timerSeconds in steps.
        const totalTimerSeconds = recipe.steps.reduce((total, step) => {
          return total + (step.timerSeconds || 0);
        }, 0);
        
        const minutes = Math.floor(totalTimerSeconds / 60);

        return (
          <Link 
            to={`/recipe/${recipe._id}`} 
            key={recipe._id} 
            className="glass-panel animate-fade-in"
            style={{ 
              textDecoration: 'none', 
              color: 'inherit',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              animationDelay: `${index * 0.1}s`
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'var(--glass-shadow)';
            }}
          >
            {recipe.imageUrl && (
              <div style={{ height: '200px', width: '100%', overflow: 'hidden' }}>
                <img 
                  src={recipe.imageUrl} 
                  alt={recipe.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
            )}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>{recipe.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>
                {recipe.description || 'A delicious recipe.'}
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  <Clock size={16} />
                  <span>{minutes > 0 ? `~${minutes} min prep` : 'Quick prep'}</span>
                </div>
                
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.25rem',
                  color: 'var(--primary)', 
                  fontWeight: '500',
                  fontSize: '0.9rem'
                }}>
                  Cook <Play size={16} fill="currentColor" />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default RecipeList;
