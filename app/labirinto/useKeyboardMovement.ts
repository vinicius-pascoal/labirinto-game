import { useCallback, useEffect, useRef } from 'react';
import type { Direction } from './types';

type UseKeyboardMovementParams = {
  won: boolean;
  onMove: (dir: Direction, isFastMove: boolean) => void;
};

export const useKeyboardMovement = ({ won, onMove }: UseKeyboardMovementParams) => {
  const keysPressedRef = useRef<Set<string>>(new Set());
  const moveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onMoveRef = useRef(onMove);

  useEffect(() => {
    onMoveRef.current = onMove;
  }, [onMove]);

  const clearScheduledMove = useCallback(() => {
    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current);
      moveTimeoutRef.current = undefined;
    }
  }, []);

  const resetKeyboardInput = useCallback(() => {
    clearScheduledMove();
    keysPressedRef.current.clear();
  }, [clearScheduledMove]);

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

    const pressedKeys = keysPressedRef.current;

    const onKeyDown = (event: KeyboardEvent) => {
      const dir = keyMap[event.key];
      if (!dir || won) return;

      event.preventDefault();

      if (pressedKeys.has(event.key)) return;

      pressedKeys.add(event.key);
      onMoveRef.current(dir, false);

      clearScheduledMove();

      moveTimeoutRef.current = setTimeout(() => {
        const continuousMove = () => {
          if (pressedKeys.has(event.key) && !won) {
            onMoveRef.current(dir, true);
            moveTimeoutRef.current = setTimeout(continuousMove, 80);
          }
        };

        continuousMove();
      }, 250);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      pressedKeys.delete(event.key);
      clearScheduledMove();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      clearScheduledMove();
      pressedKeys.clear();
    };
  }, [won, clearScheduledMove]);

  return {
    keysPressedRef,
    resetKeyboardInput,
  };
};
