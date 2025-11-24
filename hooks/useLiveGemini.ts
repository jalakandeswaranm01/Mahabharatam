import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, base64ToUint8Array, decodeAudioData } from '../utils/audioUtils';
import { playSound } from '../utils/soundEffects';
import { ConnectionState } from '../types';

interface UseLiveGeminiReturn {
  connect: () => Promise<void>;
  disconnect: () => void;
  connectionState: ConnectionState;
  error: string | null;
  volume: number;
  micSensitivity: number;
  setMicSensitivity: (val: number) => void;
}

export const useLiveGemini = (): UseLiveGeminiReturn => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const [micSensitivity, setMicSensitivity] = useState(1.0);

  // Audio Contexts
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  
  // Audio Nodes
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const inputGainNodeRef = useRef<GainNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  
  // State Refs
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  
  const disconnect = useCallback(() => {
    // Only play sound if we are actually disconnecting from an active/connecting state
    if (inputAudioContextRef.current || streamRef.current) {
        playSound('disconnected');
    }

    // Stop microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close AudioContexts
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    // Stop all playing audio
    sourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
    });
    sourcesRef.current.clear();
    
    // Reset state
    inputGainNodeRef.current = null;
    setConnectionState(ConnectionState.DISCONNECTED);
    setVolume(0);
  }, []);

  const connect = useCallback(async () => {
    if (!process.env.API_KEY) {
      setError("API Key is missing.");
      return;
    }

    try {
      playSound('connecting');
      setConnectionState(ConnectionState.CONNECTING);
      setError(null);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Initialize Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // Setup Output Node
      outputGainRef.current = outputAudioContextRef.current.createGain();
      outputGainRef.current.connect(outputAudioContextRef.current.destination);

      // Setup Input Analyzer for Visualizer
      analyserRef.current = inputAudioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      // Get Microphone Access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Session Opened');
            playSound('connected');
            setConnectionState(ConnectionState.CONNECTED);
            
            if (!inputAudioContextRef.current || !streamRef.current) return;

            // Setup Mic Stream
            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            inputSourceRef.current = source;

            // Setup Input Gain (Sensitivity)
            const inputGain = inputAudioContextRef.current.createGain();
            inputGain.gain.value = micSensitivity; // Apply current sensitivity
            inputGainNodeRef.current = inputGain;
            
            // Source -> Gain
            source.connect(inputGain);
            
            // Connect Gain -> Visualizer
            if (analyserRef.current) {
              inputGain.connect(analyserRef.current);
            }

            // Processor for raw PCM extraction
            const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              
              // Calculate volume for visualizer
              let sum = 0;
              for(let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(Math.min(rms * 10, 1)); 

              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            // Connect Gain -> Processor -> Destination
            inputGain.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            
            if (base64Audio && outputAudioContextRef.current && outputGainRef.current) {
              
              // Play 'Start Responding' sound if this is the first chunk of a new turn
              if (sourcesRef.current.size === 0) {
                 playSound('ai_start');
              }

              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

              try {
                const audioBuffer = await decodeAudioData(
                  base64ToUint8Array(base64Audio),
                  ctx,
                  24000,
                  1
                );
                
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputGainRef.current);
                
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                  // Play 'Stop Responding' sound if queue is now empty
                  if (sourcesRef.current.size === 0) {
                    playSound('ai_end');
                  }
                });

                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              } catch (e) {
                console.error("Error decoding audio", e);
              }
            }

            // Handle Interruptions
            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              console.log("Model interrupted");
              if (sourcesRef.current.size > 0) {
                  playSound('ai_end'); // Play end sound on interruption
              }
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (err) => {
            console.error("Gemini Live Error:", err);
            setConnectionState(ConnectionState.ERROR);
            setError("Connection failed.");
            disconnect();
          },
          onclose: () => {
            console.log("Gemini Live Closed");
            setConnectionState(ConnectionState.DISCONNECTED);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } 
          },
          systemInstruction: `You are a wise and patient scholar named "Vyasa" who is an expert on the Indian epic Mahabharatham. 
          Your specific goal is to clarify doubts, explain characters, describe events, and interpret morals from the Mahabharatham story.
          
          CRITICAL RULES:
          1. You MUST speak ONLY in the TAMIL language.
          2. If the user speaks English, politely reply in Tamil explaining that you only converse in Tamil about the Mahabharatham.
          3. Keep your answers concise, respectful, and culturally accurate.
          4. Use a storytelling tone suitable for narrating an epic.
          `,
        }
      });

    } catch (err: any) {
      console.error(err);
      setError("Failed to initialize");
      setConnectionState(ConnectionState.ERROR);
    }
  }, [disconnect, micSensitivity]); // micSensitivity in dependency to re-connect if needed, though we handle updates via useEffect mostly.

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  // Update gain node when sensitivity state changes
  useEffect(() => {
    if (inputGainNodeRef.current) {
        inputGainNodeRef.current.gain.value = micSensitivity;
    }
  }, [micSensitivity]);

  return {
    connect,
    disconnect,
    connectionState,
    error,
    volume,
    micSensitivity,
    setMicSensitivity
  };
};