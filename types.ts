export enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  SHOP = 'SHOP',
  GAME_OVER = 'GAME_OVER',
}

export interface Bottle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rv: number; // angular velocity
  type: string;
  color: string;
  liquidColor: string;
  isBroken: boolean;
  isHit: boolean;
  hitsRequired: number;
  hitsTaken: number;
  scale: number;
  offScreen?: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

export enum PowerUpType {
  RAPID_FIRE = 'RAPID_FIRE',
  SLOW_MO = 'SLOW_MO',
  EXTRA_AMMO = 'EXTRA_AMMO',
}

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: PowerUpType;
  life: number;
}

export interface ScoreEntry {
  name: string;
  score: number;
  date: string;
}

export interface PlayerStats {
  score: number;
  level: number;
  ammo: number;
  totalAmmo: number;
  grenades: number;
  rifleLevel: number;
  highScores: ScoreEntry[];
  activePowerUp: PowerUpType | null;
  powerUpTime: number;
}