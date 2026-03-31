export type Direction = 'top' | 'right' | 'bottom' | 'left';
export type GameMode = 'menu' | 'standard' | 'race' | 'infinite';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type MazeCell = {
  x: number;
  y: number;
  walls: Record<Direction, boolean>;
  visited: boolean;
};

export type Position = { x: number; y: number };

export type ConfettiParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
};

export type PlayerAnimationState = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  direction: Direction | null;
};

export type TrailParticle = { x: number; y: number; alpha: number };

export type PandaImages = {
  idle: HTMLImageElement | null;
  north: HTMLImageElement | null;
  south: HTMLImageElement | null;
  east: HTMLImageElement | null;
  west: HTMLImageElement | null;
};
