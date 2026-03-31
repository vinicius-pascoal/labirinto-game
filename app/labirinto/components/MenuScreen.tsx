import { DIFFICULTY_CONFIG } from '../constants';
import type { Difficulty, GameMode } from '../types';

type MenuScreenProps = {
  isDark: boolean;
  onToggleTheme: () => void;
  onStartGame: (mode: GameMode, diff?: Difficulty) => void;
};

export const MenuScreen = ({ isDark, onToggleTheme, onStartGame }: MenuScreenProps) => {
  return (
    <div className={`relative flex min-h-screen flex-col items-center justify-center gap-8 py-12 px-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      <button
        onClick={onToggleTheme}
        className={`absolute right-4 top-4 rounded-full px-4 py-2 text-sm font-semibold shadow-lg transition-colors ${isDark
          ? 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-600'
          : 'bg-white text-slate-800 hover:bg-slate-100 border border-slate-200'
          }`}
      >
        {isDark ? '☀️ Modo claro' : '🌙 Modo escuro'}
      </button>

      <div className="text-center space-y-4 animate-fade-in">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🧩 Labirinto 2D
        </h1>
        <p className={`text-lg max-w-md mx-auto ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
          Escolha seu modo de jogo e teste suas habilidades!
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 w-full max-w-6xl animate-scale-in">
        <div className={`rounded-2xl shadow-xl p-8 border-2 transition-all duration-300 hover:shadow-2xl hover:scale-105 ${isDark ? 'bg-slate-900/90 border-slate-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-400'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>Modo Padrão</h2>
          </div>
          <p className={`mb-6 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
            Escolha a dificuldade e tente fazer o melhor tempo possível!
          </p>
          <div className="space-y-3">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
              <button
                key={diff}
                onClick={() => onStartGame('standard', diff)}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:scale-105 shadow-md"
              >
                {DIFFICULTY_CONFIG[diff].label} - {DIFFICULTY_CONFIG[diff].cols}x{DIFFICULTY_CONFIG[diff].rows}
              </button>
            ))}
          </div>
        </div>

        <div className={`rounded-2xl shadow-xl p-8 border-2 transition-all duration-300 hover:shadow-2xl hover:scale-105 ${isDark ? 'bg-slate-900/90 border-slate-700 hover:border-purple-500' : 'bg-white border-gray-200 hover:border-purple-400'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>Modo Corrida</h2>
          </div>
          <p className={`mb-4 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
            Complete o máximo de labirintos em 5 minutos! A dificuldade aumenta a cada 2 labirintos.
          </p>
          <div className={`rounded-lg p-4 mb-6 border ${isDark ? 'bg-purple-950/35 border-purple-800' : 'bg-purple-50 border-purple-200'}`}>
            <div className="flex items-center gap-2 text-sm text-purple-700 mb-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Progressão:</span>
            </div>
            <ul className={`text-sm space-y-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              <li>• 0-1 labirintos: Fácil</li>
              <li>• 2-3 labirintos: Médio</li>
              <li>• 4+ labirintos: Difícil</li>
            </ul>
          </div>
          <button
            onClick={() => onStartGame('race')}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-bold text-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-md"
          >
            Iniciar Corrida 🏁
          </button>
        </div>

        <div className={`rounded-2xl shadow-xl p-8 border-2 transition-all duration-300 hover:shadow-2xl hover:scale-105 ${isDark ? 'bg-slate-900/90 border-slate-700 hover:border-green-500' : 'bg-white border-gray-200 hover:border-green-400'}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>Modo Infinito</h2>
          </div>
          <p className={`mb-4 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
            Continue jogando labirintos infinitamente! Cada labirinto tem uma dificuldade aleatória.
          </p>
          <div className={`rounded-lg p-4 mb-6 border ${isDark ? 'bg-green-950/35 border-green-800' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-2 text-sm text-green-700 mb-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Características:</span>
            </div>
            <ul className={`text-sm space-y-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              <li>• Sem limite de tempo</li>
              <li>• Dificuldade aleatória</li>
              <li>• Progressão automática</li>
            </ul>
          </div>
          <button
            onClick={() => onStartGame('infinite')}
            className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 hover:scale-105 shadow-md"
          >
            Iniciar Infinito ♾️
          </button>
        </div>
      </div>

      <div className={`text-center text-sm animate-fade-in-delay mt-4 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
        <p>
          Use <kbd className={`px-2 py-1 text-xs font-semibold rounded ${isDark ? 'bg-slate-800 border border-slate-600 text-slate-100' : 'bg-gray-100 border border-gray-300'}`}>WASD</kbd> ou{' '}
          <kbd className={`px-2 py-1 text-xs font-semibold rounded ${isDark ? 'bg-slate-800 border border-slate-600 text-slate-100' : 'bg-gray-100 border border-gray-300'}`}>↑↓←→</kbd> para jogar
        </p>
      </div>
    </div>
  );
};
