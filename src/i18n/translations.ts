export type Locale = "en" | "fr";

export type TranslationKeys = {
  // Title screen
  tagline: string;
  pressEnter: string;

  // Language selection
  selectLanguage: string;

  // Config screen
  gameConfiguration: string;
  players: string;
  player: string;
  name: string;
  type: string;
  level: string;
  human: string;
  bot: string;
  extraRules: string;
  startGame: string;
  footerEditName: string;
  footerNav: string;

  // Turn info
  turn: string;
  pickDomino: string;
  placeDomino: string;
  pass: string;
  botThinking: string;
  score: string;

  // Status bar
  shortcutsPick: string;
  shortcutsPlace: string;
  shortcutsIdle: string;
  dominoPlaced: string;
  dominoDiscarded: string;

  // Results
  gameOver: string;
  largestProperty: string;
  crowns: string;
  playAgain: string;
  quit: string;
  pts: string;

  // Terrain legend
  terrainCastle: string;
  terrainWheat: string;
  terrainForest: string;
  terrainSea: string;
  terrainPlain: string;
  terrainSwamp: string;
  terrainMine: string;

  // Draft columns
  previousTurn: string;
  currentTurn: string;

  // Errors
  canStillPlace: string;
};

const en: TranslationKeys = {
  tagline: "Build your kingdom, one domino at a time",
  pressEnter: "Press ENTER to start",
  selectLanguage: "Select language / Choisir la langue",
  gameConfiguration: "Game Configuration",
  players: "Players",
  player: "Player",
  name: "Name",
  type: "Type",
  level: "Level",
  human: "Human",
  bot: "Bot",
  extraRules: "Extra Rules",
  startGame: "Start Game",
  footerEditName: "Type to edit name  │  Enter: confirm  │  Esc: cancel  │  Ctrl+C: quit",
  footerNav:
    "Tab: next field  │  ◀▶: change value  │  Space: toggle rule  │  Enter: confirm  │  Ctrl+C: quit",
  turn: "Turn",
  pickDomino: "Pick domino",
  placeDomino: "Place domino",
  pass: "Pass",
  botThinking: "Bot thinking...",
  score: "Score",
  shortcutsPick: "↑↓ Navigate  ⏎ Pick  Tab View kingdoms",
  shortcutsPlace: "←↑↓→ Move  R Rotate  ⏎ Place  D Discard  Tab View",
  shortcutsIdle: "⏎ Continue",
  dominoPlaced: "Domino placed!",
  dominoDiscarded: "Domino discarded",
  gameOver: "G A M E   O V E R",
  largestProperty: "Largest property",
  crowns: "Crowns",
  playAgain: "Enter → Play Again",
  quit: "Q → Quit",
  pts: "pts",
  terrainCastle: "Castle",
  terrainWheat: "Wheat",
  terrainForest: "Forest",
  terrainSea: "Sea",
  terrainPlain: "Plain",
  terrainSwamp: "Swamp",
  terrainMine: "Mine",
  previousTurn: "Previous",
  currentTurn: "Current",
  canStillPlace: "You can still place this domino",
};

const fr: TranslationKeys = {
  tagline: "Construisez votre royaume, un domino à la fois",
  pressEnter: "Appuyez sur ENTRÉE pour commencer",
  selectLanguage: "Select language / Choisir la langue",
  gameConfiguration: "Configuration de la partie",
  players: "Joueurs",
  player: "Joueur",
  name: "Nom",
  type: "Type",
  level: "Niveau",
  human: "Humain",
  bot: "Bot",
  extraRules: "Règles supplémentaires",
  startGame: "Lancer la partie",
  footerEditName: "Tapez pour modifier  │  Entrée: valider  │  Esc: annuler  │  Ctrl+C: quitter",
  footerNav:
    "Tab: champ suivant  │  ◀▶: modifier  │  Espace: cocher  │  Entrée: valider  │  Ctrl+C: quitter",
  turn: "Tour",
  pickDomino: "Choisir un domino",
  placeDomino: "Placer le domino",
  pass: "Passer",
  botThinking: "Le bot réfléchit...",
  score: "Score",
  shortcutsPick: "↑↓ Naviguer  ⏎ Choisir  Tab Voir royaumes",
  shortcutsPlace: "←↑↓→ Déplacer  R Tourner  ⏎ Poser  D Défausser  Tab Voir",
  shortcutsIdle: "⏎ Continuer",
  dominoPlaced: "Domino posé !",
  dominoDiscarded: "Domino défaussé",
  gameOver: "F I N   D E   P A R T I E",
  largestProperty: "Plus grand domaine",
  crowns: "Couronnes",
  playAgain: "Entrée → Rejouer",
  quit: "Q → Quitter",
  pts: "pts",
  terrainCastle: "Château",
  terrainWheat: "Blé",
  terrainForest: "Forêt",
  terrainSea: "Mer",
  terrainPlain: "Prairie",
  terrainSwamp: "Marais",
  terrainMine: "Mine",
  previousTurn: "Précédent",
  currentTurn: "Actuel",
  canStillPlace: "Vous pouvez encore placer ce domino",
};

const translations: Record<Locale, TranslationKeys> = { en, fr };

export function getTranslations(locale: Locale): TranslationKeys {
  return translations[locale];
}

export type TranslateFn = (key: keyof TranslationKeys) => string;

export function createTranslate(locale: Locale): TranslateFn {
  const t = translations[locale];
  return (key: keyof TranslationKeys) => t[key];
}
