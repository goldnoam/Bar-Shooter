
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
    if (type === 'liquid') count = 35; // More liquid for splatter
    if (type === 'gold') count = 15;
    if (type === 'star') count = 10;
    if (type === 'shards') count = 30; // More shards for impact

    const newParticles: EnhancedParticle[] = Array.from({ length: count }).map((_, i) => {
      // Dynamic spread for shards - more explosive
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 2.5;
      let speed = Math.random() * 6 + 2;
      
      if (type === 'shards') speed = Math.random() * 22 + 12; // Extremely fast shards
      if (type === 'gold') speed = Math.random() * 12 + 6;
      if (type === 'star') speed = Math.random() * 8 + 4;
      if (type === 'liquid') speed = Math.random() * 5 + 2;
      
      return {
        id: Math.random().toString(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'shards' ? 18 : type === 'gold' ? 14 : type === 'star' ? 18 : type === 'liquid' ? 8 : 4),
        color: type === 'gold' ? '#fbbf24' : (type === 'star' ? '#fde047' : (type === 'shards' ? '#f8fafc' : color)), 
        life: 1.0,
        rotation: Math.random() * 360,
        rv: (Math.random() - 0.5) * 200, // Very fast rotation for shards
        size: type === 'shards' ? Math.random() * 14 + 3 : (type === 'gold' ? 10 : type === 'star' ? 12 : Math.random() * 16 + 8),
        opacity: 1,
        scale: 0.2, // Start small for pop effect
        isStar: type === 'star',
      };
    });
    setParticles(newParticles);

    const interval = setInterval(() => {
      setParticles((prev) => 
        prev
          .map((p) => {
            // Pop out animation logic
            let nextScale = p.scale;
            if (p.life > 0.9) {
                nextScale = Math.min(2.0, p.scale + 0.3);
            } else {
                nextScale = (type === 'liquid' || type === 'star') ? p.life * 2.0 : p.life;
            }

            return {
              ...p,
              x: p.x + p.vx,
              y: p.y + p.vy,
              vy: p.vy + (type === 'shards' ? 1.0 : type === 'gold' ? 0.4 : type === 'star' ? 0.3 : 0.4), 
              vx: p.vx * (type === 'liquid' ? 0.93 : 0.98), 
              rotation: p.rotation + p.rv,
              life: p.life - (type === 'shards' ? 0.01 : type === 'gold' ? 0.018 : type === 'star' ? 0.022 : 0.015),
              opacity: Math.max(0, p.life),
              scale: nextScale,
            };
          })
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
                ? `polygon(${Math.random() * 50}% 0%, 100% ${Math.random() * 50}%, ${50 + Math.random() * 50}% 100%, 0% ${50 + Math.random() * 50}%)` 
                : 'none'),
            boxShadow: type === 'gold' ? '0 0 12px #d97706, inset 0 0 6px white' : (p.isStar ? 'none' : (type === 'shards' ? '0 0 10px rgba(255,255,255,0.8)' : 'none')),
            border: type === 'gold' ? '2px solid #92400e' : (type === 'shards' ? '1px solid rgba(255,255,255,0.6)' : 'none'),
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
