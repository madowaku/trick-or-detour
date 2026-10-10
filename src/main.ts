import './fonts.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import './style.css';
import { Game, SIGN_COOLDOWN } from './engine';
import { STAGES, type KidType } from './stages';
import { loadSave, writeSave, unlocked } from './save';
import { Sound } from './audio';
import {
  icon,
  sprite,
  text,
  stars,
  boardStatic,
  signs,
  children,
  placements,
  items,
  effects,
} from './render';

const app = document.querySelector<HTMLDivElement>('#app')!;
const save = loadSave(),
  sound = new Sound();
let screen: 'title' | 'stages' | 'game' = 'title',
  game: Game | undefined,
  selectedTool: 'candy' | 'ghost' | null = null;
let modal: 'settings' | 'help' | null = null,
  eventIndex = 0,
  recorded = false,
  lastTime = 0,
  accumulator = 0;
let savedSuccessfully = true;
const GAME_SPEEDS = [0.7, 1] as const;
let speedIndex = 0; // Slower is the default; full-speed play is opt-in.
const t = (ja: string, en: string) => text(save.language, ja, en);
const persist = () => {
  savedSuccessfully = writeSave(save);
};
function updateSound() {
  sound.enabled = save.sound;
  sound.musicEnabled = save.music;
  if (game?.phase === 'paused' || document.hidden || !save.music) sound.stopMusic();
  else sound.startMusic();
}
const header = (back = false) =>
  `<header class="site-header"><button class="wordmark" data-action="home" aria-label="${t('タイトルへ', 'Title screen')}">${icon('moon')}<span>TRICK <i>OR</i> DETOUR<span class="wordmark-bang">!</span></span></button><div class="header-actions">${back ? `<button class="text-button back-button" data-action="stages">${icon('map')}<span>${t('ステージ', 'Stages')}</span></button>` : `<span class="edition">A LITTLE HALLOWEEN TALE</span>`}<button class="icon-button" data-action="sound" aria-label="${t('効果音の切り替え', 'Toggle sound')}">${icon(save.sound ? 'sound' : 'mute')}</button><button class="icon-button" data-action="settings" aria-label="${t('設定', 'Settings')}">${icon('settings')}</button></div></header>`;
function title() {
  const progress = save.stars.reduce((a, b) => a + b, 0);
  return `${header()}<main class="title-screen"><div class="title-scenery" role="img" aria-label="${t('月夜の森を歩く仮装した子供たちと魔女の家', 'Costumed children walking toward a witch’s cottage under a harvest moon')}"></div><div class="title-shade"></div><div class="title-content"><p class="eyebrow"><span></span> OCTOBER 31 · AFTER DARK</p><div class="title-ornament">${icon('star')} ${t('魔女の夜に、小さないたずら。', 'A little mischief in the moonlight.')} ${icon('star')}</div><h1><span class="title-first">トリック<span class="title-or">・オア・</span></span><span class="title-second">みちしるべ</span></h1><div class="english-title"><span></span> TRICK OR DETOUR! <span></span></div><p class="title-description">${t('お菓子のうわさに、子供たちがやってきた。<br>看板をくるっと。今夜はちょっと、遠回り。', 'The children heard a rumor about your candy.<br>Turn a sign. Take them on a little detour.')}</p><nav class="title-menu"><button class="primary-button play-button" data-action="play">${icon('play')}<span>${t(progress ? 'つづきから' : 'はじめる', progress ? 'Continue' : 'Let’s play')}<small>${t('魔女の静かな夜を守ろう', 'Keep your cozy night')}</small></span>${icon('arrow')}</button><button class="secondary-button" data-action="stages">${icon('map')}${t('ステージをえらぶ', 'Choose a stage')}<span class="menu-progress">${Math.floor(progress)}/30 ${icon('star', 'filled')}</span></button><a class="route-v02-link" href="${import.meta.env.BASE_URL}route-v02.html">🌀 ${t('NEW まよい森ルートディフェンス v0.2', 'NEW Winding Forest v0.2')}</a><button class="quiet-button" data-action="help">${icon('info')}${t('あそびかた', 'How to play')}</button></nav><div class="title-footnote">${icon('leaf')} ${t('看板を回すだけ。あとは、子供たちにおまかせ。', 'Just turn the signs. The children do the rest.')}</div></div><div class="scene-caption"><span>THE WITCH’S WOODS</span><p>${t('お菓子はあるけど、今夜はひみつ。', 'Plenty of candy. A well-kept secret.')}</p></div><footer class="title-footer"><span>${t('ひと晩、10の小さないたずら', 'One night. Ten little tricks.')}</span><span>STORYBOOK STRATEGY <span class="footer-dot">·</span> v0.1</span></footer></main>`;
}
function stagesScreen() {
  const open = unlocked(save);
  return `${header()}<main class="stage-screen"><div class="page-heading"><button class="text-button" data-action="home">${icon('back')}${t('もどる', 'Back')}</button><p class="eyebrow">A NIGHT OF LITTLE DETOURS</p><h1>${t('今夜の、みちしるべ。', 'Tonight’s little detours.')}</h1><p>${t('森の奥へ進むほど、いたずらはにぎやかに。', 'The deeper the woods, the livelier the mischief.')}</p></div><div class="stage-grid">${STAGES.map(
    (stage) => {
      const locked = stage.id > open,
        record = save.stars[stage.id - 1];
      return `<button class="stage-card ${locked ? 'locked' : ''} ${record ? 'completed' : ''}" data-stage="${stage.id}" ${locked ? 'disabled' : ''}><div class="stage-card-top"><span class="stage-number">${String(stage.id).padStart(2, '0')}</span><span>${locked ? icon('lock') : record ? icon('check') : icon('arrow')}</span></div><div class="stage-map-drawing">${stage.map.id === 'C' ? '┬<br> ┤' : stage.map.id === 'B' ? '┬' : '┤'}</div><h2>${stage.title[save.language === 'ja' ? 0 : 1]}</h2><p>${stage.kids.length}${t('人のお客さま', ' visitors')} · ${t('看板', 'Signs')} ${Object.keys(stage.map.nodes).filter((id) => stage.map.nodes[id].choices).length}</p><div class="stage-stars">${stars(record)}</div>${stage.id === open && !record ? `<span class="new-label">${t('次のおはなし', 'Up next')}</span>` : ''}</button>`;
    },
  ).join(
    '',
  )}</div><p class="stage-bottom">${icon('star', 'filled')} ${save.stars.reduce((a, b) => a + b, 0)} / 30 <span>${t('集めた星は、このブラウザに保存されます', 'Your stars are saved in this browser')}</span></p></main>`;
}
function cast() {
  const names: Record<KidType, [string, string]> = {
    normal: ['ふつうの子', 'Trusting kid'],
    sweet: ['おやつ好き', 'Sweet tooth'],
    prank: ['いたずらっ子', 'Prankster'],
  };
  return (['normal', 'sweet', 'prank'] as KidType[])
    .filter((type) => game!.stage.kids.includes(type))
    .map(
      (type, i) =>
        `<div class="cast-member">${sprite(type === 'normal' ? 0 : type === 'sweet' ? 1 : 2, '', 58)}<span><b>${names[type][save.language === 'ja' ? 0 : 1]}</b><small>${type === 'normal' ? t('看板どおりに進む', 'Follows the signs') : type === 'sweet' ? t('お菓子を優先する', 'Follows the candy') : t('看板を回して進む', 'Turns the signs')}</small></span><em>×${game!.stage.kids.filter((k) => k === type).length}</em></div>`,
    )
    .join('');
}
function gameScreen() {
  const stage = game!.stage;
  return `${header(true)}<main class="game-screen"><aside class="game-sidebar"><button class="text-button" data-action="stages">${icon('back')}${t('ステージ一覧', 'All stages')}</button><p class="eyebrow">IN THE WITCH’S WOODS</p><div class="stage-heading"><span>STAGE ${String(stage.id).padStart(2, '0')}</span><h1>${stage.title[save.language === 'ja' ? 0 : 1]}</h1></div><p class="stage-hint">${stage.hint[save.language === 'ja' ? 0 : 1]}</p><div class="goal-note">${icon('home')}<span>${t('家への到達', 'Visitors allowed')}<b>${stage.allowance}${t('人まで', ' or fewer')}</b></span></div><div class="cast-list"><p class="small-label">${t('今夜のお客さま', 'TONIGHT’S VISITORS')}</p>${cast()}</div><div class="witch-note">${sprite(4, '', 40)}<p>${t('倒さず、迷わせる。<br>やさしいいたずらの時間です。', 'A little lost, a little startled.<br>No one gets hurt tonight.')}</p></div><button class="quiet-button sidebar-help" data-action="help">${icon('info')}${t('あそびかた', 'How to play')}</button></aside><section class="play-area"><div class="mobile-stage-heading"><span>STAGE ${String(stage.id).padStart(2, '0')}</span><b>${stage.title[save.language === 'ja' ? 0 : 1]}</b></div><div class="game-hud"><div>${icon('ghost')}<span>${t('あと', 'LEFT')}<b id="remaining">${stage.kids.length}</b></span></div><div>${icon('check')}<span>${t('帰宅', 'HOME')}<b id="returned">0</b></span></div><div class="arrival-stat">${icon('home')}<span>${t('到達', 'ARRIVED')}<b id="arrived">0<small> / ${stage.allowance}</small></b></span></div><button class="icon-button" data-action="pause" aria-label="${t('ポーズ', 'Pause')}">${icon('pause')}</button></div><div class="board-frame ${stage.id <= 3 ? 'chapter-moonlight' : stage.id <= 6 ? 'chapter-candywood' : stage.id <= 9 ? 'chapter-mistwood' : 'chapter-pumpkin'}"><div class="board-top-label">${icon('moon')} THE WITCH’S WOODS ${icon('star')}</div>${boardStatic(game!, save.language)}<div id="board-overlay"></div>${stage.id === 10 ? `<div class="pumpkin-king">${sprite(5, '', 72)}<span>♛</span><i class="bat">⌁</i></div>` : ''}</div><div class="tool-caption" id="tool-caption"></div><div class="game-tools"><button class="tool-button" data-tool="candy">${icon('candy')}<span>${t('お菓子', 'Candy')}<small id="candy-count">${stage.candy}</small></span></button><button class="tool-button" data-tool="ghost">${icon('ghost')}<span>${t('おばけ', 'Ghost')}<small id="ghost-count">${stage.ghosts}</small></span></button><button class="tool-button restart-button" data-action="restart">${icon('restart')}<span>${t('やりなおす', 'Restart')}</span></button></div><div class="play-bottom"><span>${t('看板はタップで即回転', 'Tap a sign for a quick turn')}</span><button type="button" class="speed-button" data-action="speed" aria-label="${t('ゲームの速度を変える', 'Change game speed')}">${t('速度', 'Speed')} ×${GAME_SPEEDS[speedIndex]}</button></div></section></main>`;
}
function readyOverlay() {
  return `<div class="ready-note"><p>${t('まずは、看板の向きを決めよう。', 'Set your signs before the visitors arrive.')}</p><small>${game!.stage.hint[save.language === 'ja' ? 0 : 1]}</small><button class="primary-button" data-action="start">${icon('play')}${t('森へご案内！', 'Let them in!')}</button></div><span class="prep-label">${t('準備中 · 看板は自由に回せるよ', 'PREPARATION · Turn signs freely')}</span>`;
}
function resultOverlay() {
  const won = game!.phase === 'won',
    last = game!.stage.id === 10;
  return `<div class="board-curtain"><div class="result-card"><p class="eyebrow">${won ? 'A PERFECT LITTLE TRICK' : 'ONE MORE LITTLE TRICK'}</p><div class="result-mascot">${sprite(won ? 4 : 5, '', 90)}</div><h2>${won ? t('みんな帰っちゃった！', 'A quiet night again!') : t('お菓子が足りなーい！', 'That’s too much candy!')}</h2><p>${won ? t(last ? '10のおはなし、ぜんぶクリア！' : '魔女の夜は、もう少し続きます。', last ? 'All ten tales complete!' : 'The witch’s night goes on.') : t('看板の向きを見直して、もう一度。', 'Rethink your signs and try again.')}</p><div class="result-stars">${stars(game!.stars)}</div><div class="result-counts"><span>${t('帰宅', 'Sent home')}<b>${game!.returned}</b></span><span>${t('到達', 'Visitors')}<b>${game!.arrived}</b></span></div>${!savedSuccessfully ? `<p class="save-notice">${t('記録を保存できませんでした。この画面では続けて遊べます。', 'Could not save your record. You can keep playing here.')}</p>` : ''}<button class="primary-button" data-action="${won ? (last ? 'stages' : 'next') : 'restart'}">${icon(won ? 'arrow' : 'restart')}${won ? (last ? t('ステージ一覧へ', 'All stages') : t('次のおはなし', 'Next little tale')) : t('もういちど', 'Try again')}</button>${won ? `<button class="quiet-button" data-action="restart">${icon('restart')}${t('もういちど遊ぶ', 'Play again')}</button>` : `<button class="quiet-button" data-action="stages">${t('ステージ一覧へ', 'All stages')}</button>`}</div></div>`;
}
function pausedOverlay() {
  return `<div class="board-curtain"><div class="pause-card">${icon('moon')}<p class="eyebrow">A LITTLE BREATHER</p><h2>${t('ひとやすみ。', 'A little breather.')}</h2><p>${t('森の時間は、止まっています。', 'Time has stopped in the woods.')}</p><button class="primary-button" data-action="pause">${icon('play')}${t('つづける', 'Continue')}</button><button class="quiet-button" data-action="restart">${icon('restart')}${t('はじめから', 'Restart')}</button></div></div>`;
}
function showModal() {
  document.querySelector('#modal-root')?.remove();
  if (!modal) return;
  const content =
    modal === 'settings'
      ? `<p class="eyebrow">MAKE YOURSELF AT HOME</p><h2>${t('せってい', 'Settings')}</h2><label class="settings-row"><span>${t('ことば', 'Language')}</span><select id="language" aria-label="${t('ことば', 'Language')}"><option value="ja" ${save.language === 'ja' ? 'selected' : ''}>日本語</option><option value="en" ${save.language === 'en' ? 'selected' : ''}>English</option></select></label>${(['sound', 'music', 'reducedMotion'] as const).map((key) => `<label class="settings-row"><span>${key === 'sound' ? t('効果音', 'Sound effects') : key === 'music' ? t('森の音楽', 'Forest music') : t('演出をひかえめに', 'Reduce motion')}</span><input type="checkbox" data-setting="${key}" ${save[key] ? 'checked' : ''}/></label>`).join('')}<p class="settings-footnote">${t('星の記録は自動で保存されます。', 'Your stars are saved automatically.')}</p><button class="quiet-button" data-action="credits">${t('素材とクレジット', 'Assets & credits')}</button>`
      : `<p class="eyebrow">THE ART OF A LITTLE DETOUR</p><h2>${t('あそびかた', 'How to play')}</h2><div class="help-steps"><div><span>01</span>${icon('arrow')}<p><b>${t('看板をくるっと', 'Give the sign a turn')}</b>${t('タップで向きを変えて、子供を行き止まりへ。看板を読んだあとの変更は間に合わないよ。', 'Tap to point kids toward dead ends. Once a kid reads a sign, that path is decided.')}</p></div><div><span>02</span>${icon('map')}<p><b>${t('違う道へ、もう一度', 'A different detour')}</b>${t('足元の丸が迷い値。いっぱいになると帰宅。同じ行き止まりは覚えているよ。', 'Dots show confusion. Fill them to send a kid home. They remember each dead end.')}</p></div><div><span>03</span>${icon('candy')}<p><b>${t('こっそり、おてつだい', 'A little extra help')}</b>${t('お菓子は紫の子だけを誘惑。おばけは1人を驚かせて引き返させる。緑の子は看板を勝手に回す！', 'Candy attracts purple kids. Ghosts startle one kid and send them back a step. Green kids turn signs!')}</p></div></div><p class="help-keyboard">${t('キーボード：1・2で看板、スペースで開始／ポーズ。', 'Keyboard: 1 / 2 turns signs. Space starts or pauses.')}</p>`;
  app.insertAdjacentHTML(
    'beforeend',
    `<div id="modal-root" class="modal-backdrop"><section class="modal-card" role="dialog" aria-modal="true" aria-label="${modal === 'settings' ? t('設定', 'Settings') : t('あそびかた', 'How to play')}"><button class="icon-button modal-close" data-action="close" aria-label="${t('閉じる', 'Close')}">${icon('close')}</button>${content}</section></div>`,
  );
  document.querySelector<HTMLButtonElement>('.modal-close')?.focus();
}
function render() {
  app.innerHTML =
    screen === 'title' ? title() : screen === 'stages' ? stagesScreen() : gameScreen();
  document.documentElement.lang = save.language;
  document.body.classList.toggle('reduced-motion', save.reducedMotion);
  document.body.dataset.screen = screen;
  if (screen === 'game') drawGame();
  showModal();
}
function drawGame() {
  if (!game || screen !== 'game') return;
  const set = (id: string, html: string) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  };
  set('children', children(game, save.language));
  set('sparkles', effects(game));
  // Keep focused, keyboard-operable signs mounted between frames.
  const signLayer = document.getElementById('signs')!;
  const current = game;
  const signature = JSON.stringify([
    game.signs,
    game.phase,
    Object.keys(game.signs).map((id) => current.tick - current.lastTurn[id] < SIGN_COOLDOWN),
  ]);
  if (signLayer.dataset.signature !== signature) {
    const focusId = document.activeElement?.getAttribute('data-node');
    signLayer.innerHTML = signs(game, save.language);
    signLayer.dataset.signature = signature;
    if (focusId) signLayer.querySelector<SVGElement>(`[data-node="${focusId}"]`)?.focus();
  }
  const itemSignature = JSON.stringify([
    [...game.candy],
    [...game.ghosts],
    selectedTool,
    save.language,
  ]);
  const itemLayer = document.getElementById('placed-items')!;
  if (itemLayer.dataset.signature !== itemSignature) {
    set('placed-items', items(game));
    set('placement-points', placements(game, selectedTool, save.language));
    itemLayer.dataset.signature = itemSignature;
  }
  set('remaining', String(game.unresolved));
  set('returned', String(game.returned));
  set('arrived', `${game.arrived}<small> / ${game.stage.allowance}</small>`);
  set('candy-count', String(game.candyLeft));
  set('ghost-count', String(game.ghostsLeft));
  for (const tool of ['candy', 'ghost'] as const) {
    const button = document.querySelector<HTMLButtonElement>(`[data-tool="${tool}"]`)!;
    button.classList.toggle('selected', selectedTool === tool);
    button.disabled =
      (tool === 'candy' ? game.candyLeft : game.ghostsLeft) === 0 ||
      !['ready', 'playing'].includes(game.phase);
  }
  set(
    'tool-caption',
    selectedTool
      ? t(
          '光る場所をタップで配置。もう一度ボタンでキャンセル。',
          'Tap a glowing spot to place. Tap the tool again to cancel.',
        )
      : game.phase === 'ready'
        ? t('準備ができたら、子供たちを迎えよう。', 'Welcome the visitors when you’re ready.')
        : game.stage.hint[save.language === 'ja' ? 0 : 1],
  );
  const overlay = document.getElementById('board-overlay')!;
  if (overlay.dataset.phase !== game.phase) {
    overlay.innerHTML =
      game.phase === 'ready'
        ? readyOverlay()
        : game.phase === 'paused'
          ? pausedOverlay()
          : ['won', 'lost'].includes(game.phase)
            ? resultOverlay()
            : '';
    overlay.dataset.phase = game.phase;
  }
  if ((game.phase === 'won' || game.phase === 'lost') && !recorded) {
    recorded = true;
    if (game.phase === 'won') {
      save.stars[game.stage.id - 1] = Math.max(save.stars[game.stage.id - 1], game.stars);
      persist();
      overlay.innerHTML = resultOverlay();
    }
    selectedTool = null;
    updateSound();
  }
  if (
    game.phase === 'playing' &&
    selectedTool &&
    (selectedTool === 'candy' ? game.candyLeft : game.ghostsLeft) === 0
  )
    selectedTool = null;
}
function begin(id: number) {
  game = new Game(STAGES[id - 1]);
  screen = 'game';
  selectedTool = null;
  eventIndex = 0;
  recorded = false;
  accumulator = 0;
  render();
  updateSound();
}
function openModal(type: 'settings' | 'help') {
  if (game?.phase === 'playing') {
    game.pause();
    updateSound();
    drawGame();
  }
  modal = type;
  showModal();
}
function handleAction(action: string) {
  sound.unlock();
  updateSound();
  switch (action) {
    case 'home':
      screen = 'title';
      game = undefined;
      modal = null;
      render();
      break;
    case 'play':
      begin(unlocked(save));
      break;
    case 'stages':
      screen = 'stages';
      game = undefined;
      modal = null;
      render();
      break;
    case 'start':
      game?.start();
      accumulator = 0;
      drawGame();
      break;
    case 'pause':
      if (game?.phase === 'ready') game.start();
      else game?.pause();
      selectedTool = null;
      accumulator = 0;
      updateSound();
      drawGame();
      break;
    case 'speed':
      speedIndex = (speedIndex + 1) % GAME_SPEEDS.length;
      document.querySelector<HTMLButtonElement>('.speed-button')!.textContent =
        `${t('速度', 'Speed')} ×${GAME_SPEEDS[speedIndex]}`;
      accumulator = 0;
      break;
    case 'restart':
      if (game) begin(game.stage.id);
      break;
    case 'next':
      if (game) begin(Math.min(10, game.stage.id + 1));
      break;
    case 'sound':
      save.sound = !save.sound;
      persist();
      updateSound();
      render();
      break;
    case 'settings':
      openModal('settings');
      break;
    case 'help':
      openModal('help');
      break;
    case 'close':
      modal = null;
      showModal();
      document.querySelector<HTMLButtonElement>('[data-action="settings"]')?.focus();
      break;
    case 'credits':
      showCredits();
      break;
  }
}
function showCredits() {
  const card = document.querySelector('.modal-card')!;
  card.innerHTML = `<button class="icon-button modal-close" data-action="close" aria-label="${t('閉じる', 'Close')}">${icon('close')}</button><p class="eyebrow">MADE FOR THIS LITTLE FOREST</p><h2>${t('素材とクレジット', 'Assets & credits')}</h2><p class="credits-text">${t('森の背景・子供たち・魔女の家：OpenAI ImageGenで本作向けに生成。<br><br>音楽・効果音：本作オリジナルの合成音。<br><br>フォント：Zen Maru Gothic / Cormorant Garamond（SIL Open Font License 1.1）。<br><br>購入素材は使用していません。詳しくはリポジトリの ASSETS.md をご覧ください。', 'Forest art, children & cottage: generated for this game with OpenAI ImageGen.<br><br>Music & sounds: original synthesized audio.<br><br>Fonts: Zen Maru Gothic / Cormorant Garamond (SIL Open Font License 1.1).<br><br>No purchased game assets. See ASSETS.md for provenance.')}</p>`;
}
app.addEventListener('click', (event) => {
  const target = (event.target as Element).closest<HTMLElement>(
    '[data-action],[data-stage],[data-tool],[data-node],[data-place]',
  );
  if (!target || target.matches(':disabled') || target.getAttribute('aria-disabled') === 'true')
    return;
  if (target.dataset.action) {
    handleAction(target.dataset.action);
    return;
  }
  sound.unlock();
  updateSound();
  if (target.dataset.stage) begin(Number(target.dataset.stage));
  else if (target.dataset.tool) {
    selectedTool =
      selectedTool === target.dataset.tool ? null : (target.dataset.tool as 'candy' | 'ghost');
    drawGame();
  } else if (target.dataset.place && game && selectedTool) {
    if (game.place(selectedTool, target.dataset.place)) {
      selectedTool = null;
      drawGame();
    }
  } else if (target.dataset.node && !selectedTool) {
    game?.turn(target.dataset.node);
    drawGame();
  }
});
app.addEventListener('change', (event) => {
  const target = event.target as HTMLInputElement;
  if (target.id === 'language') {
    save.language = target.value === 'en' ? 'en' : 'ja';
    persist();
    render();
  } else if (target.dataset.setting) {
    const key = target.dataset.setting as 'sound' | 'music' | 'reducedMotion';
    save[key] = target.checked;
    persist();
    updateSound();
    document.body.classList.toggle('reduced-motion', save.reducedMotion);
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (modal) {
      modal = null;
      showModal();
    } else if (selectedTool) {
      selectedTool = null;
      drawGame();
    } else if (game && ['playing', 'paused'].includes(game.phase)) handleAction('pause');
    return;
  }
  if (modal || (event.target as Element).matches('input,select,textarea')) return;
  if (
    (event.key === 'Enter' || event.key === ' ') &&
    (event.target as Element).matches('[data-node],[data-place]')
  ) {
    event.preventDefault();
    (event.target as SVGElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return;
  }
  if (game && screen === 'game') {
    if (event.code === 'Space' && !(event.target as Element).closest('button')) {
      event.preventDefault();
      handleAction('pause');
    }
    if (event.key === '1' || event.key === '2') {
      const id = Object.keys(game.signs)[Number(event.key) - 1];
      if (id) {
        game.turn(id);
        drawGame();
      }
    }
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game?.phase === 'playing') {
    game.pause();
    selectedTool = null;
    drawGame();
  }
  accumulator = 0;
  lastTime = 0;
  updateSound();
});
// Trap modal keyboard focus, keeping native controls usable with keyboard input.
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab' || !modal) return;
  const focusable = Array.from(
    document.querySelectorAll<HTMLElement>(
      '.modal-card button,.modal-card select,.modal-card input',
    ),
  );
  const first = focusable[0],
    last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
});
function frame(now: number) {
  const delta = lastTime ? Math.min(250, now - lastTime) : 0;
  lastTime = now;
  if (game?.phase === 'playing') {
    accumulator += delta * GAME_SPEEDS[speedIndex];
    while (accumulator >= 1000 / 60 && game.phase === 'playing') {
      game.step();
      accumulator -= 1000 / 60;
    }
  } else accumulator = 0;
  if (game && screen === 'game') {
    while (eventIndex < game.events.length) sound.effect(game.events[eventIndex++].kind);
    drawGame();
  }
  requestAnimationFrame(frame);
}
render();
requestAnimationFrame(frame);
