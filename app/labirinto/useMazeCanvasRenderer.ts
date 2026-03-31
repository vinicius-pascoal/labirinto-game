import { useEffect, type RefObject } from 'react';
import { CELL_SIZE } from './constants';
import type {
  ConfettiParticle,
  MazeCell,
  PandaImages,
  PlayerAnimationState,
  Position,
  TrailParticle,
} from './types';

type UseMazeCanvasRendererParams = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  maze: MazeCell[][];
  goal: Position;
  isDark: boolean;
  won: boolean;
  imagesLoaded: boolean;
  keysPressedRef: RefObject<Set<string>>;
  playerPosRef: RefObject<PlayerAnimationState>;
  trailRef: RefObject<TrailParticle[]>;
  pandaImagesRef: RefObject<PandaImages>;
  confettiRef: RefObject<ConfettiParticle[]>;
};

export const useMazeCanvasRenderer = ({
  canvasRef,
  maze,
  goal,
  isDark,
  won,
  imagesLoaded,
  keysPressedRef,
  playerPosRef,
  trailRef,
  pandaImagesRef,
  confettiRef,
}: UseMazeCanvasRendererParams) => {
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
  }, [canvasRef, maze]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !maze.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cols = maze[0].length;
    const rows = maze.length;
    const width = cols * CELL_SIZE;
    const height = rows * CELL_SIZE;
    let animationFrameId: number | undefined;

    const animate = () => {
      if (playerPosRef.current.progress < 1) {
        const speedMultiplier = keysPressedRef.current.size > 0 ? 0.25 : 0.15;
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

      if (playerPosRef.current.progress < 0.8) {
        trailRef.current.push({ x: playerX, y: playerY, alpha: 0.6 });
        if (trailRef.current.length > 15) trailRef.current.shift();
      }

      trailRef.current = trailRef.current.filter((particle) => {
        particle.alpha -= 0.03;
        if (particle.alpha <= 0) return false;

        const trailGradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, 8);
        trailGradient.addColorStop(0, `rgba(125, 211, 252, ${particle.alpha * 0.8})`);
        trailGradient.addColorStop(1, 'rgba(14, 165, 233, 0)');
        ctx.fillStyle = trailGradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 6, 0, Math.PI * 2);
        ctx.fill();
        return true;
      });

      const squeezeX = playerPosRef.current.progress < 1
        ? 1 + Math.sin(playerPosRef.current.progress * Math.PI) * 0.1
        : 1;
      const squeezeY = playerPosRef.current.progress < 1
        ? 1 - Math.sin(playerPosRef.current.progress * Math.PI) * 0.1
        : 1;

      const scale = playerPosRef.current.progress > 0.7 ? bounceProgress : 1;

      if (imagesLoaded) {
        let currentImage = pandaImagesRef.current.idle;

        if (playerPosRef.current.direction === 'top') {
          currentImage = pandaImagesRef.current.north;
        } else if (playerPosRef.current.direction === 'bottom') {
          currentImage = pandaImagesRef.current.south;
        } else if (playerPosRef.current.direction === 'right') {
          currentImage = pandaImagesRef.current.east;
        } else if (playerPosRef.current.direction === 'left') {
          currentImage = pandaImagesRef.current.west;
        }

        if (currentImage) {
          ctx.save();
          ctx.translate(playerX, playerY);
          ctx.scale(squeezeX * scale, squeezeY * scale);

          if (playerPosRef.current.progress < 1) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          }

          const pandaSize = CELL_SIZE * 0.9;
          ctx.drawImage(currentImage, -pandaSize / 2, -pandaSize / 2, pandaSize, pandaSize);

          ctx.restore();
          ctx.shadowBlur = 0;
        }
      } else {
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

        confettiRef.current = confettiRef.current.filter((confetti) => {
          confetti.y += confetti.vy;
          confetti.x += confetti.vx;
          confetti.vy += 0.2;
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

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [
    canvasRef,
    maze,
    goal,
    isDark,
    won,
    imagesLoaded,
    keysPressedRef,
    playerPosRef,
    trailRef,
    pandaImagesRef,
    confettiRef,
  ]);
};
