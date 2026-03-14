import { useState, useEffect, useCallback } from 'react';

const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
    }
  }, []);

  const speak = useCallback((text, onEndCallback = () => {}) => {
    if (!supported) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Optional: Could add logic here to select a premium sounding voice
    // let voices = window.speechSynthesis.getVoices();
    // utterance.voice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) || voices[0];
    
    utterance.rate = 0.95; // Slightly slower for recipe instructions
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    
    utterance.onend = () => {
      setIsSpeaking(false);
      onEndCallback();
    };

    utterance.onerror = (e) => {
      console.error('Speech synthesis error', e);
      setIsSpeaking(false);
      onEndCallback(); // Still call it so flow doesn't break
    };

    window.speechSynthesis.speak(utterance);
  }, [supported]);

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [supported]);

  return {
    isSpeaking,
    speak,
    cancel,
    supported
  };
};

export default useSpeechSynthesis;
