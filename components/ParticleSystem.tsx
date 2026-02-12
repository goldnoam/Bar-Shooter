
import React, { useEffect, useState } from 'react';
import { Particle } from '../types';

type ParticleType = 'shards' | 'liquid' | 'gold' | 'star';

interface ParticleProps {
  x: number;
  y: number;
  color: string;
  type?: ParticleType;
  delay?: number;
}

interface EnhancedParticle extends Particle {
  rotation: number;
  rv: number;
  size: number;
  opacity: number;
  scale: number;
  isStar?: boolean;
}

export const ParticleEffect: React.FC<ParticleProps> = ({ x, y, color, type = 'liquid', delay = 0 }) => {
  const [particles, setParticles] = useState<EnhancedParticle[]>([]);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setActive(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!active) return;

    let count = 14;
    if (type === 'liquid') count = 20;
    if (type === 'gold') count = 15;
    if (type === 'star') count = 10;

    const newParticles: EnhancedParticle[] = Array.from({ length: count }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8;
      let speed = Math.random() * 5 + 2;
      
      if (type === 'shards') speed = Math.random() * 12 + 6;
      if (type === 'gold') speed = Math.random() * 10 + 5;
      if (type === 'star') speed = Math.random() * 6 + 3;
      
      return {
        id: Math.random().toString(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'shards' ? 8 : type === 'gold' ? 12 : type === 'star' ? 15 : 3),
        color: type === 'gold' ? '#fbbf24' : (type === 'star' ? '#fde047' : (type === 'shards' ? '#f8fafc' : color)), 
        life: 1.0,
        rotation: Math.random() * 360,
        rv: (Math.random() - 0.5) * 80,
        size: type === 'shards' ? Math.random() * 8 + 3 : (type === 'gold' ? 10 : type === 'star' ? 12 : Math.random() * 10 + 5),
        opacity: 1,
        scale: 1,
        isStar: type === 'star',
      };
    });
    setParticles(newParticles);

    const interval = setInterval(() => {
      setParticles((prev) => 
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + (type === 'shards' ? 0.6 : type === 'gold' ? 0.4 : type === 'star' ? 0.3 : 0.4), 
            vx: p.vx * 0.98, 
            rotation: p.rotation + p.rv,
            life: p.life - (type === 'shards' ? 0.02 : type === 'gold' ? 0.02 : type === 'star' ? 0.025 : 0.015),
            opacity: Math.max(0, p.life),
            scale: (type === 'liquid' || type === 'star') ? p.life * 1.5 : p.life,
          }))
          .filter((p) => p.life > 0)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [x, y, color, type, active]);

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: p.x,
            top: p.y,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.isStar ? 'transparent' : p.color,
            opacity: p.opacity,
            transform: `translate(-50%, -50%) rotate(${p.rotation}deg) scale(${p.scale})`,
            borderRadius: type === 'liquid' || type === 'gold' ? '50%' : '0%',
            clipPath: p.isStar 
              ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' 
              : (type === 'shards' 
                ? `polygon(${Math.random() * 30}% 0%, 100% ${Math.random() * 30}%, ${70 + Math.random() * 30}% 100%, 0% ${70 + Math.random() * 30}%)` 
                : 'none'),
            boxShadow: type === 'gold' ? '0 0 10px #d97706, inset 0 0 5px white' : (p.isStar ? 'none' : (type === 'shards' ? '0 0 4px rgba(255,255,255,0.4)' : 'none')),
            border: type === 'gold' ? '2px solid #92400e' : (type === 'shards' ? '1px solid rgba(255,255,255,0.3)' : 'none'),
            background: p.isStar ? p.color : undefined,
          }}
        >
          {type === 'gold' && (
             <div className="absolute inset-0 flex items-center justify-center text-[6px] font-bold text-amber-900 select-none">$</div>
          )}
        </div>
      ))}
    </div>
  );
};
