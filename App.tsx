import React, { useState } from 'react';
import { useLiveGemini } from './hooks/useLiveGemini';
import { ConnectionState } from './types';
import Visualizer from './components/Visualizer';
import { Mic, Square, Loader2, Info, Sparkles, RotateCcw, Sliders, X } from 'lucide-react';

const App: React.FC = () => {
  const { 
    connect, 
    disconnect, 
    connectionState, 
    error,
    volume,
    micSensitivity,
    setMicSensitivity
  } = useLiveGemini();

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSettingsClosing, setIsSettingsClosing] = useState(false);

  const isConnected = connectionState === ConnectionState.CONNECTED;
  const isConnecting = connectionState === ConnectionState.CONNECTING;

  const handleReset = () => {
    if (isConnected) {
      disconnect();
    }
    setShowResetDialog(false);
  };

  const openSettings = () => {
    setIsSettingsClosing(false);
    setShowSettings(true);
  };

  const closeSettings = () => {
    setIsSettingsClosing(true);
    setTimeout(() => {
      setShowSettings(false);
      setIsSettingsClosing(false);
    }, 300);
  };

  return (
    <div className="relative h-[100dvh] w-full flex flex-col overflow-hidden bg-[#0f0a05]">
      
      {/* Background Image & Overlays */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40 pointer-events-none"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1582457380669-c833e6aea918?q=80&w=2670&auto=format&fit=crop')",
          filter: "sepia(50%) brightness(70%)"
        }}
      ></div>
      
      {/* Gradient Vignette */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none"></div>
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0f0a05_90%)] pointer-events-none"></div>

      {/* Main Layout Container */}
      <div className="relative z-10 flex flex-col h-full w-full max-w-xl mx-auto">
        
        {/* Header - Mahabharatham Theme */}
        <header className="flex-none py-6 flex flex-col items-center gap-2 relative z-20 bg-gradient-to-b from-[#1a0f05] to-[#1a0f05]/0 border-b border-amber-500/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
          
          {/* Icon */}
          <div className="flex justify-center mb-1">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-amber-900/30 border border-amber-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Sparkles size={20} className="text-[#FFD700] animate-pulse" />
            </div>
          </div>

          {/* Title Section */}
          <div className="text-center space-y-1 px-4">
            <h1 className="text-3xl md:text-5xl font-bold text-[#FFD700] epic-font tracking-wider drop-shadow-[0_2px_15px_rgba(255,215,0,0.4)]">
              Mahabharatham
            </h1>
            <div className="flex items-center justify-center gap-2">
              <div className="h-[1px] w-8 bg-amber-500/50"></div>
              <p className="text-amber-500/80 text-xs md:text-sm tracking-[0.3em] uppercase font-medium">
                Doubt Assistant
              </p>
              <div className="h-[1px] w-8 bg-amber-500/50"></div>
            </div>
          </div>
        </header>

        {/* Main Visualizer & Status Area */}
        <main className="flex-1 flex flex-col items-center justify-center relative w-full px-4">
          
          {/* Circular Visualizer - Absolutely positioned to center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <Visualizer active={isConnected} volume={volume} />
          </div>

          {/* Status Text - Relative and centered in the flex container */}
          <div className="relative z-20 flex flex-col items-center justify-center w-full text-center">
            {!isConnected && !isConnecting && (
              <div className="animate-in fade-in zoom-in duration-1000 flex flex-col items-center gap-6">
                 <p className="text-xl md:text-2xl text-amber-100/90 tamil-text font-medium leading-relaxed drop-shadow-lg max-w-[85%] mx-auto">
                   "மகாபாரதம் பற்றிய உங்கள் சந்தேகங்களைக் கேளுங்கள்"
                 </p>
                 <div className="px-3 py-1 rounded-full bg-black/40 border border-white/10 backdrop-blur-sm">
                   <p className="text-slate-400 text-[10px] md:text-xs font-light tracking-widest uppercase">
                     Tap the mic to start
                   </p>
                 </div>
              </div>
            )}

            {isConnecting && (
              <div className="animate-pulse flex flex-col items-center gap-2">
                <p className="text-lg text-amber-200/80 tracking-widest uppercase font-serif">
                  Connecting...
                </p>
              </div>
            )}

            {isConnected && (
              <div className="flex flex-col items-center gap-3 animate-in fade-in duration-500">
                <div className="px-4 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                   Listening
                </div>
                <p className="text-base text-amber-100/70 italic font-serif">
                  Vyasa is with you...
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Error Toast (Floating above footer) */}
        {error && (
          <div className="flex-none mb-4 flex justify-center w-full animate-in slide-in-from-bottom-5 absolute bottom-[140px] z-40 pointer-events-none">
            <div className="px-4 py-2 bg-red-950/90 backdrop-blur-md border border-red-500/50 text-red-200 text-xs md:text-sm rounded-lg shadow-xl flex items-center gap-2 max-w-[90%] pointer-events-auto">
              <Info size={16} className="flex-shrink-0 text-red-400" />
              <span className="truncate">{error}</span>
            </div>
          </div>
        )}

        {/* Footer Control Bar - Themed */}
        <footer className="w-full flex-none py-8 bg-[#120b05]/90 backdrop-blur-md border-t border-amber-900/40 z-30 shadow-[0_-5px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-center gap-8 max-w-md mx-auto px-6">
            
            {/* 1. Main Mic Button */}
            <div className="flex justify-center">
              <button
                onClick={isConnected ? disconnect : connect}
                disabled={isConnecting}
                className={`
                  group relative flex items-center justify-center 
                  w-20 h-20 md:w-24 md:h-24 
                  rounded-full shadow-2xl transition-all duration-500
                  ${isConnected 
                    ? 'bg-gradient-to-br from-red-900 to-slate-900 border-2 border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:scale-95' 
                    : 'bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 border-4 border-amber-300/30 shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:scale-105 hover:shadow-[0_0_50px_rgba(245,158,11,0.5)]'
                  }
                  ${isConnecting ? 'opacity-80 cursor-wait' : 'cursor-pointer'}
                `}
              >
                {/* Ping animation for call to action */}
                {!isConnected && !isConnecting && (
                  <div className="absolute inset-0 rounded-full border border-amber-200/40 animate-ping opacity-40 pointer-events-none"></div>
                )}

                {isConnecting ? (
                  <Loader2 size={32} className="animate-spin text-amber-200" />
                ) : isConnected ? (
                  <Square size={24} className="fill-current text-red-400 group-hover:text-red-200 transition-colors" />
                ) : (
                  <Mic size={32} className="text-amber-950 drop-shadow-md group-hover:text-amber-900" />
                )}
              </button>
            </div>

            {/* 2. Refresh (Reset) Button */}
            <button 
              onClick={() => setShowResetDialog(true)}
              className="p-3 text-amber-500/60 hover:text-amber-300 bg-amber-900/10 hover:bg-amber-900/30 border border-transparent hover:border-amber-500/20 transition-all rounded-full active:scale-95"
              title="Start New Conversation"
            >
              <RotateCcw size={24} />
            </button>
            
            {/* 3. Settings (Visualizer/Adjustor) Button */}
            <button 
              onClick={openSettings}
              className="p-3 text-amber-500/60 hover:text-amber-300 bg-amber-900/10 hover:bg-amber-900/30 border border-transparent hover:border-amber-500/20 transition-all rounded-full active:scale-95"
              title="Audio Settings"
            >
              <Sliders size={24} />
            </button>
            
          </div>
        </footer>

      </div>

      {/* Reset Confirmation Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1a1209] border border-amber-500/30 rounded-2xl p-6 max-w-xs w-full shadow-[0_0_50px_rgba(245,158,11,0.15)]">
             <h3 className="text-lg font-serif font-semibold text-amber-400 mb-2">Start Fresh?</h3>
             <p className="text-amber-100/70 text-sm mb-6 leading-relaxed">
               This will end the current session. Vyasa will forget the context of the current conversation.
             </p>
             <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setShowResetDialog(false)}
                  className="px-4 py-2 text-xs font-medium text-amber-500/70 hover:text-amber-300 uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReset}
                  className="px-4 py-2 bg-amber-900/40 border border-amber-600/30 text-amber-200 text-xs font-bold rounded-lg hover:bg-amber-800/50 hover:border-amber-500/50 uppercase tracking-wider transition-all"
                >
                  Confirm
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm ${
            isSettingsClosing ? 'animate-out fade-out duration-300' : 'animate-in fade-in duration-300'
          }`}
        >
          <div 
            className={`bg-[#1a1209] border border-amber-500/30 rounded-2xl p-6 max-w-xs w-full shadow-[0_0_50px_rgba(245,158,11,0.15)] ${
              isSettingsClosing ? 'animate-out slide-out-to-bottom-10 duration-300' : 'animate-in slide-in-from-bottom-10 duration-300'
            }`}
          >
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-serif font-semibold text-amber-400">Settings</h3>
               <button onClick={closeSettings} className="text-amber-500/50 hover:text-amber-300">
                 <X size={20} />
               </button>
             </div>
             
             <div className="mb-6">
                <label className="block text-xs font-medium text-amber-200/80 mb-3 uppercase tracking-wider">
                  Microphone Sensitivity
                </label>
                <div className="flex items-center gap-3">
                   <span className="text-xs text-amber-500/50 font-mono">0%</span>
                   <input 
                    type="range" 
                    min="0" 
                    max="3" 
                    step="0.1" 
                    value={micSensitivity} 
                    onChange={(e) => setMicSensitivity(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-amber-900/30 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400"
                   />
                   <span className="text-xs text-amber-500/50 font-mono">300%</span>
                </div>
                <div className="flex justify-between mt-2">
                   <span className="text-[10px] text-amber-500/40">Mute</span>
                   <span className="text-[10px] text-amber-400 font-mono">{(micSensitivity * 100).toFixed(0)}%</span>
                   <span className="text-[10px] text-amber-500/40">Boost</span>
                </div>
             </div>

             <div className="flex justify-end">
                <button 
                  onClick={closeSettings}
                  className="px-4 py-2 bg-amber-900/40 border border-amber-600/30 text-amber-200 text-xs font-bold rounded-lg hover:bg-amber-800/50 hover:border-amber-500/50 uppercase tracking-wider transition-all"
                >
                  Done
                </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;