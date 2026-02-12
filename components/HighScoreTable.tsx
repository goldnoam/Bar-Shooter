
import React from 'react';
import { ScoreEntry } from '../types';
import { Award, X, Trophy, Medal } from 'lucide-react';

interface HighScoreTableProps {
  scores: ScoreEntry[];
  onClose: () => void;
}

export const HighScoreTable: React.FC<HighScoreTableProps> = ({ scores, onClose }) => {
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-[#e2c18d] border-[12px] border-[#5d3a1a] shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-lg p-8 flex flex-col items-center">
        {/* Decorative corner pieces */}
        <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#3d2511] rotate-45 border-2 border-[#8b5a2b]" />
        <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#3d2511] -rotate-45 border-2 border-[#8b5a2b]" />
        <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-[#3d2511] -rotate-45 border-2 border-[#8b5a2b]" />
        <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-[#3d2511] rotate-45 border-2 border-[#8b5a2b]" />

        <button 
          onClick={onClose}
          className="absolute -top-6 -right-6 bg-red-800 text-white p-2 rounded-full border-4 border-[#3d2511] hover:bg-red-700 transition-colors shadow-lg active:scale-90"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-5xl font-rye text-[#3d2511] uppercase tracking-tighter">שיאי המסבאה</h2>
          <div className="w-full h-1 bg-[#3d2511] mt-2 rounded-full opacity-30" />
          <p className="text-[#5d3a1a] font-bold mt-2 font-rye opacity-70">הצלפים הכי חדים במערב</p>
        </div>

        <div className="w-full space-y-4">
          {scores.length > 0 ? (
            scores.map((entry, index) => {
              const isFirst = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;

              return (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-4 rounded-md border-b-2 border-[#5d3a1a]/20 ${
                    isFirst ? 'bg-yellow-500/10 border-yellow-700/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 flex items-center justify-center">
                      {isFirst && <Trophy className="w-8 h-8 text-yellow-600 animate-pulse" />}
                      {isSecond && <Medal className="w-7 h-7 text-gray-500" />}
                      {isThird && <Medal className="w-6 h-6 text-amber-700" />}
                      {!isFirst && !isSecond && !isThird && (
                        <span className="text-2xl font-rye text-[#5d3a1a]/40">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-xl font-rye ${isFirst ? 'text-yellow-900 font-bold' : 'text-[#3d2511]'}`}>
                        {entry.name}
                      </span>
                      <span className="text-[10px] text-[#5d3a1a]/60 font-mono">{entry.date}</span>
                    </div>
                  </div>
                  <div className="text-3xl font-rye text-[#3d2511]">
                    {entry.score}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-[#5d3a1a]/40 font-rye italic text-xl">
              טרם נרשמו שיאים במסבאה...
            </div>
          )}
        </div>

        <div className="mt-10 pt-4 border-t-2 border-[#5d3a1a]/10 w-full text-center">
          <p className="text-[#3d2511]/40 text-[10px] uppercase font-bold font-rye">המסבאה המקוללת - שיאני כל הזמנים</p>
        </div>
      </div>
    </div>
  );
};
