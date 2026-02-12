
import React, { useEffect, useState } from 'react';
import { Particle } from '../types';

type ParticleType = 'shards' | 'liquid';

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

    const count = type === 'shards' ? 14 : 20;
    const newParticles: EnhancedParticle[] = Array.from({ length: count }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = type === 'shards' 
        ? Math.random() * 12 + 6  // Shards are fast
        : Math.random() * 5 + 2; // Liquid is slower
      
      return {
        id: Math.random().toString(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (type === 'shards' ? 6 : 3), // Initial pop up
        color: type === 'shards' ? '#f8fafc' : color, 
        life: 1.0,
        rotation: Math.random() * 360,
        rv: (Math.random() - 0.5) * 60,
        size: type === 'shards' ? Math.random() * 8 + 3 : Math.random() * 10 + 5,
        opacity: 1,
        scale: 1,
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
            vy: p.vy + (type === 'shards' ? 0.6 : 0.4), // Gravity
            vx: p.vx * 0.97, // Air resistance
            rotation: p.rotation + p.rv,
            life: p.life - (type === 'shards' ? 0.02 : 0.015),
            opacity: Math.max(0, p.life),
            scale: type === 'liquid' ? p.life * 1.2 : p.life,
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
            backgroundColor: p.color,
            opacity: p.opacity,
            transform: `translate(-50%, -50%) rotate(${p.rotation}deg) scale(${p.scale})`,
            borderRadius: type === 'liquid' ? '50%' : '0%',
            clipPath: type === 'shards' 
              ? `polygon(${Math.random() * 30}% 0%, 100% ${Math.random() * 30}%, ${70 + Math.random() * 30}% 100%, 0% ${70 + Math.random() * 30}%)` 
              : 'none',
            boxShadow: type === 'shards' ? '0 0 4px rgba(255,255,255,0.4)' : 'none',
            border: type === 'shards' ? '1px solid rgba(255,255,255,0.3)' : 'none',
          }}
        />
      ))}
    </div>
  );
};