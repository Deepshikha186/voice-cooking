import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Search } from 'lucide-react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import RecipeList from '../components/RecipeList';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { 
    isListening, 
    transcript, 
    error: speechError, 
    toggleListening,
    setTranscript
  } = useSpeechRecognition();

  // Update search query when transcript changes
  useEffect(() => {
    if (transcript) {
      setSearchQuery(transcript);
    }
  }, [transcript]);

  const handleClear = () => {
    setSearchQuery('');
    setTranscript('');
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
          Voice Control <span className="text-gradient">Cooking App</span>
        </h1>
        <p style={{ 
          color: 'var(--text-muted)', 
          fontSize: '1.25rem', 
          maxWidth: '600px', 
          margin: '0 auto' 
        }}>
          Search for recipes and cook hands-free with real-time audio instructions and automatic timers.
        </p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <div className="input-group">
            <Search className="input-icon" size={20} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search recipes (e.g., 'Pasta', 'Oatmeal')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingRight: '4rem' }}
            />
            {searchQuery && (
              <button 
                onClick={handleClear}
                style={{ 
                  position: 'absolute', 
                  right: '4rem', 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                Clear
              </button>
            )}
            <button 
              className={`btn-icon ${isListening ? 'btn-danger' : ''}`}
              onClick={toggleListening}
              style={{ 
                position: 'absolute', 
                right: '0.5rem',
                border: 'none',
                background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                color: isListening ? 'var(--danger)' : 'var(--primary)',
                padding: '0.5rem',
              }}
              title={isListening ? "Stop listening" : "Start voice search"}
            >
              {isListening ? (
                <div style={{ position: 'relative' }}>
                  <MicOff size={24} />
                  <div className="recording-indicator" style={{ position: 'absolute', top: -4, right: -4 }}></div>
                </div>
              ) : (
                <Mic size={24} />
              )}
            </button>
          </div>
          {speechError && (
            <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '0.5rem', textAlign: 'center' }}>
              Error accessing microphone: {speechError}
            </p>
          )}
          {isListening && (
            <p style={{ color: 'var(--accent)', fontSize: '0.875rem', marginTop: '0.5rem', textAlign: 'center' }} className="animate-fade-in">
              Listening for recipe search...
            </p>
          )}
        </div>

        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
            {searchQuery ? `Search Results for "${searchQuery}"` : 'All Recipes'}
          </h2>
          <RecipeList searchQuery={searchQuery} />
        </div>
      </div>
    </div>
  );
};

export default Home;
