import type { ReactNode } from 'react';
import { DIFFICULTY_CONFIG } from '../constants';
import { formatTime } from '../format';
import type { Difficulty, GameMode } from '../types';

type GameHudProps = {
  isDark: boolean;
  gameMode: GameMode;
  currentDiff: Difficulty;
  mazesCompleted: number;
  timer: number;
  moves: number;
  won: boolean;
  isGenerating: boolean;
  onToggleTheme: () => void;
  onBackToMenu: () => void;
  onReset: () => void;
  children: ReactNode;
};

export const GameHud = ({
  isDark,
  gameMode,
  currentDiff,
  mazesCompleted,
  timer,
  moves,
  won,
  isGenerating,
  onToggleTheme,
  onBackToMenu,
  onReset,
  children,
}: GameHudProps) => {
  return (
    <div className={`relative flex min-h-screen flex-col items-center justify-center gap-6 py-12 px-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      <button
        onClick={onToggleTheme}
        className={`absolute right-4 top-4 rounded-full px-4 py-2 text-sm font-semibold shadow-lg transition-colors ${isDark
          ? 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-600'
          : 'bg-white text-slate-800 hover:bg-slate-100 border border-slate-200'
          }`}
      >
        {isDark ? '☀️ Modo claro' : '🌙 Modo escuro'}
      </button>

      <div className="text-center space-y-2 animate-fade-in">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {gameMode === 'race' ? '🏁 Modo Corrida' : gameMode === 'infinite' ? '♾️ Modo Infinito' : '🎯 Modo Padrão'}
        </h1>
        <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
          Dificuldade: <span className="font-bold text-purple-600">{DIFFICULTY_CONFIG[currentDiff].label}</span>
          {(gameMode === 'race' || gameMode === 'infinite') && (
            <span className="ml-3">
              Labirintos: <span className="font-bold text-blue-600">{mazesCompleted}</span>
            </span>
          )}
        </p>
      </div>

      {children}

      <div className="flex flex-col items-center gap-4 animate-slide-up">
        <div className="flex items-center gap-6 text-sm flex-wrap justify-center">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-md border ${isDark ? 'bg-slate-900/90 border-slate-700' : 'bg-white border-gray-200'}`}>
            <svg className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Tempo:</span>
            <span className={`font-mono font-bold text-lg ${gameMode === 'race' && timer < 30000 ? 'text-red-600 animate-pulse' : 'text-purple-600'}`}>
              {formatTime(timer)}
            </span>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-md border ${isDark ? 'bg-slate-900/90 border-slate-700' : 'bg-white border-gray-200'}`}>
            <svg className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className={isDark ? 'text-slate-300' : 'text-gray-600'}>Movimentos:</span>
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
              <div className={`text-xs animate-fade-in-delay ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
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
              <div className={`text-xs animate-fade-in-delay ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                Labirintos completados: <span className="font-bold text-blue-600">{mazesCompleted}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBackToMenu}
            className={`px-6 py-3 text-white rounded-lg font-medium transition-all duration-200 shadow-md ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-500 hover:bg-gray-600'}`}
          >
            ← Menu
          </button>
          <button
            onClick={onReset}
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

      <div className={`mt-4 text-center text-xs animate-fade-in-delay ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
        <p>
          Alcance o{' '}
          <span className="inline-flex items-center justify-center w-3 h-3 bg-green-500 rounded-full"></span> círculo
          verde para vencer
        </p>
      </div>
    </div>
  );
};
