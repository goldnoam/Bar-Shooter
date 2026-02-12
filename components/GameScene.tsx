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
  type?: 'shards' | 'liquid' | 'gold' | 'star';
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

  const playSfx = useCallback((key: keyof typeof SOUNDS) => {
    if (isMuted) return;
    const audio = new Audio(SOUNDS[key]);
    audio.volume = 0.4;
    audio.play().catch(() => {});
  }, [isMuted]);

  const addFloatingText = useCallback((x: number, y: number, text: string, color: string, isStar = false) => {
    const id = Math.random().toString();
    setFloatingTexts(prev => [...prev, { id, x, y, text, color, isStar }]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(t => t.id !== id)), 1000);
  }, []);

  const handleShootAt = useCallback((xPercent: number, yPercent: number) => {
    if (status !== GameStatus.PLAYING) return;
    const now = Date.now();
    const cooldown = RIFLE_BENEFITS[rifleLevel - 1]?.cooldown || 450;
    
    if (now - lastShotTime.current < cooldown) return;
    if (ammo <= 0 && activePowerUp !== PowerUpType.RAPID_FIRE) return;

    lastShotTime.current = now;
    onShot();
    playSfx('shot');
    
    setFlash({ x: xPercent, y: yPercent });
    setTimeout(() => setFlash(null), 50);

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const hitRadius = RIFLE_BENEFITS[rifleLevel - 1]?.radius || 3.5;
    
    setBottles(prev => prev.map(b => {
      if (b.isBroken) return b;
      const dx = b.x - xPercent;
      const dy = b.y - yPercent;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < hitRadius) {
        const newHitsTaken = b.hitsTaken + 1;
        const isNowBroken = newHitsTaken >= b.hitsRequired;
        
        if (isNowBroken) {
          playSfx('break');
          const typeInfo = BOTTLE_TYPES.find(t => t.type === b.type);
          onHit(typeInfo?.points || 10);
          addFloatingText(b.x, b.y - 10, `+${typeInfo?.points || 10}`, '#fbbf24', true);
          
          const px = (b.x / 100) * rect.width;
          const py = (b.y / 100) * rect.height;
          
          // DRAMATIC SHARDING: Multi-stage effects
          setHits(h => [...h, 
            { id: Math.random().toString(), x: px, y: py, color: b.color, type: 'shards', timestamp: Date.now() },
            // INCREASED DELAY for liquid spill - makes breaking feel more mechanical and satisfying
            { id: Math.random().toString(), x: px, y: py, color: b.liquidColor, type: 'liquid', delay: 450, timestamp: Date.now() },
            { id: Math.random().toString(), x: px, y: py, color: '#fbbf24', type: 'gold', delay: 20, timestamp: Date.now() },
            { id: Math.random().toString(), x: px, y: py, color: '#fde047', type: 'star', delay: 40, timestamp: Date.now() }
          ]);
          
          return { ...b, isBroken: true, hitsTaken: newHitsTaken, vx: (Math.random() - 0.5) * 15, vy: -20, rv: (Math.random() - 0.5) * 40 };
        } else {
          playSfx('clink');
          return { ...b, hitsTaken: newHitsTaken, isHit: true };
        }
      }
      return b;
    }));

    setPowerUps(prev => prev.filter(p => {
      const dx = p.x - xPercent;
      const dy = p.y - yPercent;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 5) {
        onPowerUp(p.type);
        playSfx('powerup');
        addFloatingText(p.x, p.y, p.type.replace('_', ' '), '#fbbf24', true);
        return false;
      }
      return true;
    }));
  }, [status, ammo, activePowerUp, rifleLevel, onShot, onHit, onPowerUp, playSfx, addFloatingText]);

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
  }, [status, crosshair, handleShootAt]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setHits(prev => prev.filter(h => now - h.timestamp < 3000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
        scale: typeInfo.scale,
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

  useEffect(() => {
    if (status === GameStatus.PLAYING && bottles.length === 0) {
      spawnBottles();
    }
  }, [status, bottles.length, spawnBottles]);

  useImperativeHandle(ref, () => ({
    triggerGrenade: () => {
      if (status !== GameStatus.PLAYING) return;
      playSfx('explosion');
      setShake(true);
      setTimeout(() => setShake(false), 800);
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const exX = 50; 
      const exY = 75;
      const cx = (exX / 100) * rect.width;
      const cy = (exY / 100) * rect.height;
      addFloatingText(50, 40, "פיצוץ מסיבי!", "#ff4500");
      
      const timestamp = Date.now();
      const grenadeHits: HitEffect[] = [
        { id: 'grenade-' + timestamp, x: cx, y: cy, color: '#ff4500', isExplosion: true, timestamp },
        { id: 'shock-' + timestamp, x: cx, y: cy, color: 'white', isShockwave: true, timestamp }
      ];

      for (let i = 0; i < 15; i++) {
        grenadeHits.push({
          id: `smoke-${i}-${timestamp}`,
          x: cx + (Math.random() - 0.5) * 200,
          y: cy + (Math.random() - 0.5) * 100,
          color: '#555',
          isSmoke: true,
          timestamp,
          size: 40 + Math.random() * 80
        });
        grenadeHits.push({
          id: `fire-${i}-${timestamp}`,
          x: cx + (Math.random() - 0.5) * 150,
          y: cy + (Math.random() - 0.5) * 50,
          color: '#ff8c00',
          isFire: true,
          timestamp,
          size: 15 + Math.random() * 30
        });
      }

      setBottles(prev => {
        const newBottles = prev.map(b => {
          if (b.isBroken) return b;
          onHit(5);
          
          const dx = b.x - exX;
          const dy = b.y - exY;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 60 / (dist * 0.1 + 1);
          
          const bx = (b.x / 100) * rect.width;
          const by = (b.y / 100) * rect.height;
          
          grenadeHits.push(
            { id: `g-shard-${b.id}-${timestamp}`, x: bx, y: by, color: b.color, type: 'shards', timestamp },
            { id: `g-liq-${b.id}-${timestamp}`, x: bx, y: by, color: b.liquidColor, type: 'liquid', delay: 450, timestamp },
            { id: `g-gold-${b.id}-${timestamp}`, x: bx, y: by, color: '#fbbf24', type: 'gold', timestamp },
            { id: `g-star-${b.id}-${timestamp}`, x: bx, y: by, color: '#fde047', type: 'star', timestamp }
          );

          return {
            ...b,
            isBroken: true,
            vx: (dx / dist) * force,
            vy: (dy / dist) * force - 10,
            rv: (Math.random() - 0.5) * 50
          };
        });
        setHits(h => [...h, ...grenadeHits]);
        return newBottles;
      });
    }
  }), [status, onHit, playSfx, addFloatingText]);

  useEffect(() => {
    let lastTime = 0;
    const loop = (time: number) => {
      const dt = (time - lastTime) / 16;
      lastTime = time;

      if (status === GameStatus.PLAYING) {
        const speed = 1.5;
        let dx = 0;
        let dy = 0;
        if (keysPressed.current.has('w') || keysPressed.current.has('arrowup')) dy -= speed;
        if (keysPressed.current.has('s') || keysPressed.current.has('arrowdown')) dy += speed;
        if (keysPressed.current.has('a') || keysPressed.current.has('arrowleft')) dx -= speed;
        if (keysPressed.current.has('d') || keysPressed.current.has('arrowright')) dx += speed;
        
        if (dx !== 0 || dy !== 0) {
          setCrosshair(prev => ({
            x: Math.max(0, Math.min(100, prev.x + dx)),
            y: Math.max(0, Math.min(100, prev.y + dy))
          }));
        }

        setBottles(prev => 
          prev.map(b => {
            if (!b.isBroken) return b;
            return {
              ...b,
              x: b.x + b.vx * dt * timeScale,
              y: b.y + b.vy * dt * timeScale,
              vy: b.vy + 0.8 * dt * timeScale,
              rotation: b.rotation + b.rv * dt * timeScale,
            };
          }).filter(b => b.y < 120)
        );
      }
      requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [status, timeScale]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (status !== GameStatus.PLAYING) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCrosshair({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    });
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-[600px] bg-[url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80')] bg-cover bg-center overflow-hidden cursor-none select-none rounded-xl border-4 border-amber-900 shadow-inner ${shake ? 'animate-shake' : ''}`}
      onMouseMove={handleMouseMove}
      onClick={() => handleShootAt(crosshair.x, crosshair.y)}
    >
      <div className="absolute inset-0 bg-black/40" />
      
      <div className="absolute bottom-1/4 left-0 w-full h-8 bg-amber-950 border-y-2 border-amber-900 shadow-2xl" />

      {bottles.map(b => (
        <div
          key={b.id}
          className="absolute transition-transform"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            transform: `translate(-50%, -100%) rotate(${b.rotation}deg) scale(${b.scale || 1})`,
            opacity: b.isBroken ? 0.8 : 1,
            zIndex: b.isBroken ? 10 : 20,
          }}
        >
          <div className="relative group">
            <div 
              className={`w-8 h-20 rounded-t-lg transition-colors ${b.isHit ? 'animate-ping' : ''}`}
              style={{ backgroundColor: b.color, border: '2px solid rgba(255,255,255,0.2)' }}
            />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-6 bg-inherit brightness-90 rounded-t-sm" />
            {!b.isBroken && b.hitsRequired > 1 && (
               <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {Array.from({ length: b.hitsRequired }).map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i < b.hitsTaken ? 'bg-red-500' : 'bg-white/40'}`} />
                  ))}
               </div>
            )}
          </div>
        </div>
      ))}

      {powerUps.map(p => (
        <div
          key={p.id}
          className="absolute flex flex-col items-center animate-pulse"
          style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="p-3 bg-yellow-500 rounded-full border-2 border-white shadow-lg shadow-yellow-500/50">
            {p.type === PowerUpType.RAPID_FIRE && <Zap className="w-6 h-6 text-white" />}
            {p.type === PowerUpType.SLOW_MO && <Clock className="w-6 h-6 text-white" />}
            {p.type === PowerUpType.EXTRA_AMMO && <Package className="w-6 h-6 text-white" />}
          </div>
        </div>
      ))}

      {hits.map(h => (
        <React.Fragment key={h.id}>
          {h.isExplosion && (
            <div 
              className="absolute animate-explosion rounded-full bg-orange-500/40"
              style={{ left: h.x, top: h.y, width: 400, height: 400, transform: 'translate(-50%, -50%)' }}
            />
          )}
          {h.isShockwave && (
            <div 
              className="absolute animate-shockwave rounded-full border-4 border-white/50"
              style={{ left: h.x, top: h.y, width: 600, height: 600, transform: 'translate(-50%, -50%)' }}
            />
          )}
          {h.isSmoke && (
             <div 
              className="absolute bg-stone-500/20 rounded-full blur-xl animate-smoke"
              style={{ left: h.x, top: h.y, width: h.size, height: h.size, transform: 'translate(-50%, -50%)' }}
            />
          )}
          {h.isFire && (
             <div 
              className="absolute bg-orange-600/30 rounded-full blur-md animate-fire"
              style={{ left: h.x, top: h.y, width: h.size, height: h.size, transform: 'translate(-50%, -50%)' }}
            />
          )}
          {!h.isExplosion && !h.isShockwave && !h.isSmoke && !h.isFire && (
            <ParticleEffect x={h.x} y={h.y} color={h.color} type={h.type} delay={h.delay} />
          )}
        </React.Fragment>
      ))}

      {floatingTexts.map(t => (
        <div
          key={t.id}
          className="absolute font-rye text-2xl font-bold animate-float-up flex items-center gap-2"
          style={{ left: `${t.x}%`, top: `${t.y}%`, color: t.color, transform: 'translateX(-50%)' }}
        >
          {t.isStar && <Star className="w-5 h-5 fill-current" />}
          {t.text}
        </div>
      ))}

      {flash && (
        <div 
          className="absolute w-12 h-12 bg-white rounded-full blur-md opacity-60 animate-flash"
          style={{ left: `${flash.x}%`, top: `${flash.y}%`, transform: 'translate(-50%, -50%)' }}
        />
      )}

      <div 
        className="absolute pointer-events-none z-50 transition-transform duration-75"
        style={{ left: `${crosshair.x}%`, top: `${crosshair.y}%`, transform: 'translate(-50%, -50%)' }}
      >
        <div className="relative">
          {activePowerUp === PowerUpType.RAPID_FIRE && (
            <div className="absolute w-12 h-12 rounded-full bg-yellow-400/30 border-2 border-yellow-500/50 animate-aura" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />
          )}
          <div className="w-10 h-10 border-2 border-red-500 rounded-full flex items-center justify-center">
             <div className="w-1 h-1 bg-red-500 rounded-full" />
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-red-500" />
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-red-500" />
             <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-0.5 bg-red-500" />
             <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-0.5 bg-red-500" />
          </div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1 items-center bg-black/40 px-2 py-0.5 rounded text-[8px] font-bold text-white border border-white/20 whitespace-nowrap">
            <span>LVL {rifleLevel}</span>
            <div className="w-12 h-1 bg-white/20 rounded overflow-hidden">
               <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${Math.min(100, (Date.now() - lastShotTime.current) / (RIFLE_BENEFITS[rifleLevel-1]?.cooldown || 450) * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

GameScene.displayName = 'GameScene';