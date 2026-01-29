'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Direction = 'top' | 'right' | 'bottom' | 'left';
type GameMode = 'menu' | 'standard' | 'race' | 'infinite';
type Difficulty = 'easy' | 'medium' | 'hard';

type MazeCell = {
  x: number;
  y: number;
  walls: Record<Direction, boolean>;
  visited: boolean;
};

type Position = { x: number; y: number };

const CELL_SIZE = 48;

const DIFFICULTY_CONFIG: Record<Difficulty, { cols: number; rows: number; label: string }> = {
  easy: { cols: 11, rows: 9, label: 'Fácil' },
  medium: { cols: 14, rows: 10, label: 'Médio' },
  hard: { cols: 17, rows: 12, label: 'Difícil' },
};

const RACE_TIME_LIMIT = 5 * 60 * 1000; // 5 minutos em ms

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
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [infiniteDifficulty, setInfiniteDifficulty] = useState<Difficulty>('medium');
  const [mazesCompleted, setMazesCompleted] = useState(0);
  const [maze, setMaze] = useState<MazeCell[][]>([]);
  const [player, setPlayer] = useState<Position>({ x: 0, y: 0 });
  const [won, setWon] = useState(false);
  const [moves, setMoves] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const confettiRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    rotation: number;
    rotationSpeed: number;
  }>>([]);
  const playerPosRef = useRef<{
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    progress: number;
    direction: Direction | null;
  }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    progress: 1,
    direction: null,
  });
  const trailRef = useRef<Array<{ x: number; y: number; alpha: number }>>([]);
  const keysPressed = useRef<Set<string>>(new Set());
  const moveIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastMoveTimeRef = useRef<number>(0);

  // Refs para as imagens do panda
  const pandaImages = useRef<{
    idle: HTMLImageElement | null;
    north: HTMLImageElement | null;
    south: HTMLImageElement | null;
    east: HTMLImageElement | null;
    west: HTMLImageElement | null;
  }>({
    idle: null,
    north: null,
    south: null,
    east: null,
    west: null,
  });
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Carregar imagens do panda
  useEffect(() => {
    const loadImages = async () => {
      const imagePromises = [
        { key: 'idle', src: '/panda/fat_panda_in_8bit_animation_breathing-idle_south.gif' },
        { key: 'north', src: '/panda/fat_panda_in_8bit_animation_walk_north.gif' },
        { key: 'south', src: '/panda/fat_panda_in_8bit_animation_walk_south.gif' },
        { key: 'east', src: '/panda/fat_panda_in_8bit_animation_walk_east.gif' },
        { key: 'west', src: '/panda/fat_panda_in_8bit_animation_walk_west.gif' },
      ].map(({ key, src }) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            pandaImages.current[key as keyof typeof pandaImages.current] = img;
            resolve();
          };
          img.onerror = () => {
            console.error(`Erro ao carregar imagem: ${src}`);
            resolve();
          };
          img.src = src;
        });
      });

      await Promise.all(imagePromises);
      setImagesLoaded(true);
    };

    loadImages();
  }, []);

  const getCurrentDifficulty = (): Difficulty => {
    if (gameMode === 'race') {
      const level = Math.floor(mazesCompleted / 2);
      if (level === 0) return 'easy';
      if (level === 1) return 'medium';
      return 'hard';
    }
    if (gameMode === 'infinite') {
      return infiniteDifficulty;
    }
    return difficulty;
  };

  const getCurrentMazeSize = () => {
    const currentDiff = getCurrentDifficulty();
    return DIFFICULTY_CONFIG[currentDiff];
  };

  const goal = useMemo<Position>(() => {
    if (!maze.length) return { x: 0, y: 0 };
    const cols = maze[0].length;
    const rows = maze.length;
    return { x: cols - 1, y: rows - 1 };
  }, [maze]);

  useEffect(() => {
    // Não inicializa automaticamente, aguarda seleção no menu
  }, []);

  useEffect(() => {
    if (isRunning && !won) {
      timerIntervalRef.current = setInterval(() => {
        setTimer((t) => {
          if (gameMode === 'race') {
            const newTime = t - 10;
            if (newTime <= 0) {
              setIsRunning(false);
              setWon(true);
              return 0;
            }
            return newTime;
          }
          return t + 10;
        });
      }, 10);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRunning, won, gameMode]);

  const canMove = (from: Position, dir: Direction) => {
    const cell = maze[from.y]?.[from.x];
    if (!cell) return false;
    if (cell.walls[dir]) return false;

    const cols = maze[0]?.length || 0;
    const rows = maze.length;
    const nx = from.x + deltas[dir].x;
    const ny = from.y + deltas[dir].y;
    return nx >= 0 && nx < cols && ny >= 0 && ny < rows;
  };

  const createConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const colors = ['#f87171', '#fb923c', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#ec4899'];
    confettiRef.current = [];

    for (let i = 0; i < 50; i++) {
      confettiRef.current.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
      });
    }
  };

  const handleReset = async (backToMenu = true) => {
    setIsGenerating(true);
    setWon(false);
    setMoves(0);

    if (backToMenu) {
      setGameMode('menu');
      setTimer(0);
      setMazesCompleted(0);
    }

    // Se for modo infinito, escolher nova dificuldade aleatória
    if (gameMode === 'infinite' && !backToMenu) {
      const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
      setInfiniteDifficulty(difficulties[Math.floor(Math.random() * difficulties.length)]);
    }

    setIsRunning(false);
    confettiRef.current = [];
    keysPressed.current.clear();
    if (moveIntervalRef.current) clearTimeout(moveIntervalRef.current);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const { cols, rows } = getCurrentMazeSize();
    const newMaze = generateMaze(cols, rows);
    setMaze(newMaze);
    setPlayer({ x: 0, y: 0 });
    playerPosRef.current = { x: 0, y: 0, targetX: 0, targetY: 0, progress: 1, direction: null };
    trailRef.current = [];

    setIsGenerating(false);
  };

  const handleMove = (dir: Direction, isFastMove = false) => {
    const minProgress = isFastMove ? 0.5 : 1;
    if (!maze.length || won || playerPosRef.current.progress < minProgress) return;
    if (!canMove(player, dir)) return;

    const next = { x: player.x + deltas[dir].x, y: player.y + deltas[dir].y };

    playerPosRef.current = {
      x: player.x,
      y: player.y,
      targetX: next.x,
      targetY: next.y,
      progress: 0,
      direction: dir,
    };

    setPlayer(next);
    setMoves((m) => m + 1);

    if (!isRunning) setIsRunning(true);

    if (next.x === goal.x && next.y === goal.y) {
      if (gameMode === 'race' || gameMode === 'infinite') {
        setMazesCompleted((m) => m + 1);
        setTimeout(() => {
          handleReset(false); // Resetar sem voltar ao menu
        }, 500);
      } else {
        setWon(true);
        setIsRunning(false);
        createConfetti();
      }
    }
  };

  useEffect(() => {
    const keyMap: Record<string, Direction> = {
      ArrowUp: 'top',
      w: 'top',
      ArrowRight: 'right',
      d: 'right',
      ArrowDown: 'bottom',
      s: 'bottom',
      ArrowLeft: 'left',
      a: 'left',
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const dir = keyMap[event.key];
      if (!dir || won) return;

      event.preventDefault();

      // Se a tecla já está pressionada, não faz nada (evita repetição do browser)
      if (keysPressed.current.has(event.key)) return;

      keysPressed.current.add(event.key);

      // Primeiro movimento imediato
      handleMove(dir, false);

      // Configurar movimento contínuo após delay inicial
      if (moveIntervalRef.current) clearTimeout(moveIntervalRef.current);

      moveIntervalRef.current = setTimeout(() => {
        const continuousMove = () => {
          if (keysPressed.current.has(event.key) && !won) {
            handleMove(dir, true);
            moveIntervalRef.current = setTimeout(continuousMove, 80); // movimento rápido a cada 80ms
          }
        };
        continuousMove();
      }, 250); // delay inicial de 250ms antes do movimento contínuo
    };

    const onKeyUp = (event: KeyboardEvent) => {
      keysPressed.current.delete(event.key);
      if (moveIntervalRef.current) {
        clearTimeout(moveIntervalRef.current);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (moveIntervalRef.current) clearTimeout(moveIntervalRef.current);
      keysPressed.current.clear();
    };
  }, [maze, player, won]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !maze.length) return;

    const cols = maze[0].length;
    const rows = maze.length;
    const newWidth = cols * CELL_SIZE;
    const newHeight = rows * CELL_SIZE;

    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      canvas.width = newWidth;
      canvas.height = newHeight;
    }
  }, [maze]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !maze.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cols = maze[0].length;
    const rows = maze.length;
    const width = cols * CELL_SIZE;
    const height = rows * CELL_SIZE;

    const animate = () => {
      if (playerPosRef.current.progress < 1) {
        // Aceleração da animação durante movimento rápido
        const speedMultiplier = keysPressed.current.size > 0 ? 0.25 : 0.15;
        playerPosRef.current.progress = Math.min(1, playerPosRef.current.progress + speedMultiplier);
      }

      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easeOutBack = (t: number) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      };
      const progress = easeOutCubic(playerPosRef.current.progress);
      const bounceProgress = easeOutBack(playerPosRef.current.progress);

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

      // Adicionar partículas na trilha durante movimento
      if (playerPosRef.current.progress < 0.8) {
        trailRef.current.push({ x: playerX, y: playerY, alpha: 0.6 });
        if (trailRef.current.length > 15) trailRef.current.shift();
      }

      // Desenhar trilha de partículas
      trailRef.current = trailRef.current.filter(particle => {
        particle.alpha -= 0.03;
        if (particle.alpha <= 0) return false;

        const trailGradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, 8);
        trailGradient.addColorStop(0, `rgba(96, 165, 250, ${particle.alpha * 0.8})`);
        trailGradient.addColorStop(1, `rgba(59, 130, 246, 0)`);
        ctx.fillStyle = trailGradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 6, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });

      // Efeito de squeeze durante movimento
      const squeezeX = playerPosRef.current.progress < 1
        ? 1 + Math.sin(playerPosRef.current.progress * Math.PI) * 0.1
        : 1;
      const squeezeY = playerPosRef.current.progress < 1
        ? 1 - Math.sin(playerPosRef.current.progress * Math.PI) * 0.1
        : 1;

      // Efeito de bounce ao chegar
      const scale = playerPosRef.current.progress > 0.7
        ? bounceProgress
        : 1;

      // Desenhar o panda com a animação apropriada
      if (imagesLoaded) {
        let currentImage = pandaImages.current.idle;

        // Selecionar a imagem baseada na direção atual ou última direção
        if (playerPosRef.current.direction === 'top') {
          currentImage = pandaImages.current.north;
        } else if (playerPosRef.current.direction === 'bottom') {
          currentImage = pandaImages.current.south;
        } else if (playerPosRef.current.direction === 'right') {
          currentImage = pandaImages.current.east;
        } else if (playerPosRef.current.direction === 'left') {
          currentImage = pandaImages.current.west;
        }

        if (currentImage) {
          ctx.save();
          ctx.translate(playerX, playerY);
          ctx.scale(squeezeX * scale, squeezeY * scale);

          // Adicionar sombra durante movimento
          if (playerPosRef.current.progress < 1) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          }

          // Desenhar a imagem do panda centralizada
          const pandaSize = CELL_SIZE * 0.9;
          ctx.drawImage(
            currentImage,
            -pandaSize / 2,
            -pandaSize / 2,
            pandaSize,
            pandaSize
          );

          ctx.restore();
          ctx.shadowBlur = 0;
        }
      } else {
        // Fallback: desenhar bola enquanto as imagens carregam
        ctx.save();
        ctx.translate(playerX, playerY);
        ctx.scale(squeezeX * scale, squeezeY * scale);

        const playerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 14);
        playerGradient.addColorStop(0, '#60a5fa');
        playerGradient.addColorStop(0.7, '#3b82f6');
        playerGradient.addColorStop(1, '#2563eb');

        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(59, 130, 246, 0.6)';
        ctx.fillStyle = playerGradient;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        ctx.shadowBlur = 0;
      }

      if (won) {
        const alpha = Math.min(1, (Date.now() % 2000) / 1000);
        ctx.fillStyle = `rgba(34, 197, 94, ${0.15 * alpha})`;
        ctx.fillRect(0, 0, width, height);

        // Animar e desenhar confetes
        confettiRef.current = confettiRef.current.filter((confetti) => {
          confetti.y += confetti.vy;
          confetti.x += confetti.vx;
          confetti.vy += 0.2; // gravidade
          confetti.rotation += confetti.rotationSpeed;

          if (confetti.y > height + 20) return false;

          ctx.save();
          ctx.translate(confetti.x, confetti.y);
          ctx.rotate(confetti.rotation);
          ctx.fillStyle = confetti.color;
          ctx.fillRect(-confetti.size / 2, -confetti.size / 2, confetti.size, confetti.size);
          ctx.restore();

          return true;
        });

        // Animação de explosão de estrelas ao redor do jogador
        const starCount = 8;
        const starRadius = 25 + Math.sin(Date.now() / 200) * 5;
        for (let i = 0; i < starCount; i++) {
          const angle = (i / starCount) * Math.PI * 2 + Date.now() / 1000;
          const sx = playerX + Math.cos(angle) * starRadius;
          const sy = playerY + Math.sin(angle) * starRadius;

          ctx.fillStyle = `rgba(255, 215, 0, ${0.6 + Math.sin(Date.now() / 100 + i) * 0.4})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [maze, player, won, goal, imagesLoaded]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // Remove getRandomDifficulty from render flow
  // Use this helper inside event handlers only
  const getRandomDifficulty = (): Difficulty => {
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
    return difficulties[Math.floor(Math.random() * difficulties.length)];
  };

  const startGame = (mode: GameMode, diff?: Difficulty) => {
    setGameMode(mode);
    if (diff) setDifficulty(diff);
    if (mode === 'race') {
      setTimer(RACE_TIME_LIMIT);
      setMazesCompleted(0);
    } else if (mode === 'infinite') {
      setTimer(0);
      setMazesCompleted(0);
      // Definir dificuldade aleatória inicial para modo infinito
      const randomDiff = (() => {
        const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
        return difficulties[Math.floor(Math.random() * difficulties.length)];
      })();
      setInfiniteDifficulty(randomDiff);
    } else {
      setTimer(0);
    }
    setWon(false);
    setMoves(0);
    handleReset(false);
  };

  // Menu Principal
  if (gameMode === 'menu') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 py-12 px-4">
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🧩 Labirinto 2D
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Escolha seu modo de jogo e teste suas habilidades!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 w-full max-w-6xl animate-scale-in">
          {/* Modo Padrão */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200 hover:border-blue-400 transition-all duration-300 hover:shadow-2xl hover:scale-105">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Modo Padrão</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Escolha a dificuldade e tente fazer o melhor tempo possível!
            </p>
            <div className="space-y-3">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => startGame('standard', diff)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:scale-105 shadow-md"
                >
                  {DIFFICULTY_CONFIG[diff].label} - {DIFFICULTY_CONFIG[diff].cols}x{DIFFICULTY_CONFIG[diff].rows}
                </button>
              ))}
            </div>
          </div>

          {/* Modo Corrida */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200 hover:border-purple-400 transition-all duration-300 hover:shadow-2xl hover:scale-105">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Modo Corrida</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Complete o máximo de labirintos em 5 minutos! A dificuldade aumenta a cada 2 labirintos.
            </p>
            <div className="bg-purple-50 rounded-lg p-4 mb-6 border border-purple-200">
              <div className="flex items-center gap-2 text-sm text-purple-700 mb-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Progressão:</span>
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• 0-1 labirintos: Fácil</li>
                <li>• 2-3 labirintos: Médio</li>
                <li>• 4+ labirintos: Difícil</li>
              </ul>
            </div>
            <button
              onClick={() => startGame('race')}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-bold text-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-md"
            >
              Iniciar Corrida 🏁
            </button>
          </div>

          {/* Modo Infinito */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200 hover:border-green-400 transition-all duration-300 hover:shadow-2xl hover:scale-105">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Modo Infinito</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Continue jogando labirintos infinitamente! Cada labirinto tem uma dificuldade aleatória.
            </p>
            <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
              <div className="flex items-center gap-2 text-sm text-green-700 mb-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Características:</span>
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Sem limite de tempo</li>
                <li>• Dificuldade aleatória</li>
                <li>• Progressão automática</li>
              </ul>
            </div>
            <button
              onClick={() => startGame('infinite')}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 hover:scale-105 shadow-md"
            >
              Iniciar Infinito ♾️
            </button>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 animate-fade-in-delay mt-4">
          <p>
            Use <kbd className="px-2 py-1 text-xs font-semibold bg-gray-100 border border-gray-300 rounded">WASD</kbd> ou{' '}
            <kbd className="px-2 py-1 text-xs font-semibold bg-gray-100 border border-gray-300 rounded">↑↓←→</kbd> para jogar
          </p>
        </div>
      </div>
    );
  }

  // Interface do Jogo
  const { cols, rows } = getCurrentMazeSize();
  const currentDiff = getCurrentDifficulty();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 py-12 px-4">
      <div className="text-center space-y-2 animate-fade-in">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {gameMode === 'race' ? '🏁 Modo Corrida' : gameMode === 'infinite' ? '♾️ Modo Infinito' : '🎯 Modo Padrão'}
        </h1>
        <p className="text-sm text-gray-600">
          Dificuldade: <span className="font-bold text-purple-600">{DIFFICULTY_CONFIG[currentDiff].label}</span>
          {(gameMode === 'race' || gameMode === 'infinite') && (
            <span className="ml-3">
              Labirintos: <span className="font-bold text-blue-600">{mazesCompleted}</span>
            </span>
          )}
        </p>
      </div>

      <div className="relative animate-scale-in flex justify-center">
        <canvas
          key={`canvas-${cols}-${rows}-${gameMode}`}
          ref={canvasRef}
          width={cols * CELL_SIZE}
          height={rows * CELL_SIZE}
          className="rounded-xl border-2 border-gray-300 bg-white shadow-2xl transition-all duration-300 hover:shadow-blue-200 h-auto"
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
        <div className="flex items-center gap-6 text-sm flex-wrap justify-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md border border-gray-200">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-600">Tempo:</span>
            <span className={`font-mono font-bold text-lg ${gameMode === 'race' && timer < 30000 ? 'text-red-600 animate-pulse' : 'text-purple-600'}`}>
              {formatTime(timer)}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md border border-gray-200">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-gray-600">Movimentos:</span>
            <span className="font-bold text-blue-600 text-lg">{moves}</span>
          </div>
          {won && gameMode === 'standard' && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-400 to-green-600 rounded-lg shadow-lg animate-bounce-in">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-semibold text-white">🎉 Você venceu!</span>
              </div>
              <div className="text-xs text-gray-600 animate-fade-in-delay">
                Tempo: <span className="font-mono font-bold text-purple-600">{formatTime(timer)}</span> • {moves} movimentos
              </div>
            </div>
          )}
          {won && gameMode === 'race' && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg shadow-lg animate-bounce-in">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold text-white">⏱️ Tempo Esgotado!</span>
              </div>
              <div className="text-xs text-gray-600 animate-fade-in-delay">
                Labirintos completados: <span className="font-bold text-blue-600">{mazesCompleted}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleReset(true)}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200 shadow-md"
          >
            ← Menu
          </button>
          <button
            onClick={() => handleReset(false)}
            disabled={isGenerating}
            className="group relative px-6 py-3 font-medium text-white transition-all duration-200 rounded-lg overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
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
              {isGenerating ? 'Gerando...' : 'Reiniciar'}
            </span>
          </button>
        </div>
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
