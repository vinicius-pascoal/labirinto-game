# Labirinto 2D – Jogo Web (Next.js)

Jogo de labirinto em Canvas com personagem animado (panda em pixel art), geração procedural de labirintos e múltiplos modos de jogo. Desenvolvido com Next.js, React e TypeScript.

## ✨ Features

### 🎮 Modos de Jogo
- **Modo Padrão**: Escolha a dificuldade e tente fazer o melhor tempo
- **Modo Corrida**: Complete o máximo de labirintos em 5 minutos com dificuldade progressiva
- **Modo Infinito**: Jogue labirintos infinitamente com dificuldades aleatórias e sem limite de tempo

### 🐼 Personagem Animado
- Panda em pixel art com animações GIF direcionais
- Animações diferentes para cada direção (norte, sul, leste, oeste)
- Animação idle quando parado
- Efeitos visuais de movimento (squeeze, bounce, trilha de partículas)

### 🎯 Níveis de Dificuldade
- **Fácil**: 11×9 células
- **Médio**: 14×10 células
- **Difícil**: 17×12 células

### 🎨 Visual
- Interface moderna com gradientes e animações
- Efeitos de partículas durante movimento
- Confetes e celebração ao vencer
- Canvas responsivo de alta qualidade

## Stack
- Next.js 15 (App Router)
- React 19 + TypeScript
- HTML5 Canvas (renderização 2D com animações)
- Tailwind CSS (estilos modernos)

## Jogabilidade
- **Controles**: WASD ou setas (↑↓←→)
- **Objetivo**: Navegar do canto superior esquerdo até o círculo verde no canto inferior direito
- **Movimento contínuo**: Segure a tecla para movimento rápido
- **Timer**: Cronômetro automático ao primeiro movimento
- **Contador de movimentos**: Acompanhe sua eficiência

## Como rodar localmente
```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev

# Acesse http://localhost:3000
```

## Estrutura principal
```
app/
  page.tsx         # Página inicial que renderiza o jogo
  labirinto.tsx    # Componente principal com toda a lógica do jogo
  layout.tsx       # Layout da aplicação
  globals.css      # Estilos globais e animações
public/
  panda/          # Animações GIF do personagem panda
    fat_panda_in_8bit_animation_breathing-idle_south.gif
    fat_panda_in_8bit_animation_walk_north.gif
    fat_panda_in_8bit_animation_walk_south.gif
    fat_panda_in_8bit_animation_walk_east.gif
    fat_panda_in_8bit_animation_walk_west.gif
```

## Detalhes técnicos

### Geração do Labirinto
- **Algoritmo**: Backtracking (DFS) para gerar labirinto perfeito
- Garante sempre um caminho possível entre início e fim
- Geração instantânea para todos os tamanhos

### Sistema de Animação
- Interpolação suave entre células usando easing functions
- Efeitos de squeeze e bounce durante movimento
- Trilha de partículas com fade out
- Carregamento assíncrono das imagens GIF

### Modo Corrida
- Timer regressivo de 5 minutos
- Progressão automática de dificuldade:
  - 0-1 labirintos: Fácil
  - 2-3 labirintos: Médio
  - 4+ labirintos: Difícil
- Geração automática do próximo labirinto ao completar

### Modo Infinito
- Sem limite de tempo
- Dificuldade aleatória para cada labirinto (Fácil, Médio ou Difícil)
- Progressão automática infinita
- Cronômetro crescente para acompanhar tempo total jogado
- Contador de labirintos completados

### Performance
- `requestAnimationFrame` para animações fluidas (60 FPS)
- Canvas otimizado com limpeza e redesenho eficiente
- Refs para evitar re-renders desnecessários

## Controles Avançados
- **Movimento contínuo**: Segure qualquer tecla direcional para movimento rápido após 250ms
- **Velocidade adaptativa**: Animação mais rápida durante movimento contínuo
- **Colisões precisas**: Sistema de detecção de paredes por célula

## Créditos
- Animações do personagem: Fat Panda in 8bit (pixel art GIF)
