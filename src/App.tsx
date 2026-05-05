import { useReducer, useEffect, useCallback, useRef, useState, useMemo } from 'react';
import {
  mapLayout, keyboardLayout, worlds, shopItems, dailyMissions, monsters,
  getMonsterById, getRandomContent, calculateStars, calculateDamage, calculateMonsterDamage,
  getTimeLimit, getWaveForRound, getTotalRounds, getLevelById, getPlayerLevel,
  getRandomFreeContent, getFreeContentReward,
  type ContentItem, type Monster, type MapEntity,
  type ShopItem, type DailyMission,
} from './gameData';
import { playKeySound, playErrorSound, playAttackSound, playVictorySound, playDefeatSound, resumeAudio } from './audio';

// ============ Types ============
type GameScreen = 'LOGIN' | 'TITLE' | 'TUTORIAL' | 'WORLD_SELECT' | 'LEVEL_SELECT' | 'MAP' | 'BATTLE_TRANSITION' | 'BATTLE' | 'WAVE_TRANSITION' | 'RESULT' | 'SHOP' | 'MISSIONS' | 'VOCAB' | 'FREE_MODE' | 'FREE_PLAY' | 'FREE_RESULT' | 'REPORT' | 'PAUSED' | 'STATUS' | 'MONSTER_BOOK' | 'FREE_LEADERBOARD';

interface Player {
  level: number; xp: number; hp: number; maxHp: number; coins: number;
  x: number; y: number; vy: number; onGround: boolean; facingRight: boolean;
  damageBoost: number; defenseBoost: number; timeBoost: number; comboBoost: number;
  timeSandBattles: number;
}

interface LevelProgress {
  levelId: string; completed: boolean; stars: number; bestAccuracy: number;
}

interface BattleState {
  monster: Monster; currentRound: number; maxRounds: number; currentWaveIndex: number;
  targetText: string; playerInput: string; timeLeft: number; timeLimit: number;
  combo: number; maxCombo: number; totalErrors: number; roundErrors: number;
  roundResults: { correct: boolean; timeLeft: number; timeLimit: number; errors: number; text: string }[];
  monsterHp: number; playerHp: number;
  battleStatus: 'typing' | 'player_attack' | 'monster_attack' | 'shield_phase' | 'victory' | 'defeat';
  usedTexts: string[]; currentContent: ContentItem | null;
  lastDamage: number; shakeScreen: boolean; showComboPopup: boolean;
  defensePrompt: string; currentLevelId: string;
  isNewWord: boolean;
  didLevelUp?: boolean;
}

interface GameState {
  screen: GameScreen; prevScreen: GameScreen; player: Player; battle: BattleState | null;
  mapEntities: MapEntity[]; defeatedMonsters: string[];
  totalBattles: number; totalCorrect: number; totalInputs: number; totalTimeouts: number;
  wordsLearned: string[]; wordsSeen: string[]; startTime: number;
  showTutorial: boolean; currentStage: number; currentWorldId: string; currentLevelId: string | null;
  weakKeys: Record<string, number>;
  levelProgress: Record<string, LevelProgress>;
  shopInventory: ShopItem[];
  missions: DailyMission[];
  battlesWon: number;
  playerName: string;
  isLoggedIn: boolean;
  currentSaveSlot: number;
  completedLevels: string[];
  freeMode: {
    difficulty: string;
    timeLeft: number;
    timeLimit: number;
    targetText: string;
    playerInput: string;
    correctCount: number;
    totalChars: number;
    wordCount: number;
    currentContent: ContentItem | null;
    isNewWord: boolean;
    combo: number;
    maxCombo: number;
    isRunning: boolean;
    rewardClaimed: boolean;
    recordSaved: boolean;
    rewards: { coins: number; xp: number };
  } | null;
  freeLeaderboard: Array<{
    id: string;
    difficulty: string;
    timeLimit: number;
    correctCount: number;
    totalChars: number;
    maxCombo: number;
    score: number;
    date: string;
  }>;
}

interface Particle { id: number; x: number; y: number; vx: number; vy: number; color: string; size: number; life: number; }

type Action =
  | { type: 'START_GAME' } | { type: 'CLOSE_TUTORIAL' }
  | { type: 'GO_WORLD_SELECT' } | { type: 'SELECT_WORLD'; payload: string }
  | { type: 'GO_MAP' } | { type: 'START_LEVEL'; payload: string }
  | { type: 'MOVE_PLAYER'; payload: { dx: number } } | { type: 'JUMP_PLAYER' }
  | { type: 'UPDATE_PLAYER_PHYSICS' }
  | { type: 'END_TRANSITION' }
  | { type: 'TYPE_CHAR'; payload: string } | { type: 'BACKSPACE' }
  | { type: 'TICK_TIMER' } | { type: 'END_BATTLE_ANIMATION' }
  | { type: 'ACTIVATE_SHIELD' }
  | { type: 'CONTINUE_FROM_RESULT' }
  | { type: 'OPEN_SHOP' } | { type: 'CLOSE_SHOP' }
  | { type: 'BUY_ITEM'; payload: string }
  | { type: 'OPEN_MISSIONS' } | { type: 'CLOSE_MISSIONS' }
  | { type: 'OPEN_VOCAB' } | { type: 'CLOSE_VOCAB' }
  | { type: 'SHOW_REPORT' } | { type: 'RESTART_GAME' }
  | { type: 'GO_BACK' }
  | { type: 'OPEN_FREE_MODE' } | { type: 'CLOSE_FREE_MODE' }
  | { type: 'START_FREE_PLAY'; payload: { difficulty: string; timeLimit: number } }
  | { type: 'FREE_TICK' }
  | { type: 'FREE_TYPE'; payload: string }
  | { type: 'FREE_BACKSPACE' }
  | { type: 'FREE_NEXT_WORD' }
  | { type: 'END_FREE_PLAY' }
  | { type: 'PAUSE_BATTLE' } | { type: 'RESUME_BATTLE' }
  | { type: 'USE_ITEM'; payload: string }
  | { type: 'ESCAPE_BATTLE' }
  | { type: 'OPEN_STATUS' } | { type: 'CLOSE_STATUS' }
  | { type: 'OPEN_MONSTER_BOOK' } | { type: 'CLOSE_MONSTER_BOOK' }
  | { type: 'OPEN_FREE_LEADERBOARD' } | { type: 'CLOSE_FREE_LEADERBOARD' }
  | { type: 'SAVE_FREE_RECORD' }
  | { type: 'LOGIN'; payload: { name: string; slot: number } }
  | { type: 'LOGOUT' }
  | { type: 'LOAD_SAVE'; payload: number }
  | { type: 'DELETE_SAVE'; payload: number }
  | { type: 'SELECT_SLOT'; payload: number };

// ============ Constants ============
const MAP_W = 3600; const GROUND_Y = 400; const GRAVITY = 0.6;
const JUMP_F = -12; const PW = 50; const PH = 70;

function initPlayer(): Player {
  return { level: 1, xp: 0, hp: 100, maxHp: 100, coins: 0, x: 50, y: GROUND_Y - PH, vy: 0, onGround: true, facingRight: true, damageBoost: 0, defenseBoost: 0, timeBoost: 0, comboBoost: 0, timeSandBattles: 0 };
}

function getSaveSlot(slotIndex: number): Partial<GameState> | null {
  try {
    const raw = localStorage.getItem(`typingSave_${slotIndex}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveToSlot(slotIndex: number, state: GameState) {
  const toSave = {
    playerName: state.playerName,
    player: state.player,
    currentWorldId: state.currentWorldId,
    currentLevelId: state.currentLevelId,
    wordsLearned: state.wordsLearned,
    wordsSeen: state.wordsSeen,
    totalBattles: state.totalBattles,
    totalCorrect: state.totalCorrect,
    totalInputs: state.totalInputs,
    totalTimeouts: state.totalTimeouts,
    weakKeys: state.weakKeys,
    levelProgress: state.levelProgress,
    shopInventory: state.shopInventory,
    missions: state.missions,
    battlesWon: state.battlesWon,
    defeatedMonsters: state.defeatedMonsters,
    currentStage: state.currentStage,
    completedLevels: state.completedLevels,
    currentSaveSlot: state.currentSaveSlot,
    freeLeaderboard: state.freeLeaderboard,
    saveDate: new Date().toLocaleDateString('zh-CN'),
    saveTime: Date.now(),
  };
  localStorage.setItem(`typingSave_${slotIndex}`, JSON.stringify(toSave));
}

function deleteSaveSlot(slotIndex: number) {
  localStorage.removeItem(`typingSave_${slotIndex}`);
}

function initState(): GameState {
  const lp: Record<string, LevelProgress> = {};
  worlds.forEach(w => w.levels.forEach(l => { lp[l.id] = { levelId: l.id, completed: false, stars: 0, bestAccuracy: 0 }; }));
  return {
    screen: 'LOGIN', prevScreen: 'LOGIN', player: initPlayer(), battle: null,
    mapEntities: mapLayout.map((e: MapEntity) => ({ ...e })), defeatedMonsters: [],
    totalBattles: 0, totalCorrect: 0, totalInputs: 0, totalTimeouts: 0,
    wordsLearned: [], wordsSeen: [], startTime: 0, showTutorial: true,
    currentStage: 0, currentWorldId: 'world1', currentLevelId: null, weakKeys: {},
    levelProgress: lp, shopInventory: shopItems.map(i => ({ ...i })),
    missions: dailyMissions.map(m => ({ ...m })), battlesWon: 0,
    playerName: '', isLoggedIn: false, currentSaveSlot: 0, completedLevels: [],
    freeMode: null,
    freeLeaderboard: JSON.parse(localStorage.getItem('typingLeaderboard') || '[]'),
  };
}

function loadFromSlot(slotIndex: number): GameState {
  const saved = getSaveSlot(slotIndex);
  const lp: Record<string, LevelProgress> = {};
  worlds.forEach(w => w.levels.forEach(l => { lp[l.id] = { levelId: l.id, completed: false, stars: 0, bestAccuracy: 0 }; }));
  if (!saved) return {
    screen: 'LOGIN', prevScreen: 'LOGIN', player: initPlayer(), battle: null,
    mapEntities: mapLayout.map((e: MapEntity) => ({ ...e })), defeatedMonsters: [],
    totalBattles: 0, totalCorrect: 0, totalInputs: 0, totalTimeouts: 0,
    wordsLearned: [], wordsSeen: [], startTime: 0, showTutorial: true,
    currentStage: 0, currentWorldId: 'world1', currentLevelId: null, weakKeys: {},
    levelProgress: lp, shopInventory: shopItems.map(i => ({ ...i })),
    missions: dailyMissions.map(m => ({ ...m })), battlesWon: 0,
    playerName: '', isLoggedIn: false, currentSaveSlot: slotIndex, completedLevels: [],
    freeMode: null,
    freeLeaderboard: JSON.parse(localStorage.getItem('typingLeaderboard') || '[]'),
  };
  return {
    screen: 'WORLD_SELECT', prevScreen: 'TITLE',
    player: { ...initPlayer(), ...saved.player, timeSandBattles: saved.player?.timeSandBattles ?? 0 },
    battle: null,
    mapEntities: mapLayout.map((e: MapEntity) => ({ ...e })),
    defeatedMonsters: saved.defeatedMonsters || [],
    totalBattles: saved.totalBattles || 0,
    totalCorrect: saved.totalCorrect || 0,
    totalInputs: saved.totalInputs || 0,
    totalTimeouts: saved.totalTimeouts || 0,
    wordsLearned: saved.wordsLearned || [],
    wordsSeen: saved.wordsSeen || [],
    startTime: Date.now(),
    showTutorial: false,
    currentStage: saved.currentStage || 0,
    currentWorldId: saved.currentWorldId || 'world1',
    currentLevelId: saved.currentLevelId || null,
    weakKeys: saved.weakKeys || {},
    levelProgress: saved.levelProgress || lp,
    shopInventory: (saved.shopInventory || shopItems).map((i: ShopItem) => ({ ...i })),
    missions: (saved.missions || dailyMissions).map((m: DailyMission) => ({ ...m })),
    battlesWon: saved.battlesWon || 0,
    playerName: saved.playerName || '冒险者',
    isLoggedIn: true,
    currentSaveSlot: saved.currentSaveSlot ?? slotIndex,
    completedLevels: saved.completedLevels || [],
    freeMode: null,
    freeLeaderboard: saved.freeLeaderboard || JSON.parse(localStorage.getItem('typingLeaderboard') || '[]'),
  };
}

function settleFreeModeRewards(state: GameState, freeMode: NonNullable<GameState['freeMode']>, timeLeft: number): GameState {
  if (freeMode.rewardClaimed) {
    return { ...state, screen: 'FREE_RESULT', freeMode: { ...freeMode, timeLeft, isRunning: false } };
  }

  const coins = freeMode.correctCount * freeMode.rewards.coins;
  const xp = freeMode.correctCount * freeMode.rewards.xp;
  const newXp = state.player.xp + xp;
  const levelInfo = getPlayerLevel(newXp);
  const didLevelUp = levelInfo.level > state.player.level;

  const nextState = {
    ...state,
    screen: 'FREE_RESULT',
    player: {
      ...state.player,
      coins: state.player.coins + coins,
      xp: newXp,
      level: levelInfo.level,
      maxHp: levelInfo.maxHp,
      hp: didLevelUp ? levelInfo.maxHp : Math.min(levelInfo.maxHp, state.player.hp + Math.min(10, freeMode.correctCount)),
    },
    freeMode: { ...freeMode, timeLeft, isRunning: false, rewardClaimed: true },
  };
  if (nextState.isLoggedIn) saveToSlot(nextState.currentSaveSlot, nextState);
  return nextState;
}

// ============ Reducer ============
function reducer(s: GameState, a: Action): GameState {
  const setScreen = (sc: GameScreen) => ({ ...s, prevScreen: s.screen, screen: sc });
  switch (a.type) {
    case 'LOGIN': {
      const name = a.payload.name.trim() || '小冒险者';
      return { ...s, playerName: name, currentSaveSlot: a.payload.slot, isLoggedIn: true, screen: s.showTutorial ? 'TUTORIAL' : 'WORLD_SELECT', prevScreen: s.screen };
    }
    case 'LOGOUT': {
      for (let i = 0; i < 3; i++) localStorage.removeItem(`typingSave_${i}`);
      return initState();
    }
    case 'LOAD_SAVE': {
      const slot = a.payload;
      const loaded = loadFromSlot(slot);
      return { ...loaded, screen: loaded.isLoggedIn ? 'WORLD_SELECT' : 'LOGIN' };
    }
    case 'DELETE_SAVE': {
      deleteSaveSlot(a.payload);
      return { ...s };
    }
    case 'SELECT_SLOT': {
      return { ...s, currentSaveSlot: a.payload };
    }
    case 'START_GAME': resumeAudio(); return { ...s, screen: s.showTutorial ? 'TUTORIAL' : 'WORLD_SELECT', player: initPlayer(), startTime: Date.now() };
    case 'CLOSE_TUTORIAL': return { ...s, screen: 'WORLD_SELECT', showTutorial: false };
    case 'GO_WORLD_SELECT': return setScreen('WORLD_SELECT');
    case 'SELECT_WORLD': return { ...setScreen('LEVEL_SELECT'), currentWorldId: a.payload };
    case 'GO_MAP': return setScreen('MAP');
    case 'GO_BACK': {
      const backMap: Record<string, GameScreen> = { LEVEL_SELECT: 'WORLD_SELECT', WORLD_SELECT: 'TITLE', SHOP: 'LEVEL_SELECT', MISSIONS: 'LEVEL_SELECT', VOCAB: 'REPORT', REPORT: 'TITLE', FREE_MODE: 'WORLD_SELECT', FREE_RESULT: 'FREE_MODE', PAUSED: 'BATTLE', FREE_LEADERBOARD: 'FREE_RESULT' };
      return setScreen(backMap[s.screen] || s.prevScreen);
    }
    case 'PAUSE_BATTLE': return setScreen('PAUSED');
    case 'RESUME_BATTLE': return setScreen('BATTLE');
    case 'ESCAPE_BATTLE': {
      if (!s.battle) return s;
      return { ...s, screen: 'LEVEL_SELECT', battle: null, player: { ...s.player, hp: Math.max(1, s.player.hp - 10) } };
    }
    case 'USE_ITEM': {
      const item = s.shopInventory.find(i => i.id === a.payload);
      if (!item || !item.consumable || item.purchased) return s;
      let nhp = s.player.hp; let nmh = s.player.maxHp;
      if (item.effect.type === 'heal') nhp = Math.min(nmh, nhp + item.effect.value);
      return { ...s, player: { ...s.player, hp: nhp, maxHp: nmh }, shopInventory: s.shopInventory.map(i => i.id === a.payload ? { ...i, purchased: true } : i), screen: 'BATTLE' };
    }
    case 'OPEN_FREE_MODE': return setScreen('FREE_MODE');
    case 'CLOSE_FREE_MODE': return setScreen('WORLD_SELECT');
    case 'START_FREE_PLAY': {
      const { difficulty, timeLimit } = a.payload;
      const c = getRandomFreeContent(difficulty, []);
      return { ...setScreen('FREE_PLAY'), freeMode: { difficulty, timeLeft: timeLimit, timeLimit, targetText: c.text, playerInput: '', correctCount: 0, totalChars: 0, wordCount: 0, currentContent: c, isNewWord: false, combo: 0, maxCombo: 0, isRunning: true, rewardClaimed: false, recordSaved: false, rewards: { coins: getFreeContentReward(difficulty, true), xp: getFreeContentReward(difficulty, true) } } };
    }
    case 'FREE_TICK': {
      if (!s.freeMode || !s.freeMode.isRunning) return s;
      const nt = s.freeMode.timeLeft - 0.1;
      if (nt <= 0) return settleFreeModeRewards(s, s.freeMode, 0);
      return { ...s, freeMode: { ...s.freeMode, timeLeft: nt } };
    }
    case 'FREE_TYPE': {
      if (!s.freeMode || !s.freeMode.isRunning) return s;
      const fm = s.freeMode; const ni = fm.playerInput + a.payload; const tgt = fm.targetText;
      let ok = true;
      for (let i = 0; i < ni.length; i++) { if (i >= tgt.length || ni[i].toLowerCase() !== tgt[i].toLowerCase()) { ok = false; break; } }
      if (!ok) { playErrorSound(); return { ...s, freeMode: { ...fm, playerInput: ni } }; }
      playKeySound();
      if (ni.toLowerCase() === tgt.toLowerCase()) {
        playAttackSound();
        const nc = fm.combo + 1;
        const newWords = [...s.wordsLearned];
        if ((fm.currentContent?.type === 'word' || fm.currentContent?.type === 'phrase') && !newWords.includes(tgt)) newWords.push(tgt);
        const nextC = getRandomFreeContent(fm.difficulty, [tgt]);
        return { ...s, freeMode: { ...fm, playerInput: '', targetText: nextC.text, correctCount: fm.correctCount + 1, totalChars: fm.totalChars + tgt.length, wordCount: fm.wordCount + (tgt.length > 2 ? 1 : 0), currentContent: nextC, combo: nc, maxCombo: Math.max(fm.maxCombo, nc) }, wordsLearned: newWords };
      }
      return { ...s, freeMode: { ...fm, playerInput: ni } };
    }
    case 'FREE_BACKSPACE': {
      if (!s.freeMode || !s.freeMode.isRunning) return s;
      return { ...s, freeMode: { ...s.freeMode, playerInput: s.freeMode.playerInput.slice(0, -1) } };
    }
    case 'END_FREE_PLAY': return s.freeMode ? settleFreeModeRewards(s, s.freeMode, s.freeMode.timeLeft) : { ...s, screen: 'FREE_RESULT', freeMode: null };
    case 'START_LEVEL': {
      const lv = getLevelById(a.payload); if (!lv) return s;
      const m = getMonsterById(lv.monsterId); if (!m) return s;
      const tr = getTotalRounds(m);
      const isRepeat = s.completedLevels.includes(a.payload);
      const repeatStageBonus = isRepeat ? 2 : 0;
      return { ...s, screen: 'BATTLE_TRANSITION', currentLevelId: a.payload,
        battle: { monster: { ...m }, currentRound: 1, maxRounds: tr, currentWaveIndex: 0, targetText: '', playerInput: '', timeLeft: 0, timeLimit: 8, combo: 0, maxCombo: 0, totalErrors: 0, roundErrors: 0, roundResults: [], monsterHp: m.hp, playerHp: s.player.hp, battleStatus: 'typing', usedTexts: [], currentContent: null, lastDamage: 0, shakeScreen: false, showComboPopup: false, defensePrompt: '', currentLevelId: a.payload, isNewWord: false },
        currentStage: Math.max(s.currentStage, lv.stage) + repeatStageBonus };
    }
    case 'MOVE_PLAYER': { const nx = Math.max(0, Math.min(MAP_W - PW, s.player.x + a.payload.dx)); return { ...s, player: { ...s.player, x: nx, facingRight: a.payload.dx > 0 } }; }
    case 'JUMP_PLAYER': { if (s.player.onGround) return { ...s, player: { ...s.player, vy: JUMP_F, onGround: false } }; return s; }
    case 'UPDATE_PLAYER_PHYSICS': {
      const p = s.player; let nvy = p.vy + GRAVITY; let ny = p.y + nvy; let og = false;
      if (ny >= GROUND_Y - PH) { ny = GROUND_Y - PH; nvy = 0; og = true; }
      const ne = s.mapEntities.map(e => {
        if (e.type === 'coin' && !e.collected) { const d = Math.abs(p.x + PW / 2 - e.x); const yd = Math.abs(p.y + PH / 2 - e.y); if (d < 35 && yd < 40) return { ...e, collected: true }; }
        if (e.type === 'chest' && !e.opened) { const d = Math.abs(p.x + PW / 2 - e.x); const yd = Math.abs(p.y + PH / 2 - e.y); if (d < 45 && yd < 50) return { ...e, opened: true }; }
        return e;
      });
      const cc = ne.filter((e, i) => e.type === 'coin' && e.collected && !s.mapEntities[i].collected).length;
      const oc = ne.filter((e, i) => e.type === 'chest' && e.opened && !s.mapEntities[i].opened).length;
      for (const e of ne) {
        if (e.type === 'monster' && e.monsterId && !s.defeatedMonsters.includes(e.monsterId)) {
          const dx = Math.abs(p.x + PW / 2 - e.x);
          const dy = Math.abs(p.y + PH / 2 - e.y);
          if (dx < 50 && dy < 60) {
            const mon = getMonsterById(e.monsterId);
            if (mon) {
              const totalR = getTotalRounds(mon);
              const newBattle = {
                monster: { ...mon }, currentRound: 1, maxRounds: totalR, currentWaveIndex: 0,
                targetText: '', playerInput: '', timeLeft: 0, timeLimit: 8,
                combo: 0, maxCombo: 0, totalErrors: 0, roundErrors: 0, roundResults: [],
                monsterHp: mon.hp, playerHp: p.hp, battleStatus: 'typing' as const,
                usedTexts: [], currentContent: null, lastDamage: 0,
                shakeScreen: false, showComboPopup: false, defensePrompt: '', currentLevelId: '', isNewWord: false,
              };
              return { ...s, screen: 'BATTLE_TRANSITION' as const, player: { ...p, y: ny, vy: nvy, onGround: og, coins: p.coins + cc * 5 + oc * 25 }, mapEntities: ne, battle: newBattle };
            }
          }
        }
      }
      for (const e of ne) {
        if (e.type === 'flag') {
          const dx = Math.abs(p.x + PW / 2 - e.x);
          if (dx < 60) return { ...s, screen: 'REPORT' as const, player: { ...p, y: ny, vy: nvy, onGround: og, coins: p.coins + cc * 5 + oc * 25 }, mapEntities: ne };
        }
      }
      return { ...s, player: { ...p, y: ny, vy: nvy, onGround: og, coins: p.coins + cc * 5 + oc * 25 }, mapEntities: ne };
    }
    case 'END_TRANSITION': {
      if (!s.battle) return s;
      const { wave } = getWaveForRound(s.battle.monster, 1);
      const c = getRandomContent(wave, [], s.currentStage);
      const isRepeat1 = s.currentLevelId ? s.completedLevels.includes(s.currentLevelId) : false;
      const timeP1 = isRepeat1 ? 0.8 : 1.0;
      const sandBonus = s.player.timeSandBattles > 0 ? 3 : 0;
      const tl = Math.round((getTimeLimit(c.text, c.type, wave.timeMultiplier) + s.player.timeBoost + sandBonus) * timeP1);
      const isNew = (c.type === 'word' || c.type === 'phrase') && !s.wordsSeen.includes(c.text);
      const newSandBattles = s.player.timeSandBattles > 0 ? s.player.timeSandBattles - 1 : s.player.timeSandBattles;
      return { ...s, screen: 'BATTLE', player: { ...s.player, timeSandBattles: newSandBattles }, battle: { ...s.battle, targetText: c.text, timeLeft: tl, timeLimit: tl, playerInput: '', usedTexts: [c.text], currentContent: c, currentWaveIndex: 0, battleStatus: 'typing', isNewWord: isNew } };
    }
    case 'TYPE_CHAR': {
      if (!s.battle || s.battle.battleStatus !== 'typing') return s;
      const b = s.battle; const ni = b.playerInput + a.payload; const tgt = b.targetText;
      let ok = true; for (let i = 0; i < ni.length; i++) { if (i >= tgt.length || ni[i].toLowerCase() !== tgt[i].toLowerCase()) { ok = false; break; } }
      const ne2 = b.roundErrors + (ok ? 0 : 1);
      if (!ok) { playErrorSound(); } else { playKeySound(); }
      const wk = { ...s.weakKeys }; if (!ok && a.payload) { const k = a.payload.toLowerCase(); wk[k] = (wk[k] || 0) + 1; }
      if (ni.toLowerCase() === tgt.toLowerCase() && ok) {
        playAttackSound();
        const c = b.currentContent; if (!c) return s;
        const dmg = calculateDamage(b.timeLeft, b.timeLimit, ne2, b.combo, s.player.level, s.player.damageBoost);
        const nmh = Math.max(0, b.monsterHp - dmg); const nc = b.combo + 1;
        const wl = [...s.wordsLearned]; const ws = [...s.wordsSeen];
        if ((c.type === 'word' || c.type === 'phrase') && !wl.includes(c.text)) wl.push(c.text);
        if ((c.type === 'word' || c.type === 'phrase') && !ws.includes(c.text)) ws.push(c.text);
        // Wave complete HP bonus
        return { ...s, weakKeys: wk, battle: { ...b, playerInput: ni, roundErrors: ne2, combo: nc, maxCombo: Math.max(b.maxCombo, nc), totalErrors: b.totalErrors + ne2, monsterHp: nmh, roundResults: [...b.roundResults, { correct: true, timeLeft: b.timeLeft, timeLimit: b.timeLimit, errors: ne2, text: tgt }], battleStatus: 'player_attack', lastDamage: dmg, showComboPopup: nc >= 3 && nc % 3 === 0 }, totalCorrect: s.totalCorrect + 1, totalInputs: s.totalInputs + tgt.length, wordsLearned: wl, wordsSeen: ws, player: { ...s.player, hp: Math.min(s.player.maxHp, s.player.hp + 2) } };
      }
      return { ...s, weakKeys: wk, battle: { ...b, playerInput: ni, roundErrors: ne2 } };
    }
    case 'BACKSPACE': { if (!s.battle || s.battle.battleStatus !== 'typing') return s; return { ...s, battle: { ...s.battle, playerInput: s.battle.playerInput.slice(0, -1) } }; }
    case 'TICK_TIMER': {
      if (!s.battle) return s;
      const b = s.battle;
      // Shield phase ticks too - 3 second limit
      if (b.battleStatus === 'shield_phase') {
        const nt = b.timeLeft - 0.1;
        if (nt <= 0) {
          const md = calculateMonsterDamage(b.monster.attackDamage, s.player.defenseBoost);
          const nph = Math.max(0, b.playerHp - md);
          return { ...s, battle: { ...b, timeLeft: 0, playerHp: nph, combo: 0, totalErrors: b.totalErrors + b.roundErrors, roundResults: [...b.roundResults, { correct: false, timeLeft: 0, timeLimit: b.timeLimit, errors: b.roundErrors, text: b.targetText }], battleStatus: 'monster_attack', lastDamage: md, shakeScreen: true, defensePrompt: '' }, totalInputs: s.totalInputs + b.targetText.length, totalTimeouts: s.totalTimeouts + 1 };
        }
        return { ...s, battle: { ...b, timeLeft: nt } };
      }
      if (b.battleStatus !== 'typing') return s;
      const nt = b.timeLeft - 0.1;
      if (nt <= 0) {
        const canUseShield = b.monster.isBoss && b.currentRound % 4 === 0;
        if (canUseShield) {
          return { ...s, battle: { ...b, timeLeft: 3, battleStatus: 'shield_phase', defensePrompt: b.targetText[0] || 'A', roundErrors: b.roundErrors + 1 } };
        }
        const md = calculateMonsterDamage(b.monster.attackDamage, s.player.defenseBoost);
        const nph = Math.max(0, b.playerHp - md);
        return { ...s, battle: { ...b, timeLeft: 0, playerHp: nph, combo: 0, totalErrors: b.totalErrors + b.roundErrors + 1, roundResults: [...b.roundResults, { correct: false, timeLeft: 0, timeLimit: b.timeLimit, errors: b.roundErrors + 1, text: b.targetText }], battleStatus: 'monster_attack', lastDamage: md, shakeScreen: true }, totalInputs: s.totalInputs + b.targetText.length, totalTimeouts: s.totalTimeouts + 1 };
      }
      return { ...s, battle: { ...b, timeLeft: nt } };
    }
    case 'ACTIVATE_SHIELD': {
      if (!s.battle || s.battle.battleStatus !== 'shield_phase') return s;
      const b = s.battle;
      const rd = Math.max(1, Math.floor(calculateMonsterDamage(b.monster.attackDamage, s.player.defenseBoost) * 0.3));
      const nph = Math.max(0, b.playerHp - rd);
      return { ...s, battle: { ...b, timeLeft: 0, playerHp: nph, combo: 0, totalErrors: b.totalErrors + b.roundErrors, roundResults: [...b.roundResults, { correct: false, timeLeft: 0, timeLimit: b.timeLimit, errors: b.roundErrors, text: b.targetText }], battleStatus: 'monster_attack', lastDamage: rd, shakeScreen: true, defensePrompt: '' }, totalInputs: s.totalInputs + b.targetText.length, totalTimeouts: s.totalTimeouts + 1 };
    }
    case 'END_BATTLE_ANIMATION': {
      if (!s.battle) return s; const b = s.battle;
      if (b.battleStatus === 'player_attack') {
        if (b.monsterHp <= 0) {
          const acc = b.roundResults.length > 0 ? Math.round((b.roundResults.filter(r => r.correct).length / b.roundResults.length) * 100) : 0;
          const stars = calculateStars(acc, b.totalErrors, b.maxRounds);
          const np = { ...s.levelProgress };
          if (b.currentLevelId && np[b.currentLevelId]) { const p = np[b.currentLevelId]; np[b.currentLevelId] = { ...p, completed: true, stars: Math.max(p.stars, stars), bestAccuracy: Math.max(p.bestAccuracy, acc) }; }
          const xg = b.monster.baseXp;
          const cg = b.monster.baseCoins;
          const nm = s.missions.map(m => { if (m.id === 'm1') return { ...m, completed: true, progress: Math.min(m.target, m.progress + 1) }; if (m.id === 'm2' && acc >= 80) return { ...m, completed: true, progress: acc }; if (m.id === 'm3') { const nw = b.roundResults.filter(r => r.text.length > 2).length; return { ...m, progress: Math.min(m.target, m.progress + nw) }; } return m; });
          const newXp = s.player.xp + xg;
          const lvlInfo = getPlayerLevel(newXp);
          const didLevelUp = lvlInfo.level > s.player.level;
          const levelId = s.currentLevelId;
          const newCompleted = levelId && !s.completedLevels.includes(levelId) ? [...s.completedLevels, levelId] : s.completedLevels;
          playVictorySound();
          return { ...s, screen: 'RESULT', battle: { ...b, battleStatus: 'victory', showComboPopup: false, didLevelUp }, totalBattles: s.totalBattles + 1, battlesWon: s.battlesWon + 1, defeatedMonsters: [...s.defeatedMonsters, b.monster.id], player: { ...s.player, xp: newXp, coins: s.player.coins + cg, level: lvlInfo.level, maxHp: lvlInfo.maxHp, hp: didLevelUp ? lvlInfo.maxHp : Math.min(lvlInfo.maxHp, b.playerHp + 5) }, levelProgress: np, missions: nm, completedLevels: newCompleted };
        }
        const nr = b.currentRound + 1;
        const { wave, waveIndex } = getWaveForRound(b.monster, nr);
        // Wave switch happens inline without popup
        const c = getRandomContent(wave, b.usedTexts, s.currentStage);
        const isRepeat2 = s.currentLevelId ? s.completedLevels.includes(s.currentLevelId) : false;
        const timeP2 = isRepeat2 ? 0.8 : 1.0;
        const tl = Math.round((getTimeLimit(c.text, c.type, wave.timeMultiplier) + s.player.timeBoost + (s.player.timeSandBattles > 0 ? 3 : 0)) * timeP2);
        const isNew = (c.type === 'word' || c.type === 'phrase') && !s.wordsSeen.includes(c.text);
        return { ...s, screen: 'BATTLE', battle: { ...b, currentRound: nr, currentWaveIndex: waveIndex, targetText: c.text, playerInput: '', timeLeft: tl, timeLimit: tl, roundErrors: 0, usedTexts: [...b.usedTexts, c.text], currentContent: c, battleStatus: 'typing', showComboPopup: false, isNewWord: isNew } };
      }
      if (b.battleStatus === 'monster_attack') {
        if (b.playerHp <= 0) { playDefeatSound(); return { ...s, screen: 'RESULT', battle: { ...b, battleStatus: 'defeat', shakeScreen: false, showComboPopup: false }, totalBattles: s.totalBattles + 1, player: { ...s.player, hp: Math.max(1, b.playerHp) } }; }
        const nr = Math.min(b.currentRound + 1, b.maxRounds);
        const { wave, waveIndex } = getWaveForRound(b.monster, nr);
        const c = getRandomContent(wave, b.usedTexts, s.currentStage);
        const isRepeat3 = s.currentLevelId ? s.completedLevels.includes(s.currentLevelId) : false;
        const timeP3 = isRepeat3 ? 0.8 : 1.0;
        const tl = Math.round((getTimeLimit(c.text, c.type, wave.timeMultiplier) + s.player.timeBoost + (s.player.timeSandBattles > 0 ? 3 : 0)) * timeP3);
        const isNew = (c.type === 'word' || c.type === 'phrase') && !s.wordsSeen.includes(c.text);
        return { ...s, screen: 'BATTLE', battle: { ...b, currentRound: nr, currentWaveIndex: waveIndex, targetText: c.text, playerInput: '', timeLeft: tl, timeLimit: tl, roundErrors: 0, usedTexts: [...b.usedTexts, c.text], currentContent: c, battleStatus: 'typing', shakeScreen: false, showComboPopup: false, defensePrompt: '', isNewWord: isNew } };
      }
      return s;
    }
    case 'CONTINUE_FROM_RESULT': return { ...s, screen: 'LEVEL_SELECT', battle: null };
    case 'OPEN_SHOP': return setScreen('SHOP');
    case 'CLOSE_SHOP': return setScreen(s.prevScreen === 'RESULT' ? 'LEVEL_SELECT' : s.prevScreen);
    case 'OPEN_STATUS': return setScreen('STATUS');
    case 'CLOSE_STATUS': return setScreen('LEVEL_SELECT');
    case 'OPEN_MONSTER_BOOK': return setScreen('MONSTER_BOOK');
    case 'CLOSE_MONSTER_BOOK': return setScreen('LEVEL_SELECT');
    case 'OPEN_FREE_LEADERBOARD': return setScreen('FREE_LEADERBOARD');
    case 'CLOSE_FREE_LEADERBOARD': return setScreen('FREE_RESULT');
    case 'SAVE_FREE_RECORD': {
      if (!s.freeMode) return s;
      const fm = s.freeMode;
      if (fm.recordSaved) return s;
      const score = fm.correctCount * fm.rewards.coins + fm.maxCombo * 2;
      const newRecord = {
        id: Date.now().toString(),
        difficulty: fm.difficulty,
        timeLimit: fm.timeLimit,
        correctCount: fm.correctCount,
        totalChars: fm.totalChars,
        maxCombo: fm.maxCombo,
        score,
        date: new Date().toLocaleDateString('zh-CN'),
      };
      const updated = [...s.freeLeaderboard, newRecord].sort((a, b) => b.score - a.score).slice(0, 50);
      localStorage.setItem('typingLeaderboard', JSON.stringify(updated));
      return { ...s, freeMode: { ...fm, recordSaved: true }, freeLeaderboard: updated };
    }
    case 'BUY_ITEM': {
      const item = s.shopInventory.find(i => i.id === a.payload);
      if (!item || (item.purchased && !item.consumable) || s.player.coins < item.price) return s;
      const ni = s.shopInventory.map(i => i.id === a.payload ? { ...i, purchased: !i.consumable } : i);
      let nhp = s.player.hp; let nmh = s.player.maxHp;
      let ndb = s.player.damageBoost; let ndfb = s.player.defenseBoost;
      let ntb = s.player.timeBoost; let ncb = s.player.comboBoost;
      let nsb = s.player.timeSandBattles;
      if (item.effect.type === 'heal') nhp = Math.min(nmh, nhp + item.effect.value);
      if (item.effect.type === 'damage_boost') ndb = item.effect.value;
      if (item.effect.type === 'defense_boost') ndfb = item.effect.value;
      if (item.effect.type === 'time_boost') ntb = item.effect.value;
      if (item.effect.type === 'combo_boost') ncb = item.effect.value;
      if (item.effect.type === 'time_sand') nsb += 3;
      return { ...s, shopInventory: ni, player: { ...s.player, coins: s.player.coins - item.price, hp: nhp, maxHp: nmh, damageBoost: ndb, defenseBoost: ndfb, timeBoost: ntb, comboBoost: ncb, timeSandBattles: nsb } };
    }
    case 'OPEN_MISSIONS': return setScreen('MISSIONS');
    case 'CLOSE_MISSIONS': return setScreen('LEVEL_SELECT');
    case 'OPEN_VOCAB': return setScreen('VOCAB');
    case 'CLOSE_VOCAB': return setScreen(s.prevScreen);
    case 'SHOW_REPORT': return setScreen('REPORT');
    case 'RESTART_GAME': return initState();
    default: return s;
  }
}

// ============ Particle System ============
function useParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const idRef = useRef(0);
  const spawn = useCallback((x: number, y: number, count: number, color: string) => {
    const np: Particle[] = Array.from({ length: count }, () => ({ id: idRef.current++, x, y, vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 1) * 400 - 100, color, size: 4 + Math.random() * 8, life: 1 }));
    setParticles(prev => [...prev, ...np]);
  }, []);
  useEffect(() => { if (particles.length === 0) return; const iv = setInterval(() => { setParticles(prev => prev.map(p => ({ ...p, x: p.x + p.vx * 0.016, y: p.y + p.vy * 0.016, vy: p.vy + 500 * 0.016, life: p.life - 0.025 })).filter(p => p.life > 0)); }, 16); return () => clearInterval(iv); }, [particles.length]);
  return { particles, spawn };
}

// ============ Shared Components ============
function BackButton({ onClick, label = '返回' }: { onClick: () => void; label?: string }) {
  return <button onClick={onClick} className="flex items-center gap-1 text-white/60 hover:text-white transition-colors text-sm cursor-pointer"><span>←</span><span>{label}</span></button>;
}

// ============ Screens ============
function SaveSlotScreen({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  const [showNameInput, setShowNameInput] = useState(false);
  const [name, setName] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const slots = [0, 1, 2].map(i => {
    try {
      const raw = localStorage.getItem(`typingSave_${i}`);
      if (!raw) return null;
      const s = JSON.parse(raw);
      return { name: s.playerName || '冒险者', level: s.player?.level || 1, world: s.currentWorldId || 'world1', battles: s.totalBattles || 0, date: s.saveDate || '未知' };
    } catch { return null; }
  });

  const handleNewGame = (slot: number) => {
    setSelectedSlot(slot);
    setShowNameInput(true);
    setName('');
  };

  const handleStart = () => {
    if (!name.trim() || selectedSlot === null) return;
    dispatch({ type: 'LOGIN', payload: { name: name.trim(), slot: selectedSlot } });
  };

  const handleLoad = (slot: number) => {
    dispatch({ type: 'LOAD_SAVE', payload: slot });
  };

  const handleDelete = (slot: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个存档吗？此操作不可恢复！')) {
      localStorage.removeItem(`typingSave_${slot}`);
      dispatch({ type: 'DELETE_SAVE', payload: slot });
    }
  };

  const worldNames: Record<string, string> = { world1: '字母草地', world2: '组合森林', world3: '短词小镇', world4: '海洋世界', world5: '太空世界' };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-500 z-50 flex items-center justify-center overflow-auto">
      <div className="w-full max-w-md px-6 py-8">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center text-5xl shadow-2xl mb-4">⌨️</div>
          <h1 className="text-3xl font-black text-white mb-1" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>键盘冒险岛</h1>
          <p className="text-white/50 text-sm">选择存档开始冒险</p>
        </div>
        {showNameInput ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <p className="text-white font-bold mb-3">存档 {selectedSlot! + 1} - 输入冒险者名字</p>
            <input type="text" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && name.trim()) handleStart(); }} placeholder="你的名字" className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/50 font-bold text-center text-lg outline-none focus:bg-white/30 transition-all border border-white/10 mb-4" maxLength={12} autoFocus />
            <div className="flex gap-2">
              <button onClick={() => setShowNameInput(false)} className="flex-1 py-3 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-all cursor-pointer">返回</button>
              <button onClick={handleStart} className={`flex-1 py-3 rounded-xl font-black text-lg transition-all ${name.trim() ? 'bg-white text-purple-600 hover:bg-white/90 shadow-lg' : 'bg-white/20 text-white/40 cursor-not-allowed'}`}>开始!</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {slots.map((slot, i) => (
              <div key={i} onClick={() => slot ? handleLoad(i) : handleNewGame(i)} className={`relative rounded-2xl p-4 border transition-all cursor-pointer ${slot ? 'bg-white/15 border-white/20 hover:bg-white/25' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black ${slot ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' : 'bg-white/10 text-white/40'}`}>{slot ? '💾' : i + 1}</div>
                  <div className="flex-1 min-w-0">
                    {slot ? (
                      <>
                        <p className="text-white font-black text-base">{slot.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/60">
                          <span>Lv.{slot.level}</span>
                          <span>{worldNames[slot.world] || slot.world}</span>
                          <span>战斗{slot.battles}</span>
                        </div>
                        <p className="text-white/30 text-[10px] mt-1">{slot.date}</p>
                      </>
                    ) : (
                      <p className="text-white/50 font-bold text-base">空存档 - 点击新建</p>
                    )}
                  </div>
                  {slot && (
                    <button onClick={e => handleDelete(i, e)} className="px-2 py-1 bg-red-500/30 hover:bg-red-500/50 text-red-200 text-xs font-bold rounded-lg transition-all cursor-pointer" title="删除存档">🗑️</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-white/20 text-xs text-center mt-6">共3个存档槽 · 进度保存在本地浏览器</p>
      </div>
    </div>
  );
}

function TitleScreen({ state, onStart, dispatch }: { state: GameState; onStart: () => void; dispatch: React.Dispatch<Action> }) {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/title_bg.jpg)' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => <div key={i} className="absolute rounded-full bg-white/30 animate-float" style={{ width: `${6 + Math.random() * 12}px`, height: `${6 + Math.random() * 12}px`, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s`, animationDuration: `${2 + Math.random() * 3}s` }} />)}
        </div>
        {/* Player info bar */}
        {state.isLoggedIn && (
          <div className="absolute top-4 right-4 flex items-center gap-3 bg-black/30 backdrop-blur-sm rounded-xl px-4 py-2">
            <span className="text-white font-bold text-sm">👋 {state.playerName}</span>
            <span className="text-yellow-300 font-bold text-sm">🪙 {state.player.coins}</span>
            <span className="text-blue-300 font-bold text-sm">Lv.{state.player.level}</span>
            <button onClick={() => { if (confirm('确定要登出吗？进度会自动保存。')) dispatch({ type: 'LOGOUT' }); }} className="text-white/60 hover:text-white text-xs font-bold ml-2 cursor-pointer transition-colors">登出</button>
          </div>
        )}
        <img src="hero.png" alt="Hero" className="w-36 h-auto mb-6 animate-breathe drop-shadow-2xl" />
        <h1 className="text-6xl md:text-7xl font-black text-white mb-3 text-center tracking-tight" style={{ textShadow: '3px 3px 0 #388E3C, 0 6px 20px rgba(0,0,0,0.3)' }}>键盘冒险岛</h1>
        <p className="text-xl md:text-2xl font-bold text-white/90 mb-10 tracking-[0.3em] uppercase" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.5)' }}>Typing Adventure</p>
        <button onClick={onStart} className="px-14 py-5 bg-gradient-to-b from-green-400 to-green-600 hover:from-green-300 hover:to-green-500 text-white text-2xl font-black rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 animate-pulse-glow cursor-pointer border-2 border-green-300/50">开始冒险</button>
        <p className="mt-6 text-white/60 text-sm font-medium" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>v0.13.0 | 本地进度自动保存</p>
      </div>
    </div>
  );
}

function TutorialOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-white rounded-3xl p-8 max-w-lg mx-4 shadow-2xl animate-scale-in">
        <h2 className="text-3xl font-black text-center text-green-600 mb-6">操作指南</h2>
        <div className="space-y-4 mb-8">
          {[{ icon: '🌍', title: '世界选择', desc: '从多个世界中选择关卡开始冒险' }, { icon: '⌨️', title: '打字攻击', desc: '输入正确的字母/单词来攻击怪物' }, { icon: '📖', title: '学习单词', desc: '战斗中显示中文释义，边玩边学' }, { icon: '🌱', title: '三波递进', desc: '每场战斗分热身→主力→挑战' }, { icon: '🏪', title: '商店购物', desc: '用金币购买装备提升能力' }, { icon: '📚', title: '词汇本', desc: '查看学过的所有单词' }].map((item, i) => (
            <div key={i} className="flex items-center gap-4"><div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">{item.icon}</div><div><p className="font-bold text-gray-800">{item.title}</p><p className="text-gray-500 text-sm">{item.desc}</p></div></div>
          ))}
        </div>
        <button onClick={onClose} className="w-full py-4 bg-gradient-to-b from-green-400 to-green-600 text-white text-xl font-bold rounded-xl shadow-md transition-all cursor-pointer hover:from-green-300 hover:to-green-500">我明白了！</button>
      </div>
    </div>
  );
}

function WorldSelectScreen({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<Action> }) {
  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: 'linear-gradient(to bottom, #0f2027 0%, #203a43 50%, #2c5364 100%)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 25 }).map((_, i) => <div key={i} className="absolute rounded-full bg-white/10 animate-float" style={{ width: `${3 + Math.random() * 6}px`, height: `${3 + Math.random() * 6}px`, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s`, animationDuration: `${3 + Math.random() * 4}s` }} />)}
      </div>
      <div className="relative z-10 flex flex-col items-center h-full px-4 py-8 overflow-auto">
        <div className="w-full max-w-2xl flex items-center justify-between mb-6">
          <BackButton onClick={() => dispatch({ type: 'GO_BACK' })} label="标题" />
          <h1 className="text-3xl font-black text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>选择世界</h1>
          <div className="w-16" />
        </div>
        {/* Free Challenge Button */}
        <button onClick={() => dispatch({ type: 'OPEN_FREE_MODE' })} className="w-full max-w-md mb-4 px-5 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-black rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-3">
          <span className="text-2xl">⚡</span>
          <span>自由挑战模式</span>
          <span className="text-orange-200 text-sm font-normal">1分钟打字挑战</span>
        </button>
        <div className="flex flex-col gap-5 w-full max-w-md">
          {worlds.map((world, idx) => {
            const isUnlocked = idx === 0 || (idx > 0 && worlds[idx - 1].levels.every(l => state.levelProgress[l.id]?.completed));
            const comp = world.levels.filter(l => state.levelProgress[l.id]?.completed).length;
            const ts = world.levels.reduce((sum, l) => sum + (state.levelProgress[l.id]?.stars || 0), 0);
            const icons = ['🌿', '🌲', '🏫', '🌊', '🚀'];
            return (
              <button key={world.id} onClick={() => isUnlocked && dispatch({ type: 'SELECT_WORLD', payload: world.id })} disabled={!isUnlocked}
                className={`relative w-full rounded-2xl p-5 flex items-center gap-4 shadow-lg transition-all text-left ${isUnlocked ? `bg-gradient-to-r ${world.bgColor} hover:scale-[1.02] hover:shadow-xl cursor-pointer` : 'bg-gray-700/40 cursor-not-allowed opacity-50'}`}>
                {!isUnlocked && <div className="absolute inset-0 flex items-center justify-center z-10 rounded-2xl bg-black/20"><span className="text-4xl">🔒</span></div>}
                <span className="text-4xl">{icons[idx]}</span>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-white">{world.nameCn}</h3>
                  <p className="text-white/60 text-xs">{world.name} | {world.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 h-2 bg-black/20 rounded-full overflow-hidden"><div className="h-full bg-yellow-400 rounded-full" style={{ width: `${world.levels.length > 0 ? (comp / world.levels.length) * 100 : 0}%` }} /></div>
                    <span className="text-white/80 text-xs font-bold">{comp}/{world.levels.length} | ⭐{ts}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LevelSelectScreen({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<Action> }) {
  const world = worlds.find(w => w.id === state.currentWorldId);
  if (!world) return null;
  return (
    <div className="relative w-full h-screen overflow-auto" style={{ background: 'linear-gradient(to bottom, #0f2027 0%, #203a43 100%)' }}>
      <div className="relative z-10 flex flex-col items-center px-4 py-6 min-h-full">
        <div className="w-full max-w-2xl flex items-center justify-between mb-4">
          <BackButton onClick={() => dispatch({ type: 'GO_BACK' })} label="世界" />
          <div className="text-center"><h1 className="text-2xl font-black text-white">{world.nameCn}</h1><p className="text-white/40 text-xs">{world.levels.filter(l => state.levelProgress[l.id]?.completed).length}/{world.levels.length} 关完成</p></div>
          <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full"><span className="text-sm">🪙</span><span className="text-yellow-400 font-bold text-sm">{state.player.coins}</span></div>
        </div>
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => dispatch({ type: 'OPEN_SHOP' })} className="px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 font-bold rounded-lg hover:bg-yellow-500/30 transition-all cursor-pointer text-xs">🏪 商店</button>
          <button onClick={() => dispatch({ type: 'OPEN_MISSIONS' })} className="px-3 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 font-bold rounded-lg hover:bg-blue-500/30 transition-all cursor-pointer text-xs">📋 任务</button>
          <button onClick={() => dispatch({ type: 'OPEN_VOCAB' })} className="px-3 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold rounded-lg hover:bg-purple-500/30 transition-all cursor-pointer text-xs">📚 词汇</button>
          <button onClick={() => dispatch({ type: 'OPEN_STATUS' })} className="px-3 py-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold rounded-lg hover:bg-indigo-500/30 transition-all cursor-pointer text-xs">👤 状态</button>
          <button onClick={() => dispatch({ type: 'OPEN_MONSTER_BOOK' })} className="px-3 py-2 bg-red-500/20 border border-red-500/30 text-red-300 font-bold rounded-lg hover:bg-red-500/30 transition-all cursor-pointer text-xs">📖 图鉴</button>
        </div>
        <div className="grid grid-cols-5 gap-3 w-full max-w-lg">
          {world.levels.map((level) => {
            const pg = state.levelProgress[level.id];
            const isUnlocked = !level.unlockRequirement || state.levelProgress[level.unlockRequirement]?.completed;
            const monster = getMonsterById(level.monsterId);
            return (
              <button key={level.id} onClick={() => isUnlocked && dispatch({ type: 'START_LEVEL', payload: level.id })} disabled={!isUnlocked}
                className={`relative aspect-[3/4] rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg transition-all ${isUnlocked ? 'bg-gradient-to-b from-white to-gray-100 hover:scale-105 hover:shadow-xl cursor-pointer border border-white/50' : 'bg-gray-700/30 cursor-not-allowed border border-gray-600/20'}`}>
                {isUnlocked && monster ? (<>
                  <img src={monster.image} alt={monster.nameCn} className="w-10 h-10 object-contain" style={pg?.completed ? {} : { filter: 'grayscale(0.3)' }} />
                  <span className="text-[10px] font-bold text-gray-700 leading-tight text-center px-1">{level.name}</span>
                  <div className="flex gap-px">{[1, 2, 3].map(s => <span key={s} className="text-[8px]">{s <= (pg?.stars || 0) ? '⭐' : '☆'}</span>)}</div>
                  {monster.isBoss && <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-[8px] font-bold px-1 py-px rounded-full">BOSS</span>}
                </>) : (<span className="text-2xl opacity-40">🔒</span>)}
              </button>
            );
          })}
        </div>
        {/* Level info panel */}
        <div className="mt-6 w-full max-w-lg bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <h3 className="text-white/80 font-bold text-sm mb-2">关卡信息</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-white/50">
            <span>总轮数: 10-15轮</span>
            <span>波次: 🌱热身 ⚡主力 🔥挑战</span>
            <span>⭐⭐⭐: 正确率90%+错误少</span>
            <span>⭐⭐: 正确率70%+</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function WaveTransitionScreen({ battle }: { battle: BattleState }) {
  const { waveIndex } = getWaveForRound(battle.monster, battle.currentRound);
  const labels = ['🌱 热身阶段开始！', '⚡ 主力阶段！加把劲！', '🔥 挑战阶段！全力以赴！'];
  const colors = ['text-green-400', 'text-blue-400', 'text-red-400'];
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center animate-fade-in">
      <div className="text-center animate-scale-in">
        <p className={`text-5xl font-black mb-4 ${colors[waveIndex] || 'text-white'}`} style={{ textShadow: '0 0 30px rgba(255,255,255,0.3)' }}>{labels[waveIndex] || '继续战斗！'}</p>
        <p className="text-white/50 text-lg">准备好了吗？</p>
      </div>
    </div>
  );
}

function BattleTransitionScreen({ monsterName, isBoss }: { monsterName: string; isBoss: boolean }) {
  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center animate-fade-in">
      <div className="text-center animate-encounter-zoom">
        <p className="text-7xl font-black text-white mb-4" style={{ textShadow: `0 0 40px ${isBoss ? 'rgba(156,39,176,0.6)' : 'rgba(255,152,0,0.5)'}` }}>{isBoss ? '⚠️ BOSS!' : '⚔️ 战斗!'}</p>
        <p className={`text-4xl font-black ${isBoss ? 'text-purple-400' : 'text-orange-400'}`}>{monsterName}</p>
      </div>
    </div>
  );
}

function BattleScreen({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<Action> }) {
  const battle = state.battle!;
  const { spawn } = useParticles();
  const { waveIndex } = getWaveForRound(battle.monster, battle.currentRound);
  const waveColors = ['bg-green-500', 'bg-blue-500', 'bg-red-500'];
  const waveLabels = ['🌱 热身', '⚡ 主力', '🔥 挑战'];
  const timerRatio = battle.timeLeft / battle.timeLimit;
  const isUrgent = timerRatio <= 0.3;
  const nextChar = battle.targetText[battle.playerInput.length] || '';

  useEffect(() => { if (battle.battleStatus === 'typing' || battle.battleStatus === 'shield_phase') { const iv = setInterval(() => dispatch({ type: 'TICK_TIMER' }), 100); return () => clearInterval(iv); } }, [battle.battleStatus, dispatch]);
  useEffect(() => { if (battle.battleStatus === 'player_attack' || battle.battleStatus === 'monster_attack') { const delay = battle.battleStatus === 'player_attack' ? 900 : 1000; const t = setTimeout(() => dispatch({ type: 'END_BATTLE_ANIMATION' }), delay); return () => clearTimeout(t); } }, [battle.battleStatus, dispatch]);
  useEffect(() => { if (battle.battleStatus === 'player_attack') spawn(window.innerWidth * 0.65, window.innerHeight * 0.4, 20, '#EF5350'); else if (battle.battleStatus === 'monster_attack') spawn(window.innerWidth * 0.35, window.innerHeight * 0.4, 15, '#E53935'); }, [battle.battleStatus, spawn]);
  useEffect(() => { const h = (e: KeyboardEvent) => { if (battle.battleStatus === 'shield_phase') { dispatch({ type: 'ACTIVATE_SHIELD' }); return; } if (battle.battleStatus !== 'typing') return; if (e.key === 'Backspace') { e.preventDefault(); dispatch({ type: 'BACKSPACE' }); return; } if (e.key.length === 1 && /[a-zA-Z ]/.test(e.key)) { e.preventDefault(); dispatch({ type: 'TYPE_CHAR', payload: e.key }); } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [battle.battleStatus, dispatch]);

  const renderText = () => battle.targetText.split('').map((ch, i) => { let cls = 'target-char-pending'; if (i < battle.playerInput.length) cls = battle.playerInput[i]?.toLowerCase() === ch.toLowerCase() ? 'target-char-correct' : 'target-char-wrong'; return <span key={i} className={cls} style={{ transition: 'all 0.15s ease' }}>{ch === ' ' ? '\u00A0' : ch}</span>; });
  const vkPress = (k: string) => { if (battle.battleStatus === 'shield_phase') { dispatch({ type: 'ACTIVATE_SHIELD' }); return; } if (battle.battleStatus !== 'typing') return; dispatch({ type: 'TYPE_CHAR', payload: k }); };
  const weakSet = useMemo(() => { const s = new Set<string>(); Object.entries(state.weakKeys).forEach(([k, c]) => { if (c >= 3) s.add(k); }); return s; }, [state.weakKeys]);

  return (
    <div className={`fixed inset-0 flex flex-col ${battle.shakeScreen ? 'animate-shake' : ''}`} style={{ background: 'linear-gradient(to bottom, #FFF8E1 0%, #FFE0B2 50%, #FFCC80 100%)' }}>
      <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: 'url(/battle_bg.jpg)' }} />
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-2 bg-black/20 backdrop-blur-sm">
        <div className={`text-3xl font-black tabular-nums ${isUrgent ? 'animate-timer-urgent' : 'text-orange-700'}`}>{Math.ceil(battle.timeLeft)}<span className="text-sm">s</span></div>
        <div className="flex flex-col items-center"><div className="flex gap-1">{battle.monster.waves.map((w, i) => <span key={i} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${i === waveIndex ? waveColors[i] : 'bg-gray-300'}`}>{w.name}</span>)}</div><span className="text-[10px] text-gray-500 mt-0.5">{waveLabels[waveIndex]} {battle.currentRound}/{battle.maxRounds}</span></div>
        <div className="flex items-center gap-2">
          {battle.combo > 1 && <span className="animate-combo-pop bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold text-xs">🔥x{battle.combo}</span>}
          <span className="text-xs font-bold text-gray-600 bg-white/50 px-2 py-0.5 rounded-full">{battle.roundResults.length > 0 ? Math.round((battle.roundResults.filter(r => r.correct).length / battle.roundResults.length) * 100) : 0}%</span>
          <button onClick={() => dispatch({ type: 'PAUSE_BATTLE' })} className="text-xl hover:scale-110 transition-transform cursor-pointer" title="暂停">⏸️</button>
        </div>
      </div>
      {/* Battle area */}
      <div className="relative z-10 flex-1 flex items-center justify-between px-6 md:px-16">
        <div className="flex flex-col items-center gap-1 w-1/3">
          <span className="text-xs font-bold text-white bg-black/30 px-2 py-0.5 rounded">Lv.{state.player.level}</span>
          <div className="w-32"><div className="hp-bar-container"><div className="hp-bar-fill bg-green-500" style={{ width: `${(battle.playerHp / state.player.maxHp) * 100}%` }} /></div></div>
          <div className={`relative ${battle.battleStatus === 'player_attack' ? 'animate-hero-attack' : ''}`}>
            <img src="hero.png" alt="Hero" className="w-24 h-auto object-contain" style={{ animation: battle.battleStatus === 'typing' ? 'breathe 1.5s ease-in-out infinite' : 'none' }} />
            {battle.battleStatus === 'player_attack' && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-green-600 font-black animate-damage-float">-{battle.lastDamage}</div>}
            {battle.battleStatus === 'monster_attack' && <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-red-600 font-black animate-damage-float">-{battle.lastDamage}</div>}
          </div>
        </div>
        <div className="text-center"><span className="text-4xl font-black text-red-400/30">VS</span>{battle.showComboPopup && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-combo-pop"><span className="text-5xl">💥</span></div>}</div>
        <div className="flex flex-col items-center gap-1 w-1/3">
          <span className={`text-xs font-bold text-white px-2 py-0.5 rounded ${battle.monster.isBoss ? 'bg-purple-600 animate-pulse' : 'bg-red-500'}`}>{battle.monster.isBoss ? '👑 ' : ''}{battle.monster.nameCn}</span>
          <div className="w-32"><div className="hp-bar-container"><div className="hp-bar-fill bg-red-500" style={{ width: `${(battle.monsterHp / battle.monster.maxHp) * 100}%` }} /></div></div>
          <div className="w-32"><div className="charge-bar-container"><div className="charge-bar-fill" style={{ width: `${(1 - timerRatio) * 100}%` }} /></div></div>
          <div className={`relative ${battle.battleStatus === 'monster_attack' ? 'animate-monster-attack' : ''} ${battle.battleStatus === 'player_attack' ? 'animate-flash-red' : ''}`}>
            <img src={battle.monster.image} alt={battle.monster.nameCn} className={`object-contain ${battle.monster.isBoss ? 'w-28 h-28 drop-shadow-[0_0_15px_rgba(156,39,176,0.6)]' : 'w-24 h-24'}`} style={{ animation: battle.battleStatus === 'typing' ? `float ${battle.monster.isBoss ? '1.5s' : '2s'} ease-in-out infinite` : 'none' }} />
            {battle.monster.isBoss && <div className="absolute -inset-2 border-2 border-purple-400/30 rounded-full animate-pulse pointer-events-none" />}
            {/* damage number moved to hero side */}
          </div>
        </div>
      </div>
      {/* Shield phase */}
      {battle.battleStatus === 'shield_phase' && <div className="relative z-10 mx-4 md:mx-16 mb-3"><div className="bg-purple-600/90 rounded-xl p-4 text-center animate-pulse"><p className="text-white font-bold">🛡️ 快按任意键激活拼写盾！伤害-70%</p></div></div>}
      {/* Target text */}
      <div className="relative z-10 bg-white/85 backdrop-blur-sm mx-4 md:mx-16 rounded-2xl p-5 shadow-lg">
        {battle.currentContent && (
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-lg">{battle.currentContent.type === 'word' || battle.currentContent.type === 'phrase' ? '📖' : '⌨️'}</span>
            <span className="text-base font-bold text-gray-700">{battle.currentContent.meaningCn}</span>
            {battle.isNewWord && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-px rounded-full animate-pulse">新</span>}
            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-px rounded-full">{battle.currentContent.type === 'letter' ? '字母' : battle.currentContent.type === 'combo' ? '组合' : battle.currentContent.type === 'word' ? '单词' : '短语'}</span>
          </div>
        )}
        <div className="text-center text-4xl md:text-5xl font-black font-mono tracking-widest mb-3 min-h-[56px] py-1">{renderText()}</div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${(battle.playerInput.length / Math.max(1, battle.targetText.length)) * 100}%` }} /></div>
      </div>
      {/* Escape button + Keyboard */}
      <div className="relative z-10 flex items-center justify-between px-6 mt-2">
        <button onClick={() => dispatch({ type: 'PAUSE_BATTLE' })} className="px-3 py-1.5 bg-gray-500/30 hover:bg-gray-500/50 text-white/70 text-xs font-bold rounded-lg transition-all cursor-pointer">🎒 背包</button>
        <button onClick={() => { if (confirm('确定要逃跑吗？会扣除10HP！')) dispatch({ type: 'ESCAPE_BATTLE' }); }} className="px-3 py-1.5 bg-red-500/30 hover:bg-red-500/50 text-white/70 text-xs font-bold rounded-lg transition-all cursor-pointer">🏃 逃跑 (-10HP)</button>
      </div>
      <div className="relative z-10 bg-black/10 mt-1 px-4 pb-3 pt-1">
        <p className="text-center text-[10px] text-gray-500 mb-1">{weakSet.size > 0 ? `薄弱键: ${[...weakSet].join(', ')}` : '使用键盘或点击输入'}</p>
        <div className="flex flex-col items-center gap-1">
          {keyboardLayout.map((row, ri) => (
            <div key={ri} className="flex gap-1" style={{ paddingLeft: ri === 1 ? '16px' : ri === 2 ? '32px' : '0' }}>
              {row.map(key => {
                const isT = key.toLowerCase() === nextChar.toLowerCase() && battle.battleStatus === 'typing';
                const isP = battle.playerInput.length > 0 && key.toLowerCase() === battle.playerInput[battle.playerInput.length - 1]?.toLowerCase();
                const isW = weakSet.has(key.toLowerCase());
                return <button key={key} onClick={() => vkPress(key.toLowerCase())} className={`vk-key ${isT ? 'target' : ''} ${isP ? 'active' : ''} ${isW ? 'border-red-400 bg-red-50' : ''}`} disabled={battle.battleStatus !== 'typing'}>{key}</button>;
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ResultScreen({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<Action> }) {
  const battle = state.battle!;
  const isV = battle.battleStatus === 'victory';
  const acc = battle.roundResults.length > 0 ? Math.round((battle.roundResults.filter(r => r.correct).length / battle.roundResults.length) * 100) : 0;
  const stars = isV ? calculateStars(acc, battle.totalErrors, battle.maxRounds) : 0;
  const wk = Object.entries(state.weakKeys).filter(([_, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-white rounded-3xl p-6 max-w-sm mx-4 shadow-2xl animate-slide-up max-h-[90vh] overflow-auto">
        {isV ? (<>
          <div className="text-center"><span className="text-4xl">🎉</span><h2 className="text-3xl font-black text-green-600 mt-1">胜利!</h2></div>
          <div className="flex justify-center gap-2 my-4">{[1, 2, 3].map(s => <span key={s} className={`text-5xl ${s <= stars ? 'animate-star-burst' : 'grayscale opacity-20'}`} style={{ animationDelay: `${s * 0.2}s` }}>⭐</span>)}</div>
          <div className="space-y-2 mb-4 bg-gray-50 rounded-xl p-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">正确率</span><span className="font-black text-green-600">{acc}%</span></div>
            <div className="flex justify-between"><span className="text-gray-500">最高连击</span><span className="font-black text-orange-600">{battle.maxCombo}x</span></div>
            <div className="flex justify-between"><span className="text-gray-500">轮数</span><span className="font-black text-blue-600">{battle.roundResults.length}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">错误</span><span className="font-black text-red-500">{battle.totalErrors}</span></div>
          </div>
          {wk.length > 0 && <div className="bg-orange-50 rounded-lg p-2 mb-3 border border-orange-200 text-center"><p className="text-orange-700 text-xs font-bold">💡 需练习: {wk.map(([k]) => k.toUpperCase()).join(', ')}</p></div>}
          <div className="flex justify-center gap-3 mb-4"><div className="flex items-center gap-1 bg-yellow-50 rounded-lg px-3 py-2 border border-yellow-200"><span>🪙</span><span className="font-black text-yellow-700">+{battle.monster.baseCoins}</span></div><div className="flex items-center gap-1 bg-blue-50 rounded-lg px-3 py-2 border border-blue-200"><span>✨</span><span className="font-black text-blue-700">+{battle.monster.baseXp} XP</span></div></div>
          {battle.didLevelUp && (
            <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-3 mb-4 border border-purple-300 text-center animate-scale-in">
              <p className="text-purple-700 font-black text-lg">🎉 升级到 Lv.{state.player.level}!</p>
              <p className="text-purple-500 text-xs">HP上限提升至 {state.player.maxHp}，HP回满!</p>
            </div>
          )}
        </>) : (<>
          <div className="text-center"><span className="text-4xl">💪</span><h2 className="text-2xl font-black text-orange-500 mt-1">再努力!</h2></div>
          <div className="space-y-2 my-4 bg-gray-50 rounded-xl p-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">正确率</span><span className="font-black text-orange-500">{acc}%</span></div>
            <div className="flex justify-between"><span className="text-gray-500">轮数</span><span className="font-black text-blue-600">{battle.roundResults.length}</span></div>
          </div>
          {wk.length > 0 && <div className="bg-orange-50 rounded-lg p-2 mb-3 border border-orange-200 text-center"><p className="text-orange-700 text-xs font-bold">💡 建议: {wk.map(([k]) => k.toUpperCase()).join(', ')}</p></div>}
        </>)}
        <div className="flex gap-2">
          <button onClick={() => dispatch({ type: 'CONTINUE_FROM_RESULT' })} className={`flex-1 py-3 text-white font-black rounded-xl shadow-lg transition-all cursor-pointer ${isV ? 'bg-green-500 hover:bg-green-400' : 'bg-orange-500 hover:bg-orange-400'}`}>{isV ? '下一关 →' : '重试 ↺'}</button>
          <button onClick={() => dispatch({ type: 'OPEN_SHOP' })} className="px-3 py-3 bg-yellow-500 text-white font-black rounded-xl shadow-lg hover:bg-yellow-400 transition-all cursor-pointer">🏪</button>
        </div>
      </div>
    </div>
  );
}

function ShopScreen({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<Action> }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-white rounded-3xl p-6 max-w-sm mx-4 shadow-2xl animate-scale-in max-h-[85vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black text-gray-800">🏪 商店</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200"><span>🪙</span><span className="font-black text-yellow-700">{state.player.coins}</span></div>
            <button onClick={() => dispatch({ type: 'CLOSE_SHOP' })} className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer">✕</button>
          </div>
        </div>
        <div className="space-y-2 mb-4">
          {state.shopInventory.map(item => (
            <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border ${item.purchased && !item.consumable ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1 min-w-0"><p className="font-bold text-gray-800 text-sm">{item.name}</p><p className="text-gray-500 text-xs">{item.description}{item.id === 'hourglass' && state.player.timeSandBattles > 0 ? ` (剩余${state.player.timeSandBattles}场)` : ''}</p></div>
              {item.purchased && !item.consumable ? <span className="text-green-600 font-bold text-xs shrink-0">✓</span> : (
                <button onClick={() => dispatch({ type: 'BUY_ITEM', payload: item.id })} disabled={state.player.coins < item.price}
                  className={`px-2 py-1 rounded-lg font-bold text-xs shrink-0 cursor-pointer transition-all ${state.player.coins >= item.price ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>🪙 {item.price}</button>
              )}
            </div>
          ))}
        </div>
        <button onClick={() => dispatch({ type: 'CLOSE_SHOP' })} className="w-full py-3 bg-gray-500 text-white font-bold rounded-xl hover:bg-gray-400 transition-all cursor-pointer">关闭</button>
      </div>
    </div>
  );
}

function MissionsScreen({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<Action> }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-white rounded-3xl p-6 max-w-sm mx-4 shadow-2xl animate-scale-in">
        <h2 className="text-xl font-black text-gray-800 mb-1">📋 每日任务</h2>
        <p className="text-gray-400 text-xs mb-4">{state.missions.filter(m => m.completed).length}/{state.missions.length} 已完成</p>
        <div className="space-y-3 mb-6">
          {state.missions.map(m => (
            <div key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border ${m.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${m.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>{m.completed ? '✓' : '○'}</div>
              <div className="flex-1"><p className={`font-bold text-sm ${m.completed ? 'text-green-700 line-through' : 'text-gray-800'}`}>{m.description}</p><p className="text-gray-400 text-xs">{m.progress}/{m.target}</p></div>
              <div className="bg-yellow-50 px-2 py-1 rounded-full border border-yellow-200"><span className="text-yellow-700 font-bold text-xs">+{m.reward}</span></div>
            </div>
          ))}
        </div>
        <button onClick={() => dispatch({ type: 'CLOSE_MISSIONS' })} className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-400 transition-all cursor-pointer">知道了</button>
      </div>
    </div>
  );
}

function VocabScreen({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<Action> }) {
  const learned = state.wordsLearned;
  const seen = state.wordsSeen.filter(w => !learned.includes(w));
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-purple-50 to-indigo-100 z-50 overflow-auto">
      <div className="max-w-lg mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <BackButton onClick={() => dispatch({ type: 'CLOSE_VOCAB' })} label="返回" />
          <h1 className="text-2xl font-black text-purple-700">📚 我的词汇本</h1>
          <div className="w-12" />
        </div>
        {learned.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-500 mb-3">已掌握 ({learned.length})</h2>
            <div className="flex flex-wrap gap-2">{learned.map(w => <div key={w} className="bg-gradient-to-b from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl px-4 py-2 shadow-sm"><span className="font-black text-gray-800">{w}</span><span className="text-green-600 text-xs ml-1">✓</span></div>)}</div>
          </div>
        )}
        {seen.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-500 mb-3">练习中 ({seen.length})</h2>
            <div className="flex flex-wrap gap-2">{seen.map(w => <div key={w} className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-2 shadow-sm"><span className="font-bold text-gray-500">{w}</span></div>)}</div>
          </div>
        )}
        {learned.length === 0 && seen.length === 0 && <p className="text-center text-gray-400 py-12">还没有学过单词，快去战斗吧！</p>}
      </div>
    </div>
  );
}

// ============ Status Screen ============
function StatusScreen({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<Action> }) {
  const lvlInfo = getPlayerLevel(state.player.xp);
  const equippedItems = state.shopInventory.filter(i => !i.consumable && i.purchased);
  const hpPct = Math.round((state.player.hp / state.player.maxHp) * 100);
  const xpPct = Math.round((state.player.xp / lvlInfo.nextXp) * 100);
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 z-40 overflow-auto">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => dispatch({ type: 'CLOSE_STATUS' })} className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm font-bold hover:bg-white/30 transition-all cursor-pointer">返回</button>
          <h2 className="text-lg font-black text-white">👤 冒险者状态</h2>
          <div className="w-16" />
        </div>
        {/* Hero Card */}
        <div className="bg-white rounded-3xl p-5 shadow-2xl mb-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full opacity-50" />
          <div className="flex items-center gap-4 mb-4 relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center text-4xl shadow-lg">
              🧙
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-800 text-base truncate">{state.playerName || '冒险者'}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-black rounded-full">Lv.{state.player.level}</span>
                <span className="text-gray-400 text-xs font-bold">打字冒险者</span>
              </div>
            </div>
          </div>
          {/* HP Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-bold text-red-500">❤️ 生命值</span>
              <span className="font-black text-red-600">{state.player.hp} / {state.player.maxHp}</span>
            </div>
            <div className="w-full bg-red-100 rounded-full h-2.5">
              <div className="bg-gradient-to-r from-red-400 to-red-500 h-2.5 rounded-full transition-all" style={{ width: `${hpPct}%` }} />
            </div>
          </div>
          {/* XP Bar */}
          <div className="mb-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-bold text-blue-500">✨ 经验值</span>
              <span className="font-black text-blue-600">{state.player.xp} / {lvlInfo.nextXp}</span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all" style={{ width: `${xpPct}%` }} />
            </div>
          </div>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
            <p className="text-2xl mb-1">🪙</p>
            <p className="text-white font-black text-sm">{state.player.coins}</p>
            <p className="text-white/50 text-[10px] font-bold">金币</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
            <p className="text-2xl mb-1">⚔️</p>
            <p className="text-white font-black text-sm">+{Math.round(state.player.damageBoost * 100)}%</p>
            <p className="text-white/50 text-[10px] font-bold">攻击</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
            <p className="text-2xl mb-1">🛡️</p>
            <p className="text-white font-black text-sm">+{Math.round(state.player.defenseBoost * 100)}%</p>
            <p className="text-white/50 text-[10px] font-bold">防御</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
            <p className="text-2xl mb-1">⏳</p>
            <p className="text-white font-black text-sm">+{state.player.timeBoost}s</p>
            <p className="text-white/50 text-[10px] font-bold">时间</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
            <p className="text-2xl mb-1">🔥</p>
            <p className="text-white font-black text-sm">+{Math.round(state.player.comboBoost * 100)}%</p>
            <p className="text-white/50 text-[10px] font-bold">连击</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
            <p className="text-2xl mb-1">🏆</p>
            <p className="text-white font-black text-sm">{state.battlesWon}</p>
            <p className="text-white/50 text-[10px] font-bold">胜场</p>
          </div>
        </div>
        {/* Equipment */}
        <div className="bg-white rounded-2xl p-5 shadow-xl mb-4">
          <h3 className="font-black text-gray-800 mb-3 text-sm">🎒 装备栏 ({equippedItems.length})</h3>
          {equippedItems.length > 0 ? (
            <div className="grid grid-cols-5 gap-2">
              {equippedItems.map(item => (
                <div key={item.id} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-200">
                  <span className="text-2xl">{item.icon}</span>
                  <p className="text-[10px] font-bold text-gray-700 text-center leading-tight">{item.name}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm text-center py-3">还没有装备，去商店购买吧！</p>}
        </div>
        {/* Adventure Stats */}
        <div className="bg-white rounded-2xl p-5 shadow-xl mb-4">
          <h3 className="font-black text-gray-800 mb-3 text-sm">📊 冒险统计</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between p-2 bg-gray-50 rounded-lg"><span className="text-gray-500">总战斗</span><span className="font-bold text-gray-800">{state.totalBattles}</span></div>
            <div className="flex justify-between p-2 bg-gray-50 rounded-lg"><span className="text-gray-500">胜率</span><span className="font-bold text-green-600">{state.totalBattles > 0 ? Math.round((state.battlesWon / state.totalBattles) * 100) : 0}%</span></div>
            <div className="flex justify-between p-2 bg-gray-50 rounded-lg"><span className="text-gray-500">击败怪物</span><span className="font-bold text-purple-600">{state.defeatedMonsters.length}/12</span></div>
            <div className="flex justify-between p-2 bg-gray-50 rounded-lg"><span className="text-gray-500">学习单词</span><span className="font-bold text-blue-600">{state.wordsLearned.length}</span></div>
          </div>
        </div>
        <button onClick={() => dispatch({ type: 'CLOSE_STATUS' })} className="w-full py-3 bg-white/20 text-white font-black rounded-xl hover:bg-white/30 transition-all cursor-pointer">返回关卡</button>
      </div>
    </div>
  );
}

// ============ Monster Book Screen ============
function MonsterBookScreen({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<Action> }) {
  const defeated = state.defeatedMonsters;
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-500 to-orange-600 z-40 overflow-auto">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => dispatch({ type: 'CLOSE_MONSTER_BOOK' })} className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm font-bold hover:bg-white/30 transition-all cursor-pointer">返回</button>
          <h2 className="text-xl font-black text-white">📖 怪物图鉴</h2>
          <div className="w-16" />
        </div>
        <p className="text-white/70 text-sm mb-4 text-center">已击败 {defeated.length} / {monsters.length} 种怪物</p>
        <div className="space-y-3">
          {monsters.map(m => {
            const isDefeated = defeated.includes(m.id);
            return (
              <div key={m.id} className={`rounded-2xl p-4 shadow-xl transition-all ${isDefeated ? 'bg-white' : 'bg-white/40'}`}>
                <div className="flex items-center gap-3">
                  <img src={m.image} alt={m.nameCn} className={`w-16 h-16 object-contain ${isDefeated ? '' : 'opacity-30 grayscale'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-black text-sm ${isDefeated ? 'text-gray-800' : 'text-gray-500'}`}>{m.isBoss ? '👑 ' : ''}{isDefeated ? m.nameCn : '???'}</p>
                      {isDefeated && <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-bold">已击败</span>}
                    </div>
                    {isDefeated ? (
                      <>
                        <p className="text-gray-500 text-xs mt-0.5">{m.description}</p>
                        <div className="flex gap-3 mt-2 text-xs">
                          <span className="text-red-500 font-bold">❤️ {m.maxHp}</span>
                          <span className="text-orange-500 font-bold">⚔️ {m.attackDamage}</span>
                          <span className="text-blue-500 font-bold">✨ {m.baseXp} XP</span>
                          <span className="text-yellow-500 font-bold">🪙 {m.baseCoins}</span>
                        </div>
                      </>
                    ) : <p className="text-gray-400 text-xs mt-1">???????????</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={() => dispatch({ type: 'CLOSE_MONSTER_BOOK' })} className="w-full py-3 bg-white/20 text-white font-black rounded-xl hover:bg-white/30 transition-all mt-4 cursor-pointer">返回关卡</button>
      </div>
    </div>
  );
}

// ============ Pause / Backpack Screen ============
function PauseScreen({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<Action> }) {
  const consumables = state.shopInventory.filter(i => i.consumable && !i.purchased);
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-white rounded-3xl p-6 max-w-sm mx-4 shadow-2xl animate-scale-in max-h-[85vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black text-gray-800">⏸️ 暂停</h2>
          <button onClick={() => dispatch({ type: 'RESUME_BATTLE' })} className="px-4 py-1.5 bg-green-500 text-white text-sm font-bold rounded-lg hover:bg-green-400 transition-all cursor-pointer">继续</button>
        </div>
        {/* Player stats */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-200">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">等级</span><span className="font-black text-gray-800 ml-2">Lv.{state.player.level}</span></div>
            <div><span className="text-gray-500">HP</span><span className="font-black text-red-600 ml-2">{state.player.hp}/{state.player.maxHp}</span></div>
            <div><span className="text-gray-500">金币</span><span className="font-black text-yellow-600 ml-2">🪙{state.player.coins}</span></div>
            <div><span className="text-gray-500">XP</span><span className="font-black text-blue-600 ml-2">{state.player.xp}</span></div>
          </div>
          {/* Equipment stats */}
          <div className="mt-2 pt-2 border-t border-gray-200 text-xs space-y-1">
            {state.player.damageBoost > 0 && <div className="flex justify-between"><span className="text-gray-500">攻击加成</span><span className="font-bold text-red-600">+{Math.round(state.player.damageBoost * 100)}%</span></div>}
            {state.player.defenseBoost > 0 && <div className="flex justify-between"><span className="text-gray-500">防御加成</span><span className="font-bold text-blue-600">+{Math.round(state.player.defenseBoost * 100)}%</span></div>}
            {state.player.timeBoost > 0 && <div className="flex justify-between"><span className="text-gray-500">时间加成</span><span className="font-bold text-green-600">+{state.player.timeBoost}s</span></div>}
            {state.player.comboBoost > 0 && <div className="flex justify-between"><span className="text-gray-500">连击加成</span><span className="font-bold text-orange-600">+{Math.round(state.player.comboBoost * 100)}%</span></div>}
          </div>
        </div>
        {/* Backpack items */}
        <h3 className="text-sm font-bold text-gray-600 mb-2">🎒 背包道具</h3>
        {consumables.length > 0 ? (
          <div className="space-y-2 mb-4">
            {consumables.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border bg-gray-50 border-gray-200">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1 min-w-0"><p className="font-bold text-gray-800 text-sm">{item.name}</p><p className="text-gray-500 text-xs">{item.description}</p></div>
                <button onClick={() => dispatch({ type: 'USE_ITEM', payload: item.id })} className="px-3 py-1.5 bg-green-500 text-white rounded-lg font-bold text-xs hover:bg-green-400 transition-all cursor-pointer">使用</button>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-400 text-sm text-center mb-4">背包为空，去商店购买道具吧!</p>}
        <div className="flex gap-2">
          <button onClick={() => dispatch({ type: 'RESUME_BATTLE' })} className="flex-1 py-3 bg-green-500 text-white font-black rounded-xl hover:bg-green-400 transition-all cursor-pointer">继续战斗</button>
          <button onClick={() => { if (confirm('确定要逃跑吗？会扣除10HP！')) dispatch({ type: 'ESCAPE_BATTLE' }); }} className="flex-1 py-3 bg-red-500 text-white font-black rounded-xl hover:bg-red-400 transition-all cursor-pointer">逃跑 (-10HP)</button>
        </div>
      </div>
    </div>
  );
}

// ============ Free Challenge Leaderboard ============
function FreeLeaderboardScreen({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<Action> }) {
  const records = state.freeLeaderboard;
  const diffLabels: Record<string, string> = { letter: '字母', combo: '组合', word: '单词', phrase: '句子' };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 z-40 overflow-auto">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => dispatch({ type: 'CLOSE_FREE_LEADERBOARD' })} className="px-3 py-1.5 bg-white/20 text-white rounded-lg text-sm font-bold hover:bg-white/30 transition-all cursor-pointer">返回</button>
          <h2 className="text-xl font-black text-white">🏆 挑战排行榜</h2>
          <div className="w-16" />
        </div>

        {records.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="text-gray-400 text-lg">还没有挑战记录</p>
            <p className="text-gray-300 text-sm mt-2">完成一次自由挑战即可上榜!</p>
            <button onClick={() => dispatch({ type: 'CLOSE_FREE_LEADERBOARD' })} className="mt-4 px-5 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-400 cursor-pointer">去挑战</button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header */}
            <div className="bg-white/10 rounded-xl p-3 flex items-center text-white/70 text-xs font-bold">
              <span className="w-10 text-center">排名</span>
              <span className="flex-1">难度/成绩</span>
              <span className="w-16 text-center">正确数</span>
              <span className="w-14 text-center">连击</span>
              <span className="w-16 text-center text-right">分数</span>
            </div>
            {records.map((r, i) => (
              <div key={r.id} className={`rounded-xl p-3 flex items-center ${i < 3 ? 'bg-yellow-50 border border-yellow-200' : 'bg-white border border-gray-100'}`}>
                <span className={`w-10 text-center font-black text-lg ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-400' : 'text-gray-300'}`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">{diffLabels[r.difficulty] || r.difficulty}</span>
                    <span className="text-xs text-gray-400">{r.timeLimit}s</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{r.date}</p>
                </div>
                <span className="w-16 text-center font-bold text-green-600 text-sm">{r.correctCount}</span>
                <span className="w-14 text-center font-bold text-orange-500 text-sm">{r.maxCombo}x</span>
                <span className="w-16 text-right font-black text-purple-600 text-sm">{r.score}</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => dispatch({ type: 'CLOSE_FREE_LEADERBOARD' })} className="w-full py-3 bg-white/20 text-white font-black rounded-xl hover:bg-white/30 transition-all mt-6 cursor-pointer">返回结果</button>
      </div>
    </div>
  );
}

// ============ Free Challenge Mode ============
function FreeModeScreen({ state: _state, dispatch }: { state: GameState; dispatch: React.Dispatch<Action> }) {
  const [selectedDiff, setSelectedDiff] = useState('word');
  const [selectedTime, setSelectedTime] = useState(60);
  const difficulties = [
    { id: 'letter', name: '字母模式', desc: '单个字母 A-Z', reward: '1金币/词', icon: '🔤', color: 'from-green-400 to-green-600' },
    { id: 'combo', name: '组合模式', desc: '双字母组合 as, th', reward: '2金币/词', icon: '🔗', color: 'from-blue-400 to-blue-600' },
    { id: 'word', name: '单词模式', desc: '2-4字母单词', reward: '3金币/词', icon: '📖', color: 'from-orange-400 to-orange-600' },
    { id: 'phrase', name: '句子模式', desc: '完整短句', reward: '5金币/词', icon: '✍️', color: 'from-red-400 to-red-600' },
  ];
  const times = [30, 60, 90, 120];
  return (
    <div className="relative w-full h-screen overflow-auto" style={{ background: 'linear-gradient(to bottom, #1a1a2e 0%, #203a43 100%)' }}>
      <div className="relative z-10 flex flex-col items-center px-4 py-6">
        <div className="w-full max-w-md flex items-center justify-between mb-4">
          <BackButton onClick={() => dispatch({ type: 'GO_BACK' })} label="世界" />
          <h1 className="text-2xl font-black text-white">⚡ 自由挑战</h1>
          <div className="w-12" />
        </div>
        {/* Difficulty selection */}
        <div className="w-full max-w-md mb-6">
          <h2 className="text-white/60 text-sm font-bold mb-3">选择难度</h2>
          <div className="grid grid-cols-2 gap-3">
            {difficulties.map(d => (
              <button key={d.id} onClick={() => setSelectedDiff(d.id)}
                className={`p-4 rounded-2xl text-left transition-all cursor-pointer border-2 ${selectedDiff === d.id ? `bg-gradient-to-b ${d.color} border-white/50 shadow-lg scale-[1.02]` : 'bg-white/10 border-white/10 hover:bg-white/20'}`}>
                <span className="text-2xl">{d.icon}</span>
                <p className="text-white font-bold text-sm mt-1">{d.name}</p>
                <p className="text-white/50 text-xs">{d.desc}</p>
                <p className="text-yellow-300 text-xs font-bold mt-1">{d.reward}</p>
              </button>
            ))}
          </div>
        </div>
        {/* Time selection */}
        <div className="w-full max-w-md mb-6">
          <h2 className="text-white/60 text-sm font-bold mb-3">选择时长</h2>
          <div className="flex gap-3">
            {times.map(t => (
              <button key={t} onClick={() => setSelectedTime(t)}
                className={`flex-1 py-3 rounded-xl font-bold text-center transition-all cursor-pointer ${selectedTime === t ? 'bg-white text-gray-800 shadow-lg' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
                {t}秒
              </button>
            ))}
          </div>
        </div>
        {/* Start button */}
        <button onClick={() => dispatch({ type: 'START_FREE_PLAY', payload: { difficulty: selectedDiff, timeLimit: selectedTime } })}
          className="w-full max-w-md py-4 bg-gradient-to-b from-green-400 to-green-600 hover:from-green-300 hover:to-green-500 text-white text-xl font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer">
          开始挑战!
        </button>
        <button onClick={() => dispatch({ type: 'OPEN_FREE_LEADERBOARD' })}
          className="w-full max-w-md mt-3 py-3 bg-white/10 hover:bg-white/20 text-white/80 font-bold rounded-2xl border border-white/10 transition-all cursor-pointer">
          🏆 查看排行榜
        </button>
        <p className="text-white/30 text-xs mt-4">在限定时间内尽可能多地正确输入!</p>
      </div>
    </div>
  );
}

function FreePlayScreen({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<Action> }) {
  const fm = state.freeMode!;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextChar = fm.targetText[fm.playerInput.length] || '';

  useEffect(() => { if (fm.isRunning) { timerRef.current = setInterval(() => dispatch({ type: 'FREE_TICK' }), 100); return () => { if (timerRef.current) clearInterval(timerRef.current); }; } }, [fm.isRunning, dispatch]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!fm.isRunning) return;
      if (e.key === 'Backspace') { e.preventDefault(); dispatch({ type: 'FREE_BACKSPACE' }); return; }
      if (e.key.length === 1 && /[a-zA-Z ]/.test(e.key)) { e.preventDefault(); dispatch({ type: 'FREE_TYPE', payload: e.key }); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [fm.isRunning, fm.targetText, fm.playerInput, dispatch]);

  const renderText = () => fm.targetText.split('').map((ch, i) => {
    let cls = 'target-char-pending';
    if (i < fm.playerInput.length) cls = fm.playerInput[i]?.toLowerCase() === ch.toLowerCase() ? 'target-char-correct' : 'target-char-wrong';
    return <span key={i} className={cls} style={{ transition: 'all 0.15s ease' }}>{ch === ' ' ? '\u00A0' : ch}</span>;
  });

  const timerRatio = fm.timeLeft / fm.timeLimit;
  const isUrgent = timerRatio <= 0.2;
  const weakSet = useMemo(() => { const s = new Set<string>(); Object.entries(state.weakKeys).forEach(([k, c]) => { if (c >= 3) s.add(k); }); return s; }, [state.weakKeys]);

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: 'linear-gradient(to bottom, #FFF8E1 0%, #FFE0B2 50%, #FFCC80 100%)' }}>
      {/* Top HUD */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-black/20 backdrop-blur-sm">
        <div className={`text-4xl font-black tabular-nums ${isUrgent ? 'animate-timer-urgent' : 'text-orange-700'}`}>{Math.ceil(fm.timeLeft)}<span className="text-lg">s</span></div>
        <div className="flex items-center gap-3">
          <span className="bg-white/50 px-3 py-1 rounded-full text-sm font-bold text-gray-700">正确: {fm.correctCount}</span>
          {fm.combo > 1 && <span className="animate-combo-pop bg-orange-500 text-white px-3 py-1 rounded-full font-bold text-sm">🔥x{fm.combo}</span>}
        </div>
        <button onClick={() => dispatch({ type: 'END_FREE_PLAY' })} className="text-gray-500 hover:text-red-500 font-bold text-sm cursor-pointer">结束</button>
      </div>
      {/* Target text */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {fm.currentContent && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">{fm.currentContent.type === 'word' || fm.currentContent.type === 'phrase' ? '📖' : '⌨️'}</span>
            <span className="text-base font-bold text-gray-700">{fm.currentContent.meaningCn}</span>
            <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-px rounded-full">{fm.difficulty === 'letter' ? '字母' : fm.difficulty === 'combo' ? '组合' : fm.difficulty === 'word' ? '单词' : '句子'}</span>
          </div>
        )}
        <div className="text-center text-5xl md:text-6xl font-black font-mono tracking-widest mb-6">{renderText()}</div>
        <div className="w-full max-w-md h-3 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all" style={{ width: `${(fm.playerInput.length / Math.max(1, fm.targetText.length)) * 100}%` }} />
        </div>
      </div>
      {/* Keyboard */}
      <div className="relative z-10 bg-black/10 mt-2 px-4 pb-4 pt-2">
        <p className="text-center text-[10px] text-gray-500 mb-1">{weakSet.size > 0 ? `薄弱: ${[...weakSet].join(', ')}` : '键盘或点击输入'}</p>
        <div className="flex flex-col items-center gap-1">
          {keyboardLayout.map((row, ri) => (
            <div key={ri} className="flex gap-1" style={{ paddingLeft: ri === 1 ? '16px' : ri === 2 ? '32px' : '0' }}>
              {row.map(key => {
                const isT = key.toLowerCase() === nextChar.toLowerCase() && fm.isRunning;
                const isP = fm.playerInput.length > 0 && key.toLowerCase() === fm.playerInput[fm.playerInput.length - 1]?.toLowerCase();
                const isW = weakSet.has(key.toLowerCase());
                return <button key={key} onClick={() => { if (fm.isRunning) dispatch({ type: 'FREE_TYPE', payload: key.toLowerCase() }); }} className={`vk-key ${isT ? 'target' : ''} ${isP ? 'active' : ''} ${isW ? 'border-red-400 bg-red-50' : ''}`} disabled={!fm.isRunning}>{key}</button>;
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FreeResultScreen({ state: _state, dispatch }: { state: GameState; dispatch: React.Dispatch<Action> }) {
  const fm = _state.freeMode!;
  const totalReward = fm.correctCount * fm.rewards.coins;
  const totalXp = fm.correctCount * fm.rewards.xp;
  const diffLabel = fm.difficulty === 'letter' ? '字母' : fm.difficulty === 'combo' ? '组合' : fm.difficulty === 'word' ? '单词' : '句子';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-white rounded-3xl p-8 max-w-sm mx-4 shadow-2xl animate-slide-up">
        <div className="text-center mb-4"><span className="text-5xl">🏆</span><h2 className="text-3xl font-black text-green-600 mt-2">挑战结束!</h2></div>
        <div className="space-y-3 mb-6 bg-gray-50 rounded-xl p-4 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">难度</span><span className="font-black">{diffLabel}模式</span></div>
          <div className="flex justify-between"><span className="text-gray-500">正确数</span><span className="font-black text-green-600 text-lg">{fm.correctCount}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">最高连击</span><span className="font-black text-orange-600">{fm.maxCombo}x</span></div>
          <div className="flex justify-between"><span className="text-gray-500">输入字符</span><span className="font-black text-blue-600">{fm.totalChars}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">单词数</span><span className="font-black text-purple-600">{fm.wordCount}</span></div>
        </div>
        <div className="flex justify-center gap-3 mb-2">
          <div className="flex items-center gap-2 bg-yellow-50 rounded-xl px-5 py-3 border border-yellow-200"><span className="text-2xl">🪙</span><span className="font-black text-yellow-700 text-lg">+{totalReward}</span></div>
          <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-5 py-3 border border-blue-200"><span className="text-2xl">✨</span><span className="font-black text-blue-700 text-lg">+{totalXp}</span></div>
        </div>
        <p className="text-center text-xs text-gray-400 mb-5">{fm.rewardClaimed ? '奖励已到账' : '奖励结算中'}</p>
        <div className="flex gap-2 mb-2">
          <button onClick={() => dispatch({ type: 'SAVE_FREE_RECORD' })} disabled={fm.recordSaved} className={`flex-1 py-2 text-white font-bold rounded-lg transition-all text-sm ${fm.recordSaved ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-400 cursor-pointer'}`}>{fm.recordSaved ? '已保存' : '💾 保存记录'}</button>
          <button onClick={() => dispatch({ type: 'OPEN_FREE_LEADERBOARD' })} className="flex-1 py-2 bg-purple-500 text-white font-bold rounded-lg hover:bg-purple-400 transition-all cursor-pointer text-sm">🏆 排行榜</button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { dispatch({ type: 'CLOSE_FREE_MODE' }); }} className="flex-1 py-3 bg-gray-500 text-white font-black rounded-xl hover:bg-gray-400 transition-all cursor-pointer">返回</button>
          <button onClick={() => dispatch({ type: 'OPEN_FREE_MODE' })} className="flex-1 py-3 bg-gradient-to-b from-green-400 to-green-600 text-white font-black rounded-xl hover:from-green-300 hover:to-green-500 transition-all cursor-pointer">再来一次</button>
        </div>
      </div>
    </div>
  );
}

function ReportScreen({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<Action> }) {
  const pt = Math.round((Date.now() - state.startTime) / 1000);
  const min = Math.floor(pt / 60); const sec = pt % 60;
  const oa = state.totalInputs > 0 ? Math.round((state.totalCorrect / state.totalInputs) * 100) : 0;
  const wk = Object.entries(state.weakKeys).filter(([_, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const ts = Object.values(state.levelProgress).reduce((s, p) => s + p.stars, 0);
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-green-50 to-emerald-100 z-50 overflow-auto">
      <div className="max-w-lg mx-auto p-6">
        <div className="flex items-center justify-between mb-6"><BackButton onClick={() => dispatch({ type: 'GO_BACK' })} label="标题" /><h1 className="text-2xl font-black text-green-700">📊 冒险报告</h1><button onClick={() => dispatch({ type: 'OPEN_VOCAB' })} className="text-purple-600 text-sm font-bold hover:text-purple-500 cursor-pointer">📚 词汇</button></div>
        <div className="bg-white rounded-2xl p-5 shadow-lg mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-green-50 rounded-xl"><p className="text-xl font-black text-green-600">{min}:{sec.toString().padStart(2, '0')}</p><p className="text-xs text-gray-500">时长</p></div>
            <div className="text-center p-3 bg-blue-50 rounded-xl"><p className="text-xl font-black text-blue-600">{state.totalBattles}</p><p className="text-xs text-gray-500">战斗</p></div>
            <div className="text-center p-3 bg-orange-50 rounded-xl"><p className="text-xl font-black text-orange-600">{oa}%</p><p className="text-xs text-gray-500">正确率</p></div>
            <div className="text-center p-3 bg-yellow-50 rounded-xl"><p className="text-xl font-black text-yellow-600">{ts}⭐</p><p className="text-xs text-gray-500">星数</p></div>
          </div>
        </div>
        {state.wordsSeen.length > 0 && <div className="bg-white rounded-2xl p-5 shadow-lg mb-5"><h2 className="font-black text-gray-800 mb-3">📚 单词 ({state.wordsSeen.length})</h2><div className="flex flex-wrap gap-2">{state.wordsSeen.map(w => <div key={w} className={`rounded-xl px-3 py-1 border-2 ${state.wordsLearned.includes(w) ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200'}`}><span className={`font-bold text-sm ${state.wordsLearned.includes(w) ? 'text-gray-800' : 'text-gray-500'}`}>{w}</span></div>)}</div></div>}
        {wk.length > 0 && <div className="bg-white rounded-2xl p-5 shadow-lg mb-5"><h2 className="font-black text-gray-800 mb-3">🔤 薄弱键位</h2><div className="space-y-2">{wk.map(([k, c]) => <div key={k} className="flex items-center gap-2"><span className="w-8 h-8 bg-red-100 border-2 border-red-300 rounded-lg flex items-center justify-center font-black text-red-600 text-sm">{k.toUpperCase()}</span><div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min(100, (c / 10) * 100)}%` }} /></div><span className="text-xs font-bold text-red-500">{c}</span></div>)}</div></div>}
        <button onClick={() => dispatch({ type: 'RESTART_GAME' })} className="w-full py-4 bg-gradient-to-b from-green-400 to-green-600 text-white font-black rounded-xl shadow-lg hover:from-green-300 hover:to-green-500 transition-all cursor-pointer">再玩一次 ↺</button>
      </div>
    </div>
  );
}

// ============ Main App ============
export default function App() {
  const [state, dispatch] = useReducer(reducer, initState());
  useEffect(() => {
    if (state.screen === 'BATTLE_TRANSITION') { const t = setTimeout(() => dispatch({ type: 'END_TRANSITION' }), 800); return () => clearTimeout(t); }
  }, [state.screen]);
  // Auto-save game progress to the active save slot.
  useEffect(() => {
    if (!state.isLoggedIn || state.screen === 'LOGIN' || state.screen === 'TITLE' || state.screen === 'TUTORIAL') return;
    saveToSlot(state.currentSaveSlot, state);
  }, [state.player, state.currentSaveSlot, state.currentWorldId, state.wordsLearned, state.wordsSeen, state.totalBattles, state.battlesWon, state.defeatedMonsters, state.completedLevels, state.levelProgress, state.shopInventory, state.missions, state.freeLeaderboard, state.isLoggedIn]);
  const hStart = useCallback(() => dispatch({ type: 'START_GAME' }), []);
  const hCloseTut = useCallback(() => dispatch({ type: 'CLOSE_TUTORIAL' }), []);

  return (
    <div className="w-full h-screen overflow-hidden">
      {state.screen === 'LOGIN' && <SaveSlotScreen dispatch={dispatch} />}
      {state.screen === 'TITLE' && <TitleScreen state={state} onStart={hStart} dispatch={dispatch} />}
      {state.screen === 'TUTORIAL' && <TutorialOverlay onClose={hCloseTut} />}
      {state.screen === 'WORLD_SELECT' && <WorldSelectScreen state={state} dispatch={dispatch} />}
      {state.screen === 'LEVEL_SELECT' && <LevelSelectScreen state={state} dispatch={dispatch} />}
      {state.screen === 'BATTLE_TRANSITION' && state.battle && <BattleTransitionScreen monsterName={state.battle.monster.nameCn} isBoss={state.battle.monster.isBoss} />}
      {state.screen === 'WAVE_TRANSITION' && state.battle && <WaveTransitionScreen battle={state.battle} />}
      {state.screen === 'BATTLE' && state.battle && <BattleScreen state={state} dispatch={dispatch} />}
      {state.screen === 'PAUSED' && <PauseScreen state={state} dispatch={dispatch} />}
      {/* RESULT - battle result overlay */}
      {state.screen === 'RESULT' && state.battle && <ResultScreen state={state} dispatch={dispatch} />}
      {/* SHOP - standalone, no battle dependency */}
      {state.screen === 'SHOP' && <ShopScreen state={state} dispatch={dispatch} />}
      {state.screen === 'MISSIONS' && <MissionsScreen state={state} dispatch={dispatch} />}
      {state.screen === 'VOCAB' && <VocabScreen state={state} dispatch={dispatch} />}
      {state.screen === 'FREE_MODE' && <FreeModeScreen state={state} dispatch={dispatch} />}
      {state.screen === 'FREE_PLAY' && state.freeMode && <FreePlayScreen state={state} dispatch={dispatch} />}
      {state.screen === 'FREE_RESULT' && state.freeMode && <FreeResultScreen state={state} dispatch={dispatch} />}
      {state.screen === 'FREE_LEADERBOARD' && <FreeLeaderboardScreen state={state} dispatch={dispatch} />}
      {state.screen === 'REPORT' && <ReportScreen state={state} dispatch={dispatch} />}
      {state.screen === 'STATUS' && <StatusScreen state={state} dispatch={dispatch} />}
      {state.screen === 'MONSTER_BOOK' && <MonsterBookScreen state={state} dispatch={dispatch} />}
    </div>
  );
}
