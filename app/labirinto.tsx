'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Direction = 'top' | 'right' | 'bottom' | 'left';

type MazeCell = {
  x: number;
  y: number;
  walls: Record<Direction, boolean>;
  visited: boolean;
};

type Position = { x: number; y: number };

const CELL_SIZE = 42;
const COLS = 15;
const ROWS = 10;

const directions: Direction[] = ['top', 'right', 'bottom', 'left'];

const deltas: Record<Direction, Position> = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
};

const opposite: Record<Direction, Direction> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};

const createGrid = (cols: number, rows: number): MazeCell[][] => {
  return Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (_, x) => ({
      x,
      y,
      visited: false,
      walls: { top: true, right: true, bottom: true, left: true },
    })),
  );
};

const getUnvisitedNeighbors = (grid: MazeCell[][], cell: MazeCell) => {
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

const generateMaze = (cols: number, rows: number) => {
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

const Labirinto = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [maze, setMaze] = useState<MazeCell[][]>([]);
  const [player, setPlayer] = useState<Position>({ x: 0, y: 0 });
  const [won, setWon] = useState(false);

  const goal = useMemo<Position>(() => ({ x: COLS - 1, y: ROWS - 1 }), []);

  useEffect(() => {
    setMaze(generateMaze(COLS, ROWS));
    setPlayer({ x: 0, y: 0 });
    setWon(false);
  }, []);

  const canMove = (from: Position, dir: Direction) => {
    const cell = maze[from.y]?.[from.x];
    if (!cell) return false;
    if (cell.walls[dir]) return false;

    const nx = from.x + deltas[dir].x;
    const ny = from.y + deltas[dir].y;
    return nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS;
  };

  const handleMove = (dir: Direction) => {
    if (!maze.length || won) return;
    if (!canMove(player, dir)) return;

    const next = { x: player.x + deltas[dir].x, y: player.y + deltas[dir].y };
    setPlayer(next);
    if (next.x === goal.x && next.y === goal.y) setWon(true);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'top',
        w: 'top',
        ArrowRight: 'right',
        d: 'right',
        ArrowDown: 'bottom',
        s: 'bottom',
        ArrowLeft: 'left',
        a: 'left',
      };

      const dir = map[event.key];
      if (dir) {
        event.preventDefault();
        handleMove(dir);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [maze, player, won]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !maze.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = COLS * CELL_SIZE;
    const height = ROWS * CELL_SIZE;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0f172a';

    for (const row of maze) {
      for (const cell of row) {
        const x = cell.x * CELL_SIZE;
        const y = cell.y * CELL_SIZE;

        if (cell.walls.top) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + CELL_SIZE, y);
          ctx.stroke();
        }
        if (cell.walls.right) {
          ctx.beginPath();
          ctx.moveTo(x + CELL_SIZE, y);
          ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE);
          ctx.stroke();
        }
        if (cell.walls.bottom) {
          ctx.beginPath();
          ctx.moveTo(x, y + CELL_SIZE);
          ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE);
          ctx.stroke();
        }
        if (cell.walls.left) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + CELL_SIZE);
          ctx.stroke();
        }
      }
    }

    const drawSquare = (pos: Position, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        pos.x * CELL_SIZE + 6,
        pos.y * CELL_SIZE + 6,
        CELL_SIZE - 12,
        CELL_SIZE - 12,
      );
    };

    drawSquare(goal, '#1f7a1f');
    drawSquare(player, '#1f4fff');

    if (won) {
      ctx.fillStyle = 'rgba(31, 122, 31, 0.18)';
      ctx.fillRect(0, 0, width, height);
    }
  }, [maze, player, won, goal]);

  const handleReset = () => {
    setMaze(generateMaze(COLS, ROWS));
    setPlayer({ x: 0, y: 0 });
    setWon(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Labirinto 2D</h1>
      <p className="text-sm text-gray-600">Use WASD ou setas para mover. Objetivo: canto inferior direito.</p>
      <canvas
        ref={canvasRef}
        width={COLS * CELL_SIZE}
        height={ROWS * CELL_SIZE}
        className="rounded-md border border-gray-300 bg-white shadow-sm"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleReset}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Novo labirinto
        </button>
        {won && <span className="text-sm font-semibold text-green-700">Voce venceu!</span>}
      </div>
    </div>
  );
};

export default Labirinto;
