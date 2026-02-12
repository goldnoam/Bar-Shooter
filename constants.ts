export const INITIAL_AMMO = 40;
export const LEVEL_TIME = 30; // seconds
export const AMMO_REDUCTION_PER_LEVEL = 5;
export const BOTTLE_TYPES = [
  { type: 'whiskey', color: '#8B4513', liquidColor: '#CD853F', points: 10, hits: 1, scale: 1 },
  { type: 'wine', color: '#556B2F', liquidColor: '#800000', points: 15, hits: 1, scale: 0.9 },
  { type: 'gin', color: '#B0C4DE', liquidColor: '#F0F8FF', points: 20, hits: 1, scale: 0.8 },
  { type: 'tequila', color: '#FFD700', liquidColor: '#FFFFFF', points: 40, hits: 1, scale: 0.7 },
  { type: 'jug', color: '#4E3629', liquidColor: '#FFFFFF', points: 60, hits: 2, scale: 1.3 },
  { type: 'crystal', color: '#F0FFFF', liquidColor: '#00FFFF', points: 120, hits: 1, scale: 0.65 }, // Fragile & Expensive
  { type: 'barrel', color: '#3d2511', liquidColor: '#1a1108', points: 350, hits: 6, scale: 2.1 }, // Heavy Tank
  { type: 'canteen', color: '#708090', liquidColor: '#B0C4DE', points: 50, hits: 3, scale: 0.8 }, // Metal Toughness
] as const;

export const POWER_UP_DURATION = 8000; // 8 seconds

export const UPGRADE_COSTS = {
  AMMO: 150,
  TIME: 200,
  GRENADE: 300,
  RIFLE: 400,
};

export const RIFLE_BENEFITS = [
  { level: 1, radius: 3.5, cooldown: 450, label: "מתחיל" },
  { level: 2, radius: 5.0, cooldown: 300, label: "מיומן" },
  { level: 3, radius: 7.0, cooldown: 150, label: "צלף" },
  { level: 4, radius: 10.0, cooldown: 60, label: "אגדה" },
];