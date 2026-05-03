import { useState, useCallback, useEffect } from 'react';

export function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);
    }
  }, []);

  const startListening = useCallback((onResult: (text: string) => void, onInterim?: (text: string) => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN'; 
    recognition.continuous = true; // Changed to true for better long sentence support
    recognition.interimResults = true;
    setRecognitionInstance(recognition);

    let finalTranscript = '';
    let lastInterim = '';
    let silenceTimer: any;

    const stopRecognition = () => {
      try {
        recognition.stop();
      } catch (e) {}
    };

    recognition.onstart = () => {
      setIsListening(true);
      finalTranscript = '';
      lastInterim = '';
    };

    recognition.onresult = (event: any) => {
      clearTimeout(silenceTimer);
      let interim = '';
      let currentFinal = '';
      
      // Better processing of multiple results in continuous mode
      for (let i = 0; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          currentFinal += (currentFinal ? ' ' : '') + transcript;
        } else {
          interim += (interim ? ' ' : '') + transcript;
        }
      }
      
      finalTranscript = currentFinal;
      lastInterim = interim;
      if (onInterim) onInterim((finalTranscript + ' ' + interim).trim());
      
      // Auto-stop after 3.5 seconds of silence for prompt responsiveness
      silenceTimer = setTimeout(stopRecognition, 3500);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('Speech error:', event.error);
      }
      setIsListening(false);
      clearTimeout(silenceTimer);
    };

    recognition.onend = () => {
      setIsListening(false);
      clearTimeout(silenceTimer);
      setRecognitionInstance(null);
      
      // Crucial: Use whatever we got
      const finalResult = (finalTranscript + ' ' + lastInterim).trim().replace(/\s+/g, ' ');
      if (finalResult) {
        onResult(finalResult);
      }
    };

    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionInstance) {
      recognitionInstance.stop();
    }
  }, [recognitionInstance]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) return;

    const performSpeech = () => {
      // Ensure we have a fresh state
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      
      // Extensive search for the best Indian/Human-like accent
      const preferredVoice = 
        voices.find(v => v.lang === 'hi-IN' && v.name.includes('Google')) || 
        voices.find(v => v.lang === 'hi-IN') || 
        voices.find(v => v.lang === 'en-IN' && v.name.includes('Google')) ||
        voices.find(v => v.lang === 'en-IN') ||
        voices.find(v => v.name.includes('India')) ||
        voices.find(v => v.lang.startsWith('hi'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log("Selected voice:", preferredVoice.name);
      }
      
      utterance.rate = 1.05; // Slightly faster for natural feel
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        if (onEnd) onEnd();
      };

      // Some browsers require explicit resume
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utterance);
    };

    // Robust voice loading check
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = performSpeech;
    } else {
      performSpeech();
    }
  }, []);

  return { isListening, isSupported, startListening, stopListening, speak };
}
