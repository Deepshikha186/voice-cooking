import { useState, useEffect, useCallback } from 'react';

const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = 'en-US';

        recog.onresult = (event) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        recog.onerror = (event) => {
          console.error('Speech recognition error', event.error);
          setError(event.error);
          setIsListening(false);
        };

        recog.onend = () => {
          // Auto restart if it was supposed to be listening (helps with continuous listening)
          // But for now, we'll just set it to false to require manual restart
          setIsListening(false);
        };

        setRecognition(recog);
      } else {
        setError('Speech recognition not supported in this browser.');
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognition) {
      setTranscript('');
      setError(null);
      try {
        recognition.start();
        setIsListening(true);
      } catch (err) {
        console.error("Already listening", err);
      }
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    toggleListening,
    setTranscript // Expose to manually clear it if needed
  };
};

export default useSpeechRecognition;
