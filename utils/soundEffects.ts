const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
let audioCtx: AudioContext | null = null;

const getContext = () => {
    if (!audioCtx) {
        audioCtx = new AudioContextClass();
    }
    return audioCtx;
};

export const playSound = (type: 'connecting' | 'connected' | 'disconnected' | 'ai_start' | 'ai_end') => {
    try {
        const ctx = getContext();
        // Resume context if suspended (browser autoplay policy)
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        switch (type) {
            case 'connecting':
                // Soft double high-tech blip
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                
                // Second blip
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(440, now + 0.15);
                osc2.frequency.exponentialRampToValueAtTime(880, now + 0.25);
                gain2.gain.setValueAtTime(0.05, now + 0.15);
                gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc2.start(now + 0.15);
                osc2.stop(now + 0.25);
                break;
            
            case 'connected':
                // Harmonious "Success" chime (Major triad arpeggio effect)
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.linearRampToValueAtTime(783.99, now + 0.15); // G5
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
                break;

            case 'disconnected':
                // "Power down" descending tone
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;

            case 'ai_start':
                // Subtle "Open" click/shimmer indicating voice start
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(800, now);
                gain.gain.setValueAtTime(0.03, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;

            case 'ai_end':
                // Subtle "Close" tick indicating voice end
                osc.type = 'sine';
                osc.frequency.setValueAtTime(200, now);
                gain.gain.setValueAtTime(0.03, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
        }
    } catch (e) {
        console.warn("Audio play failed", e);
    }
};