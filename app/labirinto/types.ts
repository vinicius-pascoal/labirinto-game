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
