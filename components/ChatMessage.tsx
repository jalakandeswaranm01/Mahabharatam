import React from 'react';
import { TranscriptionItem } from '../types';
import { User, Sparkles } from 'lucide-react';

interface ChatMessageProps {
  item: TranscriptionItem;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ item }) => {
  return (
    <div className={`flex w-full mb-6 ${item.isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${item.isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border 
          ${item.isUser 
            ? 'bg-indigo-900/50 border-indigo-500/30' 
            : 'bg-amber-900/30 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
          }`}>
           {item.isUser ? (
             <User size={14} className="text-indigo-300" />
           ) : (
             <Sparkles size={14} className="text-amber-400" />
           )}
        </div>

        {/* Message Bubble */}
        <div className={`flex flex-col ${item.isUser ? 'items-end' : 'items-start'}`}>
          <span className="text-[10px] text-slate-500 mb-1 px-1 font-medium tracking-wider uppercase">
            {item.isUser ? 'You' : 'Vyasa'}
          </span>
          <div className={`p-4 rounded-2xl tamil-text text-base leading-loose shadow-md backdrop-blur-sm border
            ${item.isUser 
              ? 'bg-slate-800/60 text-slate-200 rounded-tr-none border-slate-700' 
              : 'bg-indigo-950/40 text-amber-50 rounded-tl-none border-indigo-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.2)]'
            }
          `}>
            {item.text}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;