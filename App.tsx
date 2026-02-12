
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStatus, PlayerStats, ScoreEntry, PowerUpType } from './types';
import { INITIAL_AMMO, LEVEL_TIME, AMMO_REDUCTION_PER_LEVEL, POWER_UP_DURATION, UPGRADE_COSTS, RIFLE_BENEFITS } from './constants';
import { GameScene, GameSceneHandle } from './components/GameScene';
import { Target, Zap, Pause, RotateCcw, Award, Clock, Package, Bomb, Volume2, VolumeX, ChevronRight, X, Moon, Sun, Mail, Play } from 'lucide-react';

const STATIC_GOSSIP = [
  "מי זה הבחור הזה? הוא יורה מהר יותר מהצל שלו!",
  "מעולם לא ראיתי מישהו מנפץ בקבוק ג'ין ממרחק כזה.",
  "הוא מזכיר לי את 'עין הנץ' מהשנה שעברה, רק עם פחות שיער.",
  "אני מקווה שהוא ישלם על כל הבקבוקים האלה...",
  "זה היה ירי מרשים, אבל בוא נראה אותו עושה את זה אחרי כוס וויסקי.",
  "השריף החדש בעיר יודע לעבוד עם הברזל שלו.",
  "מישהו פה יורה כמו שד משחת!",
  "לא רע בכלל עבור עירוני שכמוך...",
];

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [isMuted, setIsMuted] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'sepia'>('dark');
  const [stats, setStats] = useState<PlayerStats>({
    score: 0,
    level: 1,
    ammo: INITIAL_AMMO,
    totalAmmo: INITIAL_AMMO,
    grenades: 1,
    rifleLevel: 1,
    highScores: JSON.parse(localStorage.getItem('wild_west_scores') || '[]'),
    activePowerUp: null,
    powerUpTime: 0,
  });
  const [timeLeft, setTimeLeft] = useState(LEVEL_TIME);
  const [gossip, setGossip] = useState<string>('');
  const sceneRef = useRef<GameSceneHandle>(null);
  const musicRef = useRef<HTMLAudioElement>(null);

  const saveHighScore = useCallback((score: number) => {
    const newEntry: ScoreEntry = {
      name: `היורה האלמוני`,
      score,
      date: new Date().toLocaleDateString(),
    };
    const updated = [...stats.highScores, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    setStats(prev => ({ ...prev, highScores: updated }));
    localStorage.setItem('wild_west_scores', JSON.stringify(updated));
  }, [stats.highScores]);

  const timeScale = stats.activePowerUp === PowerUpType.SLOW_MO ? 0.4 : 1;

  useEffect(() => {
    document.body.classList.toggle('theme-sepia', theme === 'sepia');
  }, [theme]);

  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = 0.2;
      if (status === GameStatus.PLAYING && !isMuted) {
        musicRef.current.play().catch(() => {});
      } else {
        musicRef.current.pause();
      }
    }
  }, [status, isMuted]);

  useEffect(() => {
    let timer: number;
    if (status === GameStatus.PLAYING && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - (1 * timeScale)));
      }, 1000);
    } else if (timeLeft <= 0 && status === GameStatus.PLAYING) {
      setStatus(GameStatus.SHOP);
    }
    return () => clearInterval(timer);
  }, [status, timeLeft, timeScale]);

  useEffect(() => {
    let puTimer: number;
    if (stats.activePowerUp && stats.powerUpTime > 0 && status === GameStatus.PLAYING) {
      puTimer = window.setInterval(() => {
        setStats(prev => ({
          ...prev,
          powerUpTime: Math.max(0, prev.powerUpTime - 100)
        }));
      }, 100);
    } else if (stats.powerUpTime === 0 && stats.activePowerUp) {
      setStats(prev => ({ ...prev, activePowerUp: null }));
    }
    return () => clearInterval(puTimer);
  }, [stats.activePowerUp, stats.powerUpTime, status]);

  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        if (status === GameStatus.PLAYING) setStatus(GameStatus.PAUSED);
        else if (status === GameStatus.PAUSED) setStatus(GameStatus.PLAYING);
      }
      if (e.key === 'r' || e.key === 'R') {
        startGame();
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [status]);

  const startGame = () => {
    setStats({
      score: 0,
      level: 1,
      ammo: INITIAL_AMMO,
      totalAmmo: INITIAL_AMMO,
      grenades: 1,
      rifleLevel: 1,
      highScores: stats.highScores,
      activePowerUp: null,
      powerUpTime: 0,
    });
    setTimeLeft(LEVEL_TIME);
    setStatus(GameStatus.PLAYING);
  };

  const nextLevel = () => {
    const nextAmmo = Math.max(10, INITIAL_AMMO - (stats.level * AMMO_REDUCTION_PER_LEVEL));
    setStats(prev => ({
      ...prev,
      level: prev.level + 1,
      ammo: nextAmmo,
      totalAmmo: nextAmmo,
      activePowerUp: null,
      powerUpTime: 0,
    }));
    setTimeLeft(LEVEL_TIME);
    setStatus(GameStatus.PLAYING);
  };

  const handleShot = () => {
    if (stats.ammo > 0) {
      if (stats.activePowerUp === PowerUpType.RAPID_FIRE) return;
      setStats(prev => ({ ...prev, ammo: prev.ammo - 1 }));
    }
  };

  const handleHit = (points: number) => {
    setStats(prev => ({ ...prev, score: prev.score + points }));
  };

  const handlePowerUp = (type: PowerUpType) => {
    if (type === PowerUpType.EXTRA_AMMO) {
      setStats(prev => ({ ...prev, ammo: prev.ammo + 20, totalAmmo: prev.totalAmmo + 20 }));
    } else {
      setStats(prev => ({ ...prev, activePowerUp: type, powerUpTime: POWER_UP_DURATION }));
    }
  };

  const useGrenade = () => {
    if (stats.grenades > 0 && status === GameStatus.PLAYING) {
      setStats(prev => ({ ...prev, grenades: prev.grenades - 1 }));
      sceneRef.current?.triggerGrenade();
    }
  };

  const gameOver = () => {
    setStatus(GameStatus.GAME_OVER);
    saveHighScore(stats.score);
    setGossip(STATIC_GOSSIP[Math.floor(Math.random() * STATIC_GOSSIP.length)]);
  };

  useEffect(() => {
    if (stats.ammo === 0 && status === GameStatus.PLAYING && !stats.activePowerUp) {
      const timeout = setTimeout(() => {
        if (status === GameStatus.PLAYING) gameOver();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [stats.ammo, status, stats.activePowerUp]);

  return (
    <div className={`relative w-full h-screen bg-stone-900 text-stone-100 flex flex-col items-center select-none overflow-hidden transition-all duration-500`}>
      <audio ref={musicRef} loop src="https://www.soundjay.com/misc/sounds/piano-bar-ambience-1.mp3" />
      
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/dark-wood.png")' }} />
      
      <div className="w-full max-w-4xl p-4 flex justify-between items-center z-10 bg-black/40 backdrop-blur-sm rounded-b-xl border-x border-b border-amber-900/50 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center px-4 py-1 bg-amber-900/20 rounded border border-amber-800">
            <span className="text-xs text-amber-500 uppercase font-bold tracking-widest text-[10px]">שלב</span>
            <span className="text-2xl font-rye">{stats.level}</span>
          </div>
          <div className="flex flex-col items-center px-4 py-1 bg-amber-900/20 rounded border border-amber-800">
            <span className="text-xs text-amber-500 uppercase font-bold tracking-widest text-[10px]">זמן</span>
            <span className={`text-2xl font-rye ${timeLeft < 10 ? 'text-red-500 animate-pulse' : ''}`}>{Math.ceil(timeLeft)}s</span>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-3xl font-rye text-amber-600 drop-shadow-lg hidden md:block">המסבאה המקוללת</h1>
          {stats.activePowerUp && (
            <div className="flex items-center gap-2 bg-yellow-500/20 px-3 py-0.5 rounded-full border border-yellow-500/50 animate-pulse">
              <Zap className="w-3 h-3 text-yellow-400" />
              <span className="text-[10px] font-bold uppercase">{stats.activePowerUp.replace('_', ' ')}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center px-4 py-1 bg-amber-900/20 rounded border border-amber-800">
            <span className="text-xs text-amber-500 uppercase font-bold tracking-widest text-[10px]">זהב</span>
            <span className="text-2xl font-rye text-yellow-400">{stats.score}</span>
          </div>
          <div className="flex flex-col items-center px-4 py-1 bg-amber-900/20 rounded border border-amber-800">
            <span className="text-xs text-amber-500 uppercase font-bold tracking-widest text-[10px]">כדורים</span>
            <span className={`text-2xl font-rye ${stats.ammo < 5 ? 'text-red-500' : 'text-green-500'}`}>{stats.ammo}</span>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full flex flex-col justify-center items-center relative overflow-hidden">
        <GameScene 
          ref={sceneRef}
          status={status} 
          ammo={stats.ammo} 
          onHit={handleHit} 
          onShot={handleShot}
          onPowerUp={handlePowerUp}
          level={stats.level}
          timeScale={timeScale}
          rifleLevel={stats.rifleLevel}
          activePowerUp={stats.activePowerUp}
          isMuted={isMuted}
        />

        <div className="absolute bottom-16 left-0 w-full flex flex-col items-center z-10 opacity-70 pointer-events-none">
           <p className="text-[14px] font-mono text-stone-400 font-bold">(C) Noam Gold AI 2026</p>
           <div className="flex items-center gap-2 text-[12px] text-stone-500">
             <span>Send Feedback</span>
             <Mail className="w-3 h-3" />
             <span className="font-mono">goldnoamai@gmail.com</span>
           </div>
        </div>

        {status === GameStatus.MENU && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="p-12 bg-amber-950/40 border-4 border-amber-900 rounded-3xl text-center max-w-md w-full shadow-2xl">
              <h2 className="text-6xl font-rye text-amber-500 mb-8 drop-shadow-xl animate-bounce">מטווח המסבאה</h2>
              <p className="text-lg text-amber-100 mb-10 leading-relaxed font-rye">היה היורה המהיר ביותר במערב! שבור בקבוקים, שדרג את הרובה ושבור שיאים.</p>
              <button onClick={startGame} className="group relative px-12 py-5 bg-amber-700 hover:bg-amber-600 rounded-full text-3xl font-rye transition-all transform hover:scale-110 active:scale-95 shadow-xl border-b-4 border-amber-900 flex items-center gap-4"><Target className="w-8 h-8" /> יאללה לירות!</button>
              
              <div className="mt-12 flex justify-center gap-6">
                 <button onClick={() => setTheme(theme === 'dark' ? 'sepia' : 'dark')} className="flex items-center gap-2 p-3 bg-stone-800 rounded-xl border border-stone-600 hover:bg-stone-700 transition-all">
                    {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-blue-400" />}
                    <span className="text-xs font-bold">החלף ערכת נושא</span>
                 </button>
              </div>
            </div>
          </div>
        )}

        {status === GameStatus.PAUSED && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
             <div className="p-10 bg-amber-950/90 border-4 border-amber-700 rounded-3xl text-center shadow-2xl">
                <h2 className="text-4xl font-rye mb-6 text-amber-500">הפסקה מהיריות</h2>
                <div className="flex gap-4">
                  <button onClick={() => setStatus(GameStatus.PLAYING)} className="px-8 py-3 bg-green-700 rounded-lg hover:bg-green-600 font-bold transition-all flex items-center gap-2"><Play className="w-5 h-5" /> חזור</button>
                  <button onClick={startGame} className="px-8 py-3 bg-red-800 rounded-lg hover:bg-red-700 font-bold transition-all flex items-center gap-2"><RotateCcw className="w-5 h-5" /> התחל מחדש</button>
                </div>
             </div>
          </div>
        )}

        {status === GameStatus.SHOP && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-stone-900/95 p-6 overflow-y-auto">
            <div className="w-full max-w-2xl p-8 bg-black/60 border-2 border-amber-900 rounded-3xl backdrop-blur-2xl shadow-[0_0_100px_rgba(217,119,6,0.2)]">
              <div className="flex justify-between items-end mb-8">
                <h2 className="text-5xl font-rye text-amber-500">חנות השדרוגים</h2>
                <div className="bg-amber-900/40 px-5 py-2 rounded-xl border border-amber-800">
                  <span className="text-sm text-amber-600 block">הזהב שלך:</span>
                  <span className="text-2xl font-rye text-yellow-500">${stats.score}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {[
                  { id: 'ammo', name: 'עגלת תחמושת', cost: UPGRADE_COSTS.AMMO, icon: <Package className="w-6 h-6" />, desc: '+15 כדורים קבועים' },
                  { id: 'time', name: 'שעון חול', cost: UPGRADE_COSTS.TIME, icon: <Clock className="w-6 h-6" />, desc: 'יותר זמן בכל שלב (5+ שניות)' },
                  { id: 'grenade', name: 'צרור רימונים', cost: UPGRADE_COSTS.GRENADE, icon: <Bomb className="w-6 h-6" />, desc: '+2 רימונים למלאי' },
                  { id: 'rifle', name: 'שיפור רובה', cost: UPGRADE_COSTS.RIFLE, icon: <Target className="w-6 h-6" />, desc: stats.rifleLevel >= RIFLE_BENEFITS.length ? 'רמה מקסימלית!' : `דיוק וקצב אש` },
                ].map((item) => (
                  <button key={item.id} disabled={stats.score < item.cost || (item.id === 'rifle' && stats.rifleLevel >= RIFLE_BENEFITS.length)} onClick={() => { if (stats.score >= item.cost) { setStats(prev => ({ ...prev, score: prev.score - item.cost, totalAmmo: item.id === 'ammo' ? prev.totalAmmo + 15 : prev.totalAmmo, grenades: item.id === 'grenade' ? prev.grenades + 2 : prev.grenades, rifleLevel: item.id === 'rifle' ? prev.rifleLevel + 1 : prev.rifleLevel })); } }} className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all ${(stats.score >= item.cost && !(item.id === 'rifle' && stats.rifleLevel >= RIFLE_BENEFITS.length)) ? 'bg-amber-900/30 border-amber-600 hover:bg-amber-900/50 scale-100 hover:scale-[1.02] shadow-lg' : 'bg-stone-800/40 border-stone-700 opacity-50 grayscale cursor-not-allowed'}`}><div className="p-3 bg-amber-900 rounded-lg text-amber-400">{item.icon}</div><div className="text-right flex-1"><h4 className="font-bold text-lg font-rye text-amber-100">{item.name}</h4><p className="text-xs text-stone-400 mt-1">{item.desc}</p><div className="mt-2 text-yellow-500 font-rye">$${item.cost}</div></div></button>
                ))}
              </div>
              <div className="flex flex-col md:flex-row justify-center gap-4">
                <button onClick={nextLevel} className="px-12 py-5 bg-amber-700 hover:bg-amber-600 rounded-full text-2xl font-rye shadow-xl border-b-4 border-amber-900 flex items-center justify-center gap-3 transition-transform hover:translate-y-[-2px]">עבור לשלב הבא <ChevronRight className="w-6 h-6" /></button>
                <button onClick={nextLevel} className="px-8 py-5 bg-stone-800 hover:bg-stone-700 rounded-full text-lg font-rye shadow-lg border-b-4 border-stone-950 flex items-center justify-center gap-2 transition-all hover:translate-y-[-2px] text-stone-400">עבור ללא שדרוג <X className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        )}

        {status === GameStatus.GAME_OVER && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-center p-6">
             <div className="p-12 max-w-md w-full bg-stone-900 border-2 border-red-900 rounded-3xl shadow-[0_0_50px_rgba(153,27,27,0.5)]">
                <h2 className="text-6xl font-rye text-red-600 mb-4 drop-shadow-lg">נגמר התחמושת!</h2>
                <div className="mb-8 text-stone-400 font-rye">הגעת לשלב {stats.level} וצברת {stats.score} נקודות</div>
                <div className="relative p-6 bg-stone-800/80 rounded-2xl mb-10 border-r-4 border-amber-600 italic text-amber-100 font-rye text-right">
                  <span className="absolute -top-3 right-4 bg-amber-600 text-black text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">GOSSIP</span>
                  "{gossip}"
                </div>
                <div className="flex gap-4 justify-center">
                  <button onClick={startGame} className="flex items-center gap-2 px-10 py-5 bg-amber-700 hover:bg-amber-600 rounded-full font-rye text-2xl transition-all hover:scale-105 active:scale-95 shadow-xl"><RotateCcw className="w-7 h-7" /> נסה שוב</button>
                </div>
             </div>
          </div>
        )}
      </main>

      <div className="w-full max-w-4xl p-4 flex justify-between items-center z-10 bg-black/40 backdrop-blur-md border-t border-amber-900/30">
        <div className="flex gap-4">
           {status === GameStatus.PLAYING && (
             <button onClick={() => setStatus(GameStatus.PAUSED)} className="p-3 bg-stone-800 hover:bg-stone-700 rounded-full border border-stone-600 shadow-lg transition-all active:scale-90" title="עצור (P)">
               <Pause className="w-6 h-6 text-amber-500" />
             </button>
           )}
           <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-stone-800 hover:bg-stone-700 rounded-full border border-stone-600 shadow-lg transition-all active:scale-90">
             {isMuted ? <VolumeX className="w-6 h-6 text-red-500" /> : <Volume2 className="w-6 h-6 text-green-500" />}
           </button>
           <button onClick={() => setTheme(theme === 'dark' ? 'sepia' : 'dark')} className="p-3 bg-stone-800 hover:bg-stone-700 rounded-full border border-stone-600 shadow-lg transition-all active:scale-90">
             {theme === 'dark' ? <Moon className="w-6 h-6 text-amber-400" /> : <Sun className="w-6 h-6 text-yellow-500" />}
           </button>
        </div>
        <div className="text-stone-500 text-[10px] uppercase tracking-widest font-bold font-rye opacity-50 text-left">
           ירי: עכבר / רווח | תנועה: WASD / עכבר | הפסקה: P | איפוס: R
        </div>
      </div>
    </div>
  );
};

export default App;
