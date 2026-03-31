import { deltas, directions, opposite, DIFFICULTIES } from './constants';
import type { Difficulty, Direction, MazeCell, Position } from './types';

export const createGrid = (cols: number, rows: number): MazeCell[][] => {
  return Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (_, x) => ({
      x,
      y,
      visited: false,
      walls: { top: true, right: true, bottom: true, left: true },
    })),
  );
};

export const getUnvisitedNeighbors = (grid: MazeCell[][], cell: MazeCell) => {
  const neighbors: Array<{ dir: Direction; cell: MazeCell }> = [];

  for (const dir of directions) {
    const nx = cell.x + deltas[dir].x;
    const ny = cell.y + deltas[dir].y;
    if (ny < 0 || ny >= grid.length || nx < 0 || nx >= grid[0].length) continue;
    const candidate = grid[ny][nx];
    if (!candidate.visited) neighbors.push({ dir, cell: candidate });
  }

  return neighbors;
};

export const generateMaze = (cols: number, rows: number) => {
  const grid = createGrid(cols, rows);
  const stack: MazeCell[] = [];

  const start = grid[0][0];
  start.visited = true;
  stack.push(start);

  while (stack.length) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(grid, current);

    if (!neighbors.length) {
      stack.pop();
      continue;
    }

    const { dir, cell } = neighbors[Math.floor(Math.random() * neighbors.length)];

    current.walls[dir] = false;
    cell.walls[opposite[dir]] = false;

    cell.visited = true;
    stack.push(cell);
  }

  return grid;
};

export const canMoveInMaze = (maze: MazeCell[][], from: Position, dir: Direction) => {
  const cell = maze[from.y]?.[from.x];
  if (!cell) return false;
  if (cell.walls[dir]) return false;

  const cols = maze[0]?.length || 0;
  const rows = maze.length;
  const nx = from.x + deltas[dir].x;
  const ny = from.y + deltas[dir].y;
  return nx >= 0 && nx < cols && ny >= 0 && ny < rows;
};

export const getRandomDifficulty = (): Difficulty => {
  return DIFFICULTIES[Math.floor(Math.random() * DIFFICULTIES.length)];
};
