# Kingdomino CLI

```
██╗  ██╗██╗███╗   ██╗ ██████╗ ██████╗  ██████╗ ███╗   ███╗██╗███╗   ██╗ ██████╗
██║ ██╔╝██║████╗  ██║██╔════╝ ██╔══██╗██╔═══██╗████╗ ████║██║████╗  ██║██╔═══██╗
█████╔╝ ██║██╔██╗ ██║██║  ███╗██║  ██║██║   ██║██╔████╔██║██║██╔██╗ ██║██║   ██║
██╔═██╗ ██║██║╚██╗██║██║   ██║██║  ██║██║   ██║██║╚██╔╝██║██║██║╚██╗██║██║   ██║
██║  ██╗██║██║ ╚████║╚██████╔╝██████╔╝╚██████╔╝██║ ╚═╝ ██║██║██║ ╚████║╚██████╔╝
╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝
```

> Build your kingdom, one domino at a time.

Un jeu **Kingdomino** complet dans votre terminal ! Jouez seul contre des bots ou entre amis, directement depuis la ligne de commande.

## Fonctionnalites

- **2 a 4 joueurs** — humains et/ou bots
- **4 niveaux de bots** — random, greedy, advanced, expert
- **Rendu riche en Unicode** — terrains emoji (🏰 🌾 🌲 🌊 🌿 🏚 ⛏), couronnes (👑), couleurs
- **Interface interactive** — navigation clavier, curseur de placement, ghost preview
- **Regles extras** — configurables dynamiquement selon le mode et le nombre de joueurs
- **Ecran de resultats** — classement avec medailles 🥇🥈🥉, score anime, mini-royaumes
- **Transitions animees** — overlay entre joueurs, flash de placement, pulsation du titre
- **Replay immediat** — rejouez directement depuis l'ecran de resultats

## Installation

```bash
# Via npx (pas d'installation)
npx @pompidup/kingdomino-cli

# Ou installation globale
npm install -g @pompidup/kingdomino-cli
kingdomino
```

## Utilisation

```bash
kingdomino [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--help`, `-h` | Affiche l'aide |
| `--version`, `-v` | Affiche la version |
| `--debug` | Mode debug (logging verbose du moteur) |

### Controles

| Ecran | Touches | Action |
|-------|---------|--------|
| **Titre** | `Enter` | Demarrer |
| **Config** | `Tab` | Naviguer entre les champs |
| | `↑` `↓` | Changer les valeurs |
| | `Espace` | Activer/desactiver les regles extras |
| | `Enter` | Lancer la partie |
| **Jeu — Pick** | `↑` `↓` | Selectionner un domino |
| | `Enter` | Choisir le domino |
| **Jeu — Place** | `←` `↑` `↓` `→` | Deplacer le curseur |
| | `R` | Rotation (0° → 90° → 180° → 270°) |
| | `Enter` | Placer le domino |
| | `D` | Defausser (si aucun placement valide) |
| | `Tab` | Voir les royaumes des autres joueurs |
| **Resultats** | `Enter` | Rejouer |
| | `Q` | Quitter |
| **Global** | `Ctrl+C` | Quitter |

## Architecture

Le projet suit une **Clean Architecture (Ports & Adapters)** :

```
src/
├── domain/          # Types metier, ports (interfaces)
│   ├── types.ts         # AppState, ScreenName, GameConfig, CursorState
│   └── ports/           # GamePort, BotPort, StatePort, UIPort
├── application/     # Use cases, orchestration
│   ├── state-manager.ts     # Gestion d'etat (dispatch/subscribe)
│   ├── selectors.ts         # Selecteurs purs derives du state
│   ├── game-orchestrator.ts # Setup de partie
│   ├── config-validator.ts  # Validation de config
│   └── error-feedback.ts    # Mapping erreurs → feedback UI
├── infrastructure/  # Adapters concrets
│   ├── engine-adapter.ts    # Wraps @pompidup/kingdomino-engine
│   └── bot-adapter.ts       # Wraps les strategies bot
├── presentation/    # Fonctions de rendu pures → RenderLine[]
│   ├── terrain.ts               # Tuiles, symboles, couleurs
│   ├── kingdom-grid.ts          # Grille 9x9 avec ghost preview
│   ├── draft-column.ts          # Colonne de selection de dominos
│   ├── turn-info.ts             # Barre d'info du tour
│   ├── status-bar.ts            # Raccourcis clavier / erreurs
│   ├── transition-overlay.ts    # Overlay transition joueur
│   ├── results-screen-render.ts # Ecran de resultats
│   └── ...
├── screens/         # Ecrans interactifs (App + key handlers)
│   ├── title-screen.ts
│   ├── config-screen.ts
│   ├── game-screen.ts
│   └── results-screen.ts
├── cli.ts           # Parsing des arguments CLI
└── index.ts         # Point d'entree, wiring DI
```

### Principes cles

- **Result Pattern** — Les adapters retournent `{ ok, value } | { ok, error }`, jamais de throw
- **Immutabilite** — Chaque dispatch produit un nouvel etat
- **Separation UI/logique** — Les composants ne connaissent que leurs props
- **Dependency Injection** — Tous les adapters sont injectes dans les ecrans

## Developpement

### Prerequis

- Node.js >= 18
- pnpm >= 10

### Installation

```bash
pnpm install
```

### Scripts

```bash
pnpm build        # Build avec tsup
pnpm dev          # Build en mode watch
pnpm start        # Lancer le jeu (apres build)
pnpm test         # Tests unitaires et integration (vitest)
pnpm lint         # Type-check (tsc --noEmit)
pnpm lint:check   # ESLint
pnpm format       # Formatter avec Prettier
pnpm format:check # Verifier le formatage
```

### Stack technique

| Outil | Role |
|-------|------|
| [TypeScript](https://www.typescriptlang.org/) | Langage |
| [tsup](https://tsup.egoist.dev/) | Bundler |
| [Vitest](https://vitest.dev/) | Tests |
| [ESLint](https://eslint.org/) | Linting |
| [Prettier](https://prettier.io/) | Formatage |
| [@pompidup/kingdomino-engine](https://www.npmjs.com/package/@pompidup/kingdomino-engine) | Moteur de jeu |
| [@pompidup/cligrid](https://www.npmjs.com/package/@pompidup/cligrid) | Framework TUI |

## Terrains

| Terrain | Emoji | Couleur |
|---------|-------|---------|
| Chateau | 🏰 | Gris |
| Ble | 🌾 | Jaune |
| Foret | 🌲 | Vert fonce |
| Mer | 🌊 | Bleu |
| Prairie | 🌿 | Vert clair |
| Marais | 🏚 | Marron |
| Mine | ⛏ | Gris fonce |

## Licence

MIT - voir [LICENSE](LICENSE)
