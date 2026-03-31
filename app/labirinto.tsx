'use client';

import { useEffect, useRef } from 'react';
import { CELL_SIZE } from './labirinto/constants';
import { useTheme } from './labirinto/useTheme';
import { useKeyboardMovement } from './labirinto/useKeyboardMovement';
import { useMazeCanvasRenderer } from './labirinto/useMazeCanvasRenderer';
import { useLabirintoGame } from './labirinto/useLabirintoGame';
import { GameHud } from './labirinto/components/GameHud';
import { MenuScreen } from './labirinto/components/MenuScreen';

const Labirinto = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const resetKeyboardInputRef = useRef<() => void>(() => undefined);

  const { isDark, toggleTheme } = useTheme();
  const {
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
  } = useLabirintoGame({
    canvasRef,
    onBeforeResetRef: resetKeyboardInputRef,
  });

  const { keysPressedRef, resetKeyboardInput } = useKeyboardMovement({
    won,
    onMove: handleMove,
  });

  useEffect(() => {
    resetKeyboardInputRef.current = resetKeyboardInput;
  }, [resetKeyboardInput]);

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
    pandaImagesRef,
    confettiRef,
  });

  // Menu Principal
  if (gameMode === 'menu') {
    return <MenuScreen isDark={isDark} onToggleTheme={toggleTheme} onStartGame={startGame} />;
  }

  // Interface do Jogo
  const { cols, rows } = currentMazeSize;

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
