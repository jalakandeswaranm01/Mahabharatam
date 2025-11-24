import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  active: boolean;
  volume: number; // 0 to 1
}

const Visualizer: React.FC<VisualizerProps> = ({ active, volume }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let rotation = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Dynamic base radius: Scales with canvas size to ensure fit
      // Divisor 3.2 leaves enough room for spikes without clipping
      const baseRadius = Math.min(width, height) / 3.2; 

      ctx.clearRect(0, 0, width, height);

      // Subtle rotation for the mandala effect
      rotation += 0.005;

      if (!active) {
        // Idle state: Breathing faint glow
        const breathe = 1 + Math.sin(Date.now() / 1500) * 0.05;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * breathe, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.15)'; // Amber-400
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius * breathe * 0.8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.05)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        animationId = requestAnimationFrame(render);
        return;
      }

      // Active State: Circular Waveform (Mandala)
      const numPoints = 120; // Increased points for smoother resolution
      const angleStep = (Math.PI * 2) / numPoints;
      
      // Amplitude scales with radius to keep proportions consistent
      const maxAmplitude = baseRadius * 0.5; 
      const amplitude = volume * maxAmplitude;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);

      // Glow style
      ctx.shadowBlur = 20 + (volume * 20);
      ctx.shadowColor = '#f59e0b'; // Amber glow

      ctx.beginPath();
      for (let i = 0; i <= numPoints; i++) {
        const angle = i * angleStep;
        
        // Organic wave pattern: Mix of two sine waves
        const wave1 = Math.sin(i * 8 + Date.now() / 100);
        const wave2 = Math.sin(i * 4 - Date.now() / 120);
        const combinedWave = (wave1 + wave2) * 0.5 * amplitude;
        
        const r = baseRadius + Math.max(0, combinedWave);
        
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const gradient = ctx.createRadialGradient(0, 0, baseRadius * 0.5, 0, 0, baseRadius + amplitude);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(0.4, '#fbbf24'); // Amber-400
      gradient.addColorStop(1, '#b45309'); // Amber-700

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 4; // Thicker lines for better visibility on small screens
      ctx.stroke();

      // Inner decoration ring
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius * 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [active, volume]);

  return (
    <canvas 
      ref={canvasRef} 
      width={800} 
      height={800} 
      className="w-[85%] max-w-[320px] sm:max-w-[400px] md:max-w-[500px] h-auto opacity-90 transition-all duration-1000"
    />
  );
};

export default Visualizer;