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

const CELL_SIZE = 40;
const COLS = 17;
const ROWS = 11;

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
  const [moves, setMoves] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const animationFrameRef = useRef<number>();
  const playerPosRef = useRef<{ x: number; y: number; targetX: number; targetY: number; progress: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    progress: 1,
  });

  const goal = useMemo<Position>(() => ({ x: COLS - 1, y: ROWS - 1 }), []);

  useEffect(() => {
    handleReset();
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
    if (!maze.length || won || playerPosRef.current.progress < 1) return;
    if (!canMove(player, dir)) return;

    const next = { x: player.x + deltas[dir].x, y: player.y + deltas[dir].y };

    playerPosRef.current = {
      x: player.x,
      y: player.y,
      targetX: next.x,
      targetY: next.y,
      progress: 0,
    };

    setPlayer(next);
    setMoves((m) => m + 1);
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

    const animate = () => {
      if (playerPosRef.current.progress < 1) {
        playerPosRef.current.progress = Math.min(1, playerPosRef.current.progress + 0.15);
      }

      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const progress = easeOutCubic(playerPosRef.current.progress);

      const interpolatedX = playerPosRef.current.x + (playerPosRef.current.targetX - playerPosRef.current.x) * progress;
      const interpolatedY = playerPosRef.current.y + (playerPosRef.current.targetY - playerPosRef.current.y) * progress;

      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      for (const row of maze) {
        for (const cell of row) {
          const x = cell.x * CELL_SIZE;
          const y = cell.y * CELL_SIZE;

          ctx.strokeStyle = '#1e293b';

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

      const goalX = goal.x * CELL_SIZE + CELL_SIZE / 2;
      const goalY = goal.y * CELL_SIZE + CELL_SIZE / 2;
      const goalPulse = Math.sin(Date.now() / 300) * 2 + 12;

      const goalGradient = ctx.createRadialGradient(goalX, goalY, 0, goalX, goalY, goalPulse);
      goalGradient.addColorStop(0, '#22c55e');
      goalGradient.addColorStop(0.7, '#16a34a');
      goalGradient.addColorStop(1, '#15803d');
      ctx.fillStyle = goalGradient;
      ctx.beginPath();
      ctx.arc(goalX, goalY, goalPulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(34, 197, 94, 0.5)';
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(goalX, goalY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      const playerX = interpolatedX * CELL_SIZE + CELL_SIZE / 2;
      const playerY = interpolatedY * CELL_SIZE + CELL_SIZE / 2;

      const playerGradient = ctx.createRadialGradient(playerX, playerY, 0, playerX, playerY, 14);
      playerGradient.addColorStop(0, '#60a5fa');
      playerGradient.addColorStop(0.7, '#3b82f6');
      playerGradient.addColorStop(1, '#2563eb');

      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(59, 130, 246, 0.6)';
      ctx.fillStyle = playerGradient;
      ctx.beginPath();
      ctx.arc(playerX, playerY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (won) {
        const alpha = Math.min(1, (Date.now() % 2000) / 1000);
        ctx.fillStyle = `rgba(34, 197, 94, ${0.15 * alpha})`;
        ctx.fillRect(0, 0, width, height);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [maze, player, won, goal]);

  const handleReset = async () => {
    setIsGenerating(true);
    setWon(false);
    setMoves(0);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const newMaze = generateMaze(COLS, ROWS);
    setMaze(newMaze);
    setPlayer({ x: 0, y: 0 });
    playerPosRef.current = { x: 0, y: 0, targetX: 0, targetY: 0, progress: 1 };

    setIsGenerating(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 py-12 px-4">
      <div className="text-center space-y-2 animate-fade-in">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Labirinto 2D
        </h1>
        <p className="text-sm text-gray-600">
          Use <kbd className="px-2 py-1 text-xs font-semibold bg-gray-100 border border-gray-300 rounded">WASD</kbd> ou{' '}
          <kbd className="px-2 py-1 text-xs font-semibold bg-gray-100 border border-gray-300 rounded ml-1">↑↓←→</kbd>{' '}
          para mover
        </p>
      </div>

      <div className="relative animate-scale-in">
        <canvas
          ref={canvasRef}
          width={COLS * CELL_SIZE}
          height={ROWS * CELL_SIZE}
          className="rounded-xl border-2 border-gray-300 bg-white shadow-2xl transition-all duration-300 hover:shadow-blue-200"
          style={{
            filter: isGenerating ? 'blur(4px)' : 'none',
            opacity: isGenerating ? 0.5 : 1,
          }}
        />
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 animate-slide-up">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md border border-gray-200">
            <span className="text-gray-600">Movimentos:</span>
            <span className="font-bold text-blue-600 text-lg">{moves}</span>
          </div>
          {won && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-400 to-green-600 rounded-lg shadow-lg animate-bounce-in">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-semibold text-white">Você venceu!</span>
            </div>
          )}
        </div>

        <button
          onClick={handleReset}
          disabled={isGenerating}
          className="group relative px-6 py-3 font-medium text-white transition-all duration-200 rounded-lg overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 transition-transform duration-200 group-hover:scale-105"></span>
          <span className="relative flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {isGenerating ? 'Gerando...' : 'Novo Labirinto'}
          </span>
        </button>
      </div>

      <div className="mt-4 text-center text-xs text-gray-500 animate-fade-in-delay">
        <p>
          Alcance o{' '}
          <span className="inline-flex items-center justify-center w-3 h-3 bg-green-500 rounded-full"></span> círculo
          verde para vencer
        </p>
      </div>
    </div>
  );
};

export default Labirinto;
