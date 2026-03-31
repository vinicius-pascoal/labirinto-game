import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { deltas, DIFFICULTY_CONFIG, RACE_TIME_LIMIT } from './constants';
import { canMoveInMaze, generateMaze, getRandomDifficulty } from './maze';
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
} from './types';

type UseLabirintoGameParams = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onBeforeResetRef: RefObject<() => void>;
};

export const useLabirintoGame = ({ canvasRef, onBeforeResetRef }: UseLabirintoGameParams) => {
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
  const [imagesLoaded, setImagesLoaded] = useState(false);

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
  const pandaImagesRef = useRef<PandaImages>({
    idle: null,
    north: null,
    south: null,
    east: null,
    west: null,
  });

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
            pandaImagesRef.current[key as keyof PandaImages] = img;
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

  const currentDiff = useMemo<Difficulty>(() => {
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
  }, [gameMode, mazesCompleted, infiniteDifficulty, difficulty]);

  const currentMazeSize = useMemo(() => {
    return DIFFICULTY_CONFIG[currentDiff];
  }, [currentDiff]);

  const goal = useMemo<Position>(() => {
    if (!maze.length) return { x: 0, y: 0 };
    const cols = maze[0].length;
    const rows = maze.length;
    return { x: cols - 1, y: rows - 1 };
  }, [maze]);

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
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
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

    if (gameMode === 'infinite' && !backToMenu) {
      setInfiniteDifficulty(getRandomDifficulty());
    }

    setIsRunning(false);
    confettiRef.current = [];
    onBeforeResetRef.current();

    await new Promise((resolve) => setTimeout(resolve, 100));

    const newMaze = generateMaze(currentMazeSize.cols, currentMazeSize.rows);
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
          handleReset(false);
        }, 500);
      } else {
        setWon(true);
        setIsRunning(false);
        createConfetti();
      }
    }
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
      setInfiniteDifficulty(getRandomDifficulty());
    } else {
      setTimer(0);
    }

    setWon(false);
    setMoves(0);
    handleReset(false);
  };

  return {
    gameMode,
    mazesCompleted,
    maze,
    won,
    moves,
    isGenerating,
    timer,
    imagesLoaded,
    currentDiff,
    currentMazeSize,
    goal,
    confettiRef,
    playerPosRef,
    trailRef,
    pandaImagesRef,
    handleMove,
    handleReset,
    startGame,
  };
};
