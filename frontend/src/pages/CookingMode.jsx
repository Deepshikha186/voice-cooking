import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Mic, MicOff, Clock, CheckCircle, ChefHat } from 'lucide-react';
import useSpeechSynthesis from '../hooks/useSpeechSynthesis';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

const CookingMode = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Cooking state
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // -1 means starting screen, before steps
  const [isPlaying, setIsPlaying] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Custom hooks
  const { speak, cancel: stopSpeaking, isSpeaking } = useSpeechSynthesis();
  
  // Voice command hook just for "next", "previous", "pause", "resume"
  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening,
    setTranscript 
  } = useSpeechRecognition();

  // Audio ref for timer done sound
  const audioContext = useRef(null);

  useEffect(() => {
    // Initialize simple beep sound
    if (typeof window !== 'undefined') {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);

  const playBeep = () => {
    if (!audioContext.current || !soundEnabled) return;
    try {
      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.current.currentTime); // Beep frequency
      oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.current.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.5, audioContext.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + 0.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.current.destination);
      
      oscillator.start();
      oscillator.stop(audioContext.current.currentTime + 0.5);
    } catch(e) {
      console.error("Audio play failed", e);
    }
  };

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/recipes/${id}`);
        if (!response.ok) throw new Error('Recipe not found');
        const data = await response.json();
        setRecipe(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
    
    return () => {
      // Cleanup on unmount
      stopSpeaking();
      stopListening();
    };
  }, [id, stopSpeaking, stopListening]);

  // Voice command processing
  useEffect(() => {
    if (transcript) {
      const lower = transcript.toLowerCase();
      console.log("Voice command received:", lower);
      
      if (lower.includes('next') || lower.includes('forward')) {
        handleNextStep();
        setTranscript('');
      } else if (lower.includes('previous') || lower.includes('back')) {
        handlePrevStep();
        setTranscript('');
      } else if (lower.includes('pause') || lower.includes('stop')) {
        handlePause();
        setTranscript('');
      } else if (lower.includes('play') || lower.includes('resume') || lower.includes('start')) {
        if (!isPlaying) handlePlay();
        setTranscript('');
      } else if (lower.includes('repeat')) {
        readCurrentStep();
        setTranscript('');
      }
    }
  }, [transcript]);

  // Timer logic
  useEffect(() => {
    let interval;
    if (timerActive && timerRemaining > 0) {
      interval = setInterval(() => {
        setTimerRemaining(prev => prev - 1);
      }, 1000);
    } else if (timerActive && timerRemaining === 0) {
      // Timer finished!
      setTimerActive(false);
      playBeep();
      setTimeout(() => {
        playBeep();
        // Automatically go to next step after timer finishes and beeps twice
        setTimeout(() => {
           if(soundEnabled) speak("Timer finished. Moving to next step.");
           // Short delay before actual next step
           setTimeout(() => {
             handleNextStep();
           }, 2500);
        }, 1000);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerRemaining, soundEnabled]);


  const readCurrentStep = () => {
    if (!recipe || !soundEnabled) return;
    
    if (currentStepIndex === -1) {
      speak(`Welcome to ${recipe.title}. I will guide you through the recipe. Say "Next" or press Start to begin.`);
      return;
    }

    if (currentStepIndex < recipe.steps.length) {
      const step = recipe.steps[currentStepIndex];
      let textToRead = `Step ${currentStepIndex + 1}. ${step.instruction}`;
      
      if (step.timerSeconds) {
        textToRead += `. Starting a timer for ${step.timerSeconds} seconds now.`;
      }
      
      speak(textToRead, () => {
        // Callback when speech ends
        if (step.timerSeconds) {
          // If there's a timer, start it once the speaking finishes
          setTimerRemaining(step.timerSeconds);
          setTimerActive(true);
        } else {
          // If no timer, we just wait for user to say 'Next' manually (or we could auto-advance, but manual is safer for cooking)
          // Ensure voice recognition is active so they can say next
          if (!isListening) {
             startListening();
          }
        }
      });
    } else {
      speak("Recipe complete. Enjoy your meal!");
      setIsPlaying(false);
      stopListening();
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    if (currentStepIndex === -1) {
      setCurrentStepIndex(0);
    } else {
      // Resuming
      if (timerRemaining > 0 && !timerActive && recipe.steps[currentStepIndex]?.timerSeconds) {
         setTimerActive(true);
      } else {
         readCurrentStep();
      }
    }
    
    // Always start listening for commands when playing
    startListening();
  };

  const handlePause = () => {
    setIsPlaying(false);
    stopSpeaking();
    if (timerActive) {
      setTimerActive(false); // Pause timer
    }
  };

  const handleNextStep = () => {
    if (!recipe) return;
    stopSpeaking();
    if (currentStepIndex < recipe.steps.length) {
      setCurrentStepIndex(prev => prev + 1);
      setTimerActive(false);
      setTimerRemaining(0);
    }
  };

  const handlePrevStep = () => {
    stopSpeaking();
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setTimerActive(false);
      setTimerRemaining(0);
    }
  };

  // Trigger read when step index changes
  useEffect(() => {
    if (isPlaying && currentStepIndex >= 0) {
      readCurrentStep();
    }
  }, [currentStepIndex, isPlaying]);

  // Format timer displays
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="container" style={{ padding: '3rem', textAlign: 'center' }}>Loading recipe...</div>;
  if (error) return <div className="container" style={{ padding: '3rem', color: 'var(--danger)' }}>Error: {error}</div>;
  if (!recipe) return null;

  const currentStep = currentStepIndex >= 0 && currentStepIndex < recipe.steps.length 
    ? recipe.steps[currentStepIndex] 
    : null;

  const isCompleted = currentStepIndex >= recipe.steps.length;

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1rem', maxWidth: '800px', paddingBottom: '6rem' }}>
      
      {/* Header Info */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {recipe.imageUrl && (
          <img 
            src={recipe.imageUrl} 
            alt={recipe.title} 
            style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} 
          />
        )}
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{recipe.title}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{recipe.description}</p>
        </div>
      </div>

      {/* Main Cooking View */}
      <div className="glass-panel" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
        
        {/* Progress Bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, height: '4px', width: '100%', background: 'rgba(255,255,255,0.1)' }}>
          <div style={{ 
            height: '100%', 
            background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
            width: `${Math.min(100, Math.max(0, (currentStepIndex / recipe.steps.length) * 100))}%`,
            transition: 'width 0.5s ease'
          }}></div>
        </div>

        {/* Status Indicators row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <div>
            {currentStepIndex === -1 ? 'Ready to Start' : 
             isCompleted ? 'Finished' : 
             `Step ${currentStepIndex + 1} of ${recipe.steps.length}`}
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {isListening && (
              <span className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)' }}>
                <Mic size={14} /> Listening for 'Next'
              </span>
            )}
            {isSpeaking && (
              <span className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}>
                <Volume2 size={14} /> Speaking
              </span>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          {currentStepIndex === -1 && (
            <div style={{ textAlign: 'center' }}>
              <ChefHat size={64} style={{ margin: '0 auto 1.5rem auto', color: 'var(--primary)', opacity: 0.8 }} />
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Ingredients</h2>
              <ul style={{ textAlign: 'left', display: 'inline-block', color: 'var(--text-main)', fontSize: '1.1rem', lineHeight: '2' }}>
                {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
              </ul>
              <div style={{ marginTop: '2rem' }}>
                <button className="btn btn-primary" onClick={handlePlay} style={{ padding: '1rem 3rem', fontSize: '1.2rem' }}>
                  <Play size={24} fill="currentColor" /> Start Cooking
                </button>
              </div>
            </div>
          )}

          {currentStep && (
             <div className="animate-fade-in" key={currentStepIndex} style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.5rem', lineHeight: '1.4', fontWeight: '400', marginBottom: '2rem' }}>
                  {currentStep.instruction}
                </h2>
                
                {/* Timer Display if Applicable */}
                {(currentStep.timerSeconds || timerRemaining > 0) && (
                  <div style={{ 
                    marginTop: '2rem', 
                    display: 'inline-flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    padding: '2rem',
                    background: timerActive ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${timerActive ? 'var(--primary)' : 'var(--glass-border)'}`,
                    borderRadius: '50%',
                    width: '200px',
                    height: '200px',
                    justifyContent: 'center',
                    boxShadow: timerActive ? '0 0 30px rgba(139, 92, 246, 0.2)' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <Clock size={32} color={timerActive ? 'var(--primary)' : 'var(--text-muted)'} style={{ marginBottom: '0.5rem' }} />
                    <div style={{ 
                      fontSize: '3.5rem', 
                      fontWeight: '700', 
                      fontVariantNumeric: 'tabular-nums',
                      background: timerActive ? 'linear-gradient(to right, var(--primary), var(--secondary))' : 'var(--text-main)',
                      WebkitBackgroundClip: timerActive ? 'text' : '',
                      WebkitTextFillColor: timerActive ? 'transparent' : 'var(--text-main)'
                    }}>
                      {formatTime(timerRemaining)}
                    </div>
                    {timerActive && <div style={{ fontSize: '0.9rem', color: 'var(--primary)', marginTop: '0.5rem', animation: 'fadeIn 1s infinite alternate' }}>Timer Active</div>}
                  </div>
                )}
             </div>
          )}

          {isCompleted && (
            <div style={{ textAlign: 'center', color: 'var(--success)' }}>
              <CheckCircle size={80} style={{ margin: '0 auto 1.5rem auto' }} />
              <h2 style={{ fontSize: '2.5rem', color: 'var(--text-main)' }}>Bon Appétit!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginTop: '1rem' }}>You have completed the recipe.</p>
              <button className="btn" onClick={() => navigate('/')} style={{ marginTop: '2rem', border: '1px solid var(--glass-border)' }}>
                Return to Search
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Control Bar */}
      <div style={{ 
        position: 'fixed', 
        bottom: '2rem', 
        left: '50%', 
        transform: 'translateX(-50%)',
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-full)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        zIndex: 100
      }}>
        <button className="btn-icon" onClick={() => setSoundEnabled(!soundEnabled)} title="Toggle Audio">
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} color="var(--danger)" />}
        </button>
        
        <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)' }}></div>

        <button 
          className="btn-icon" 
          onClick={handlePrevStep} 
          disabled={currentStepIndex <= 0 || isCompleted}
          style={{ opacity: (currentStepIndex <= 0 || isCompleted) ? 0.3 : 1 }}
        >
          <SkipBack size={20} />
        </button>

        {isPlaying ? (
          <button 
            className="btn-icon" 
            onClick={handlePause} 
            style={{ 
              background: 'var(--danger)', 
              color: 'white', 
              border: 'none',
              width: '56px',
              height: '56px'
            }}
          >
            <Pause size={24} fill="currentColor" />
          </button>
        ) : (
          <button 
            className="btn-icon" 
            onClick={handlePlay} 
            disabled={isCompleted}
            style={{ 
              background: isCompleted ? 'var(--glass-bg)' : 'linear-gradient(135deg, var(--primary), var(--secondary))', 
              color: 'white', 
              border: 'none',
              width: '56px',
              height: '56px',
              opacity: isCompleted ? 0.5 : 1
            }}
          >
            <Play size={24} fill="currentColor" style={{ marginLeft: '4px' }} />
          </button>
        )}

        <button 
          className="btn-icon" 
          onClick={handleNextStep} 
          disabled={isCompleted || currentStepIndex === -1}
          style={{ opacity: (isCompleted || currentStepIndex === -1) ? 0.3 : 1 }}
        >
          <SkipForward size={20} />
        </button>

        <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)' }}></div>

        <button 
          className={`btn-icon ${isListening ? 'btn-danger' : ''}`}
          onClick={isListening ? stopListening : startListening}
          title={isListening ? "Stop listening for commands" : "Start listening for commands"}
          style={{
            background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
            color: isListening ? 'var(--danger)' : 'var(--text-main)',
            border: isListening ? '1px solid var(--danger)' : '1px solid var(--glass-border)'
          }}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

      </div>
      
      {/* Voice Commands Helper Text */}
      <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <p>💡 Tip: While playing, you can say <strong style={{ color: 'var(--primary)' }}>"Next"</strong>, <strong style={{ color: 'var(--primary)' }}>"Previous"</strong>, <strong style={{ color: 'var(--primary)' }}>"Pause"</strong>, or <strong style={{ color: 'var(--primary)' }}>"Repeat"</strong></p>
      </div>

    </div>
  );
};

export default CookingMode;
