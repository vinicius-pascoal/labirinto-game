'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CELL_SIZE, deltas, DIFFICULTY_CONFIG, RACE_TIME_LIMIT } from './labirinto/constants';
import { canMoveInMaze, generateMaze, getRandomDifficulty } from './labirinto/maze';
import { useTheme } from './labirinto/useTheme';
import { useKeyboardMovement } from './labirinto/useKeyboardMovement';
import { useMazeCanvasRenderer } from './labirinto/useMazeCanvasRenderer';
import { GameHud } from './labirinto/components/GameHud';
import { MenuScreen } from './labirinto/components/MenuScreen';
import type {
  ConfettiParticle,
  Difficulty,
  Direction,
  GameMode,
  MazeCell,
  PandaImages,
  PlayerAnimationState,
  Position,
  TrailParticle,
} from './labirinto/types';

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
  const confettiRef = useRef<ConfettiParticle[]>([]);
  const playerPosRef = useRef<PlayerAnimationState>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    progress: 1,
    direction: null,
  });
  const trailRef = useRef<TrailParticle[]>([]);

  // Refs para as imagens do panda
  const pandaImages = useRef<PandaImages>({
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
    resetKeyboardInput();

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

  const { keysPressedRef, resetKeyboardInput } = useKeyboardMovement({
    won,
    onMove: handleMove,
  });

  useMazeCanvasRenderer({
    canvasRef,
    maze,
    goal,
    isDark,
    won,
    imagesLoaded,
    keysPressedRef,
    playerPosRef,
    trailRef,
    pandaImagesRef: pandaImages,
    confettiRef,
  });

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
