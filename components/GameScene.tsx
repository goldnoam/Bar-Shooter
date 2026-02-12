
import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Bottle, GameStatus, PowerUp, PowerUpType } from '../types';
import { BOTTLE_TYPES, RIFLE_BENEFITS } from '../constants';
import { ParticleEffect } from './ParticleSystem';
import { Zap, Clock, Package, Bomb, Star, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface GameSceneProps {
  status: GameStatus;
  ammo: number;
  onHit: (points: number) => void;
  onShot: () => void;
  onPowerUp: (type: PowerUpType) => void;
  level: number;
  timeScale: number;
  rifleLevel: number;
  activePowerUp: PowerUpType | null;
  isMuted: boolean;
}

export interface GameSceneHandle {
  triggerGrenade: () => void;
}

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  isStar?: boolean;
}

interface HitEffect {
  id: string;
  x: number;
  y: number;
  color: string;
  isExplosion?: boolean;
  isShockwave?: boolean;
  isSmoke?: boolean;
  isFire?: boolean;
  type?: 'shards' | 'liquid';
  delay?: number;
  timestamp: number;
  size?: number;
}

const SOUNDS = {
  shot: 'https://assets.mixkit.co/active_storage/sfx/2591/2591-preview.mp3',
  break: 'https://assets.mixkit.co/active_storage/sfx/1126/1126-preview.mp3',
  powerup: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  explosion: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  clink: 'https://assets.mixkit.co/active_storage/sfx/1460/1460-preview.mp3',
};

export const GameScene = forwardRef<GameSceneHandle, GameSceneProps>(({ status, ammo, onHit, onShot, onPowerUp, level, timeScale, rifleLevel, activePowerUp, isMuted }, ref) => {
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [hits, setHits] = useState<HitEffect[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [flash, setFlash] = useState<{ x: number, y: number } | null>(null);
  const [crosshair, setCrosshair] = useState({ x: 50, y: 50 });
  const [shake, setShake] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(null);
  const lastShotTime = useRef(0);
  const keysPressed = useRef<Set<string>>(new Set());

  const playSfx = (key: keyof typeof SOUNDS) => {
    if (isMuted) return;
    const audio = new Audio(SOUNDS[key]);
    audio.volume = 0.4;
    audio.play().catch(() => {});
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
      if (e.key === ' ' && status === GameStatus.PLAYING) {
        handleShootAt(crosshair.x, crosshair.y);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [status, crosshair]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setHits(prev => prev.filter(h => {
        if (h.isFire) return now - h.timestamp < 4000;
        return now - h.timestamp < 3000;
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addFloatingText = (x: number, y: number, text: string, color: string, isStar = false) => {
    const id = Math.random().toString();
    setFloatingTexts(prev => [...prev, { id, x, y, text, color, isStar }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== id)), 1000);
  };

  const spawnBottles = useCallback(() => {
    const newBottles: Bottle[] = [];
    const count = Math.min(15, 5 + level);
    for (let i = 0; i < count; i++) {
      const typeInfo = BOTTLE_TYPES[Math.floor(Math.random() * BOTTLE_TYPES.length)];
      newBottles.push({
        id: Math.random().toString(),
        x: (i + 1) * (100 / (count + 1)),
        y: 70,
        vx: 0,
        vy: 0,
        rotation: 0,
        rv: 0,
        type: typeInfo.type,
        color: typeInfo.color,
        liquidColor: typeInfo.liquidColor,
        isBroken: false,
        isHit: false,
        hitsRequired: typeInfo.hits,
        hitsTaken: 0,
      });
    }
    setBottles(newBottles);

    if (Math.random() > 0.6) {
      const types = [PowerUpType.RAPID_FIRE, PowerUpType.SLOW_MO, PowerUpType.EXTRA_AMMO];
      setPowerUps(prev => [...prev, {
        id: Math.random().toString(),
        x: 10 + Math.random() * 80,
        y: 30 + Math.random() * 30,
        type: types[Math.floor(Math.random() * types.length)],
        life: 1,
      }]);
    }
  }, [level]);

  useImperativeHandle(ref, () => ({
    triggerGrenade: () => {
      if (status !== GameStatus.PLAYING) return;
      playSfx('explosion');
      setShake(true);
      setTimeout(() => setShake(false), 800);
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.width / 2;
      const cy = rect.height * 0.7;
      addFloatingText(50, 40, "BOOM!", "#ff4500");
      
      const timestamp = Date.now();
      setHits(prev => [...prev, { id: 'grenade-' + timestamp, x: cx, y: cy, color: '#ff4500', isExplosion: true, timestamp }]);
      
      setBottles(prev => prev.map(b => {
        if (b.isBroken) return b;
        onHit(5);
        const bx = (b.x / 100) * rect.width;
        const by = (b.y / 100) * rect.height;
        setHits(h => [...h, 
          { id: `shard-${b.id}`, x: bx, y: by, color: b.liquidColor, type: 'shards', delay: 0, timestamp: Date.now() },
          { id: `liquid-${b.id}`, x: bx, y: by, color: b.liquidColor, type: 'liquid', delay: 200, timestamp: Date.now() },
          { id: `shock-${b.id}`, x: bx, y: by, color: 'white', isShockwave: true, timestamp: Date.now() }
        ]);
        return { ...b, isBroken: true, hitsTaken: b.hitsRequired, vx: (Math.random() - 0.5) * 25, vy: -15 - Math.random() * 20, rv: (Math.random() - 0.5) * 200 };
      }));
    }
  }));

  const animate = useCallback(() => {
    if (status !== GameStatus.PLAYING) {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    // WASD Movement
    const speed = 1.5;
    let dx = 0;
    let dy = 0;
    if (keysPressed.current.has('w')) dy -= speed;
    if (keysPressed.current.has('s')) dy += speed;
    if (keysPressed.current.has('a')) dx -= speed;
    if (keysPressed.current.has('d')) dx += speed;

    if (dx !== 0 || dy !== 0) {
      setCrosshair(prev => ({
        x: Math.max(0, Math.min(100, prev.x + dx)),
        y: Math.max(0, Math.min(100, prev.y + dy))
      }));
    }

    setBottles((prev) => prev.map((b) => {
      if (!b.isBroken) return b;
      const nextVy = b.vy + 0.5 * timeScale;
      const nextX = b.x + b.vx * timeScale;
      const nextY = b.y + b.vy * timeScale;
      const nextRotation = b.rotation + b.rv * timeScale;
      return { ...b, x: nextX, y: nextY, vy: nextVy, rotation: nextRotation, offScreen: nextY > 120 || nextX < -10 || nextX > 110 };
    }).filter(b => !b.offScreen || !b.isBroken));
    
    setPowerUps(prev => prev.map(p => ({ ...p, life: p.life - 0.005 * timeScale })).filter(p => p.life > 0));

    requestRef.current = requestAnimationFrame(animate);
  }, [status, timeScale]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [animate]);

  useEffect(() => { if (status === GameStatus.PLAYING) spawnBottles(); }, [status, spawnBottles]);
  useEffect(() => { if (status === GameStatus.PLAYING && bottles.length > 0 && bottles.every(b => b.isBroken)) setTimeout(() => spawnBottles(), 800); }, [bottles, spawnBottles, status]);

  const handleShootAt = (percX: number, percY: number) => {
    if (status !== GameStatus.PLAYING || (ammo <= 0 && activePowerUp !== PowerUpType.RAPID_FIRE)) return;
    const now = Date.now();
    const currentRifle = RIFLE_BENEFITS[rifleLevel - 1] || RIFLE_BENEFITS[0];
    const cooldown = activePowerUp === PowerUpType.RAPID_FIRE ? 80 : currentRifle.cooldown;
    
    if (now - lastShotTime.current < cooldown) return;
    lastShotTime.current = now;
    
    onShot();
    playSfx('shot');

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const absX = (percX / 100) * rect.width;
    const absY = (percY / 100) * rect.height;

    setFlash({ x: absX, y: absY });
    setTimeout(() => setFlash(null), activePowerUp === PowerUpType.RAPID_FIRE ? 30 : 50);

    const hitRadius = currentRifle.radius;

    setPowerUps(prev => prev.filter(p => {
      const dist = Math.sqrt(Math.pow(p.x - percX, 2) + Math.pow(p.y - percY, 2));
      if (dist < hitRadius * 2) {
        onPowerUp(p.type);
        playSfx('powerup');
        addFloatingText(p.x, p.y, "BONUS!", "#fbbf24");
        return false;
      }
      return true;
    }));

    setBottles((prev) => prev.map((b) => {
      if (b.isBroken) return b;
      const dx = Math.abs(b.x - percX);
      const dy = Math.abs(b.y - percY);
      
      if (dx < hitRadius && dy < 12 && percY < b.y + 5 && percY > b.y - 15) {
        const hitsTaken = b.hitsTaken + 1;
        const typeData = BOTTLE_TYPES.find((t) => t.type === b.type);
        const points = typeData?.points || 10;

        if (hitsTaken >= b.hitsRequired) {
          playSfx('break');
          onHit(points);
          addFloatingText(b.x, b.y - 10, `+${points}`, "#fcd34d", true);
          setHits((h) => [...h, 
            { id: `shard-${b.id}-${Date.now()}`, x: absX, y: absY, color: b.liquidColor, type: 'shards', delay: 0, timestamp: Date.now() },
            { id: `liquid-${b.id}-${Date.now()}`, x: absX, y: absY, color: b.liquidColor, type: 'liquid', delay: 200, timestamp: Date.now() },
            { id: `shock-${b.id}-${Date.now()}`, x: absX, y: absY, color: 'white', isShockwave: true, timestamp: Date.now() }
          ]);
          return { ...b, isBroken: true, hitsTaken, vx: (Math.random() - 0.5) * 8, vy: -12 - Math.random() * 5, rv: (Math.random() - 0.5) * 60, isHit: false };
        } else {
          playSfx('clink');
          setHits((h) => [...h, { id: `shock-${b.id}-${Date.now()}`, x: absX, y: absY, color: 'rgba(255,255,255,0.3)', isShockwave: true, timestamp: Date.now() }]);
          // Temporary "isHit" for visual flash
          return { ...b, hitsTaken, isHit: true };
        }
      }
      return b;
    }));

    // Reset isHit after a short delay for animation
    setTimeout(() => {
      setBottles(prev => prev.map(b => b.isHit ? { ...b, isHit: false } : b));
    }, 150);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCrosshair({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    });
  };

  const handleClick = () => {
    handleShootAt(crosshair.x, crosshair.y);
  };

  const getBottleSvg = (b: Bottle) => {
    const typeInfo = BOTTLE_TYPES.find(t => t.type === b.type);
    const scale = typeInfo?.scale || 1;
    const width = 40 * scale;
    const height = 80 * scale;

    return (
      <div className={b.isHit ? 'hit-flash' : ''}>
        <svg width={width} height={height} viewBox="0 0 40 80">
          <path
            d="M10 20 L10 10 Q10 5 15 5 L25 5 Q30 5 30 10 L30 20 L35 25 L35 75 Q35 80 30 80 L10 80 Q5 80 5 75 L5 25 Z"
            fill={b.color}
            stroke={b.isHit ? "#fff" : "#000"}
            strokeWidth={b.isHit ? "4" : "2"}
          />
          {!b.isBroken && (
            <rect x="8" y="30" width="24" height="40" fill={b.liquidColor} opacity="0.6" />
          )}
          {b.hitsRequired > 1 && !b.isBroken && (
            <text x="20" y="55" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" style={{ pointerEvents: 'none', filter: 'drop-shadow(1px 1px 1px black)' }}>
              {b.hitsRequired - b.hitsTaken}
            </text>
          )}
        </svg>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[60vh] bg-stone-900 border-b-8 border-amber-900 overflow-hidden select-none transition-transform duration-75 ${shake ? 'shake-heavy' : ''}`}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      style={{
        backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url("https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?q=80&w=2000&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute top-[70%] left-0 w-full h-4 bg-amber-950 shadow-xl" />
      
      {/* Mobile WASD Controls */}
      {status === GameStatus.PLAYING && (
        <div className="absolute bottom-4 left-4 flex flex-col items-center gap-1 md:hidden z-[70] pointer-events-auto">
          <button 
            onPointerDown={() => keysPressed.current.add('w')} 
            onPointerUp={() => keysPressed.current.delete('w')}
            onPointerLeave={() => keysPressed.current.delete('w')}
            className="w-12 h-12 bg-amber-900/80 rounded-lg flex items-center justify-center border border-amber-600 active:bg-amber-500 shadow-lg text-white font-bold"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
          <div className="flex gap-1">
            <button 
              onPointerDown={() => keysPressed.current.add('a')} 
              onPointerUp={() => keysPressed.current.delete('a')}
              onPointerLeave={() => keysPressed.current.delete('a')}
              className="w-12 h-12 bg-amber-900/80 rounded-lg flex items-center justify-center border border-amber-600 active:bg-amber-500 shadow-lg text-white font-bold"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onPointerDown={() => keysPressed.current.add('s')} 
              onPointerUp={() => keysPressed.current.delete('s')}
              onPointerLeave={() => keysPressed.current.delete('s')}
              className="w-12 h-12 bg-amber-900/80 rounded-lg flex items-center justify-center border border-amber-600 active:bg-amber-500 shadow-lg text-white font-bold"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <button 
              onPointerDown={() => keysPressed.current.add('d')} 
              onPointerUp={() => keysPressed.current.delete('d')}
              onPointerLeave={() => keysPressed.current.delete('d')}
              className="w-12 h-12 bg-amber-900/80 rounded-lg flex items-center justify-center border border-amber-600 active:bg-amber-500 shadow-lg text-white font-bold"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Visual Crosshair for WASD mode / mouse feedback */}
      <div 
        className="absolute w-8 h-8 pointer-events-none z-[60] transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
        style={{ left: `${crosshair.x}%`, top: `${crosshair.y}%` }}
      >
        <div className="absolute w-full h-0.5 bg-red-500/50" />
        <div className="absolute w-0.5 h-full bg-red-500/50" />
        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_red]" />
      </div>

      {flash && (
        <div 
          className="absolute rounded-full bg-yellow-400 opacity-60 blur-md pointer-events-none z-50"
          style={{ 
            left: flash.x, 
            top: flash.y, 
            width: activePowerUp === PowerUpType.RAPID_FIRE ? '140px' : '100px', 
            height: activePowerUp === PowerUpType.RAPID_FIRE ? '140px' : '100px', 
            transform: 'translate(-50%, -50%)',
            mixBlendMode: 'screen'
          }}
        />
      )}

      {floatingTexts.map(t => (
        <div
          key={t.id}
          className="absolute font-rye pointer-events-none font-bold text-lg whitespace-nowrap z-50 opacity-0 flex items-center gap-1"
          style={{ left: `${t.x}%`, top: `${t.y}%`, color: t.color, animation: 'float-up 1s ease-out forwards' }}
        >
          {t.text}
          {t.isStar && <Star className="w-4 h-4 fill-current text-yellow-400 animate-spin" />}
        </div>
      ))}

      {powerUps.map(p => (
        <div 
          key={p.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
          style={{ left: `${p.x}%`, top: `${p.y}%`, opacity: p.life }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-amber-400/20 rounded-full animate-ping scale-150" />
            <div className="bg-amber-950/80 backdrop-blur-md p-3 rounded-full border-2 border-amber-400 animate-pulse shadow-[0_0_20px_rgba(251,191,36,0.6)]">
              {p.type === PowerUpType.RAPID_FIRE ? <Zap className="text-yellow-400 w-6 h-6" /> : p.type === PowerUpType.SLOW_MO ? <Clock className="text-blue-400 w-6 h-6" /> : <Package className="text-green-400 w-6 h-6" />}
            </div>
          </div>
        </div>
      ))}

      {bottles.map((b) => (
        <div
          key={b.id}
          className="absolute transform -translate-x-1/2 -translate-y-full"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            opacity: b.isBroken ? 0.4 : 1,
            transform: `translate(-50%, -100%) rotate(${b.rotation}deg)`,
            pointerEvents: b.isBroken ? 'none' : 'auto',
          }}
        >
          {getBottleSvg(b)}
        </div>
      ))}

      {hits.map((h) => {
        if (h.isExplosion) return <div key={h.id} className="absolute pointer-events-none z-50 flex items-center justify-center" style={{ left: h.x, top: h.y }}><div className="absolute w-[400px] h-[400px] bg-orange-600/30 rounded-full animate-ping" /><div className="absolute w-[250px] h-[250px] bg-yellow-400 rounded-full blur-3xl opacity-60 animate-pulse" /></div>;
        if (h.isShockwave) return <React.Fragment key={h.id}><div className="absolute pointer-events-none border-[4px] border-amber-100/60 rounded-full animate-shockwave" style={{ left: h.x, top: h.y }} /><div className="absolute pointer-events-none w-8 h-8 bg-amber-200/20 rounded-full blur-xl animate-dust" style={{ left: h.x, top: h.y }} /></React.Fragment>;
        return <ParticleEffect key={h.id} x={h.x} y={h.y} color={h.color} type={h.type} delay={h.delay} />;
      })}

      <div className="absolute bottom-0 left-0 w-full h-24 overflow-hidden pointer-events-none">
        {hits.map((h, i) => (!h.isExplosion && !h.isShockwave && !h.isSmoke && !h.isFire && h.type === 'liquid') && (
          <div key={`puddle-${i}`} className="absolute rounded-full blur-md opacity-40 animate-pulse" style={{ left: `${(h.x / (containerRef.current?.clientWidth || 1)) * 100}%`, bottom: '-10px', width: '100px', height: '40px', backgroundColor: h.color, transform: 'translateX(-50%)' }} />
        ))}
      </div>

      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(-100px); opacity: 0; }
        }
      `}</style>
    </div>
  );
});
