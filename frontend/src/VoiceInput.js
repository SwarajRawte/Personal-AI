import React, { useState, useMemo, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

function VoiceInput({ onResult, compact = false }) {
  const [listening, setListening] = useState(false);

  const recognition = useMemo(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    return rec;
  }, []);

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setListening(false);
      onResult(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };
  }, [recognition, onResult]);

  const toggleListening = () => {
    if (!recognition) return;
    if (listening) {
      recognition.stop();
      setListening(false);
    } else {
      try {
        setListening(true);
        recognition.start();
      } catch (e) {
        console.error('Speech recognition start failed:', e);
        setListening(false);
      }
    }
  };

  if (compact) {
    return (
      <button 
        className={`voice-input-btn compact${listening ? ' listening' : ''}`}
        onClick={toggleListening} 
        disabled={!recognition}
        title={listening ? 'Stop listening' : 'Start voice input'}
      >
        {listening ? (
          <Mic size={22} strokeWidth={2.8} className="recording-mic" />
        ) : (
          <Mic size={22} strokeWidth={2.2} />
        )}
      </button>
    );
  }

  return (
    <div style={{ marginBottom: '8px' }}>
      <button 
        className="voice-input-btn"
        onClick={toggleListening} 
        disabled={!recognition}
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        {listening ? (
          <>
            <Loader2 className="animate-spin" size={16} /> Stop Listening
          </>
        ) : (
          <>
            <Mic size={16} /> Voice Input
          </>
        )}
      </button>
      {!recognition && (
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
          (Voice not supported)
        </span>
      )}
    </div>
  );
}

export default VoiceInput;
