# Labirinto 2D – Jogo Web (Next.js)

Jogo simples em Canvas onde o jogador percorre um labirinto gerado aleatoriamente até alcançar a saída. Serve como vitrine de lógica de jogo, geração procedural e integração com Next.js (App Router).

## Stack
- Next.js 14 (App Router) + React + TypeScript
- HTML5 Canvas (renderização 2D)
- Tailwind (estilos básicos gerados pelo template)

## Jogabilidade
- Controles: WASD ou setas
- Objetivo: sair do canto superior esquerdo para o canto inferior direito
- Botão "Novo labirinto" para regenerar o mapa

## Como rodar localmente
```bash
npm install
npm run dev
# acesse http://localhost:3000
```

## Estrutura principal
```
app/
  page.tsx         # Entrada da aplicação exibindo o jogo
  labirinto.tsx    # Lógica do labirinto, desenho e controles
  globals.css
public/
  favicon.ico      # Ícone com mini labirinto
```

## Detalhes do labirinto
- Algoritmo: backtracking (DFS) para gerar labirinto perfeito (sempre um caminho possível)
- Colisões: checagem de paredes por célula
- Estados: posição do jogador, vitória, regeneração

## Próximos passos sugeridos
- Animação da geração em tempo real
- Timer/contador de passos
- Níveis com tamanhos crescentes ou seed configurável
- Suporte mobile por toques ou botões na tela
