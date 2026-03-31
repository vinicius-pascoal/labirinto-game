import type { Difficulty, Direction, Position } from './types';

export const CELL_SIZE = 48;

export const DIFFICULTY_CONFIG: Record<Difficulty, { cols: number; rows: number; label: string }> = {
  easy: { cols: 11, rows: 9, label: 'Fácil' },
  medium: { cols: 14, rows: 10, label: 'Médio' },
  hard: { cols: 17, rows: 12, label: 'Difícil' },
};

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export const RACE_TIME_LIMIT = 5 * 60 * 1000;

export const directions: Direction[] = ['top', 'right', 'bottom', 'left'];

export const deltas: Record<Direction, Position> = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

export const opposite: Record<Direction, Direction> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};
