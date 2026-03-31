'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CELL_SIZE, deltas, DIFFICULTY_CONFIG, RACE_TIME_LIMIT } from './labirinto/constants';
import { canMoveInMaze, generateMaze, getRandomDifficulty } from './labirinto/maze';
import { useTheme } from './labirinto/useTheme';
import { GameHud } from './labirinto/components/GameHud';
import { MenuScreen } from './labirinto/components/MenuScreen';
import type { Difficulty, Direction, GameMode, MazeCell, Position } from './labirinto/types';

const Labirinto = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isDark, toggleTheme } = useTheme();
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
      setInfiniteDifficulty(getRandomDifficulty());
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
    if (!canMoveInMaze(maze, player, dir)) return;

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
      gradient.addColorStop(0, isDark ? '#0f172a' : '#f8fafc');
      gradient.addColorStop(1, isDark ? '#1e293b' : '#e2e8f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      for (const row of maze) {
        for (const cell of row) {
          const x = cell.x * CELL_SIZE;
          const y = cell.y * CELL_SIZE;

          ctx.strokeStyle = isDark ? '#cbd5e1' : '#1e293b';

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
        trailGradient.addColorStop(0, `rgba(125, 211, 252, ${particle.alpha * 0.8})`);
        trailGradient.addColorStop(1, `rgba(14, 165, 233, 0)`);
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
  }, [maze, player, won, goal, imagesLoaded, isDark]);

  const startGame = (mode: GameMode, diff?: Difficulty) => {
    setGameMode(mode);
    if (diff) setDifficulty(diff);
    if (mode === 'race') {
      setTimer(RACE_TIME_LIMIT);
      setMazesCompleted(0);
    } else if (mode === 'infinite') {
      setTimer(0);
      setMazesCompleted(0);
      setInfiniteDifficulty(getRandomDifficulty());
    } else {
      setTimer(0);
    }
    setWon(false);
    setMoves(0);
    handleReset(false);
  };

  // Menu Principal
  if (gameMode === 'menu') {
    return <MenuScreen isDark={isDark} onToggleTheme={toggleTheme} onStartGame={startGame} />;
  }

  // Interface do Jogo
  const { cols, rows } = getCurrentMazeSize();
  const currentDiff = getCurrentDifficulty();

  return (
    <GameHud
      isDark={isDark}
      gameMode={gameMode}
      currentDiff={currentDiff}
      mazesCompleted={mazesCompleted}
      timer={timer}
      moves={moves}
      won={won}
      isGenerating={isGenerating}
      onToggleTheme={toggleTheme}
      onBackToMenu={() => handleReset(true)}
      onReset={() => handleReset(false)}
    >
      <div className="relative animate-scale-in flex justify-center">
        <canvas
          key={`canvas-${cols}-${rows}-${gameMode}`}
          ref={canvasRef}
          width={cols * CELL_SIZE}
          height={rows * CELL_SIZE}
          className={`rounded-xl border-2 shadow-2xl transition-all duration-300 h-auto ${isDark ? 'border-slate-600 bg-slate-900 hover:shadow-slate-800/60' : 'border-gray-300 bg-white hover:shadow-blue-200'}`}
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
    </GameHud>
  );
};

export default Labirinto;
