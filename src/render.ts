import { EDGE_TICKS, SIGN_COOLDOWN, type Game, type Kid } from './engine';
import type { MapNode } from './stages';
import type { Language } from './save';
const root = import.meta.env.BASE_URL;
export const asset = (name: string) => `${root}assets/${name}`;
export const text = (language: Language, ja: string, en: string) => (language === 'ja' ? ja : en);
export function sprite(index: number, className = '', size = 100): string {
  return `<svg class="sprite ${className}" width="${size}" height="${size}" viewBox="0 0 512 512" aria-hidden="true"><image href="${asset('halloween-atlas-v2.webp')}" x="${-(index % 3) * 512}" y="${-Math.floor(index / 3) * 512}" width="1536" height="1024"/></svg>`;
}
const icons: Record<string, string> = {
  play: '<path d="m9 5 12 7-12 7z"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zm6-3v15m6-12v15"/>',
  settings:
    '<path d="m10 3-1 3-3 1-3 3 2 2-1 3 3 3 3-1 2 3 3-2 3 1 3-3-1-3 2-2-3-3-3-1-1-3z"/><circle cx="12" cy="12" r="3"/>',
  sound: '<path d="m4 9 4 0 5-4v14l-5-4H4zM17 8q5 4 0 8m2-11q8 7 0 14"/>',
  mute: '<path d="m4 9 4 0 5-4v14l-5-4H4zM17 9l5 6m0-6-5 6"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  restart: '<path d="M5 9a8 8 0 1 1 0 7M5 3v6h6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  moon: '<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11z"/>',
  star: '<path d="m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3L12 17.4l-5.6 3 1.1-6.3L3 9.6l6.2-.9z"/>',
  candy: '<path d="m3 6 5 1 8 10 5 1-2-6-3-5L8 7 3 6l2 6 3 5 8 0 5 1M9 9l6 6m-7-3 4 4"/>',
  ghost: '<path d="M5 20v-9a7 7 0 0 1 14 0v9l-4-2-3 2-3-2z"/><path d="M9 10v2m6-2v2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  home: '<path d="m3 11 9-8 9 8M6 9v12h12V9m-8 12v-7h4v7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-11v1"/>',
  leaf: '<path d="M20 3Q2 1 4 16q13 8 16-13ZM3 21 15 9"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
};
export const icon = (name: string, className = '') =>
  `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] ?? icons.star}</svg>`;
export const stars = (count: number, total = 3) =>
  Array.from({ length: total }, (_, i) => icon('star', i < count ? 'star filled' : 'star')).join(
    '',
  );
function curve(a: MapNode, b: MapNode) {
  return {
    x: (a.x + b.x) / 2 + (Math.abs(a.x - b.x) < 30 ? 18 : 0),
    y: (a.y + b.y) / 2 + (Math.abs(a.x - b.x) > 30 ? 16 : 0),
  };
}
export function position(game: Game, kid: Kid) {
  if (kid.state === 'waiting') return game.stage.map.nodes[kid.to];
  let a = game.stage.map.nodes[kid.from],
    b = game.stage.map.nodes[kid.to],
    t = 1 - kid.remaining / EDGE_TICKS;
  if (a.id > b.id) {
    [a, b] = [b, a];
    t = 1 - t;
  }
  const c = curve(a, b);
  return {
    x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
    y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
  };
}
export function boardStatic(game: Game, language: Language) {
  const nodes = game.stage.map.nodes;
  const edges: string[] = [];
  for (const a of Object.values(nodes))
    for (const id of a.links)
      if (a.id < id) {
        const b = nodes[id],
          c = curve(a, b);
        edges.push(`M${a.x} ${a.y}Q${c.x} ${c.y} ${b.x} ${b.y}`);
      }
  const path = edges.join(' ');
  return `<svg id="forest-map" viewBox="0 0 500 610" aria-label="${text(language, 'ハロウィンの森の地図', 'Halloween forest map')}">
    <defs><linearGradient id="road" x2="0" y2="1"><stop stop-color="#d9bd88"/><stop offset="1" stop-color="#b89460"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="7"/></filter><pattern id="stones" width="26" height="22" patternUnits="userSpaceOnUse"><path d="M3 5h10m5 10h8" stroke="#806546" stroke-width="2" opacity=".25"/></pattern></defs>
    <path d="${path}" class="road-shadow"/><path d="${path}" class="road-edge"/><path d="${path}" class="road"/><path d="${path}" class="road-stones"/>
    ${Object.values(nodes)
      .map((node) => {
        if (node.kind === 'home')
          return `<g transform="translate(${node.x - 74} ${node.y - 99})">${sprite(3, 'cottage', 148)}</g><text x="${node.x}" y="${node.y + 52}" class="map-label home-label">${text(language, '魔女のおうち', 'Witch’s cottage')}</text>`;
        if (node.kind === 'gate')
          return `<g transform="translate(${node.x} ${node.y})"><path d="M-48 8v-25m96 25v-25M-49-10q49-23 98 0" class="gate"/><circle r="32" fill="#172f28" stroke="#819061" stroke-width="1"/><path d="M0 12v-23m-8 8 8-8 8 8" stroke="#ffe1a1" stroke-width="3" fill="none"/><text y="54" class="map-label">${text(language, '森の入口', 'Forest entrance')}</text></g>`;
        if (node.kind === 'deadend')
          return `<g transform="translate(${node.x} ${node.y})"><ellipse cy="7" rx="36" ry="21" fill="#10231d" opacity=".65"/><g transform="translate(-31 -38)">${sprite(5, '', 62)}</g><text y="43" class="map-label deadend-label">${text(language, '行き止まり', 'Dead end')}</text></g>`;
        return `<circle cx="${node.x}" cy="${node.y}" r="26" fill="#d5b27c"/>`;
      })
      .join('')}
    <g id="placed-items"></g><g id="children"></g><g id="signs"></g><g id="placement-points"></g><g id="sparkles"></g>
  </svg>`;
}
export function signs(game: Game, language: Language) {
  return Object.keys(game.signs)
    .map((id) => {
      const node = game.stage.map.nodes[id],
        target = game.stage.map.nodes[node.choices![game.signs[id]]];
      const angle = (Math.atan2(target.y - node.y, target.x - node.x) * 180) / Math.PI;
      const previous =
        game.stage.map.nodes[
          node.choices![(game.signs[id] - 1 + node.choices!.length) % node.choices!.length]
        ];
      const previousAngle = (Math.atan2(previous.y - node.y, previous.x - node.x) * 180) / Math.PI;
      const clockwiseAngle = previousAngle + ((angle - previousAngle + 360) % 360);
      const recent = game.rotatedAt[id] >= 0 && game.tick - game.rotatedAt[id] < 12;
      const destination =
        target.kind === 'deadend'
          ? text(language, '行き止まり', 'dead end')
          : target.kind === 'home'
            ? text(language, '魔女の家', 'cottage')
            : text(language, '奥の分岐', 'next junction');
      const cooling = game.phase === 'playing' && game.tick - game.lastTurn[id] < SIGN_COOLDOWN;
      return `<g class="sign-button ${cooling ? 'cooling' : ''}" data-node="${id}" role="button" tabindex="0" aria-label="${text(language, '看板', 'Sign')} ${id}: ${destination}" aria-disabled="${!['ready', 'playing'].includes(game.phase)}" transform="translate(${node.x} ${node.y - 8})"><circle r="39" class="sign-halo"/><rect x="-5" y="-4" width="10" height="41" rx="3" fill="#836040" stroke="#493624" stroke-width="2"/><g class="arrow-plank ${recent ? 'turning' : ''}" style="--from:${previousAngle}deg;--to:${clockwiseAngle}deg;transform:rotate(${clockwiseAngle}deg)"><path d="M-32-17H13L36 0 13 17h-45Z" fill="#ebbd75" stroke="#654328" stroke-width="3"/><path d="M-25-12H11L28 0 11 12h-36" fill="none" stroke="#ffdc98" stroke-width="1.5"/><path d="M-20-4H9v-6L23 0 9 10V4h-29Z" fill="#704328"/><path d="M-27 9h14M-24-8h9" stroke="#b37c47" stroke-width="1"/></g><circle cx="0" cy="0" r="3" fill="#efdbaf"/><circle r="39" fill="transparent"/></g>`;
    })
    .join('');
}
const messages: Record<string, [string, string]> = {
  lost: ['あれ？', 'Huh?'],
  remember: ['さっき行った！', 'Been there!'],
  prank: ['こっちにしよ！', 'This way!'],
  candy: ['おやつ♪', 'Yummy!'],
  boo: ['わあっ！', 'BOO!'],
  bye: ['もう帰る〜', 'Going home!'],
  treat: ['お菓子ちょうだい！', 'Trick or treat!'],
};
export function children(game: Game, language: Language) {
  const active = game.kids
    .filter((kid) => kid.state !== 'resolved')
    .sort((a, b) => position(game, a).y - position(game, b).y || a.id - b.id);
  // Same-type children very close to one another share a visible token.
  // Simulation state is untouched; all kids still travel independently.
  const clusters: Array<{ kid: Kid; count: number }> = [];
  for (const kid of active) {
    const p = position(game, kid);
    const close = clusters.find(({ kid: other }) => {
      const q = position(game, other);
      return other.type === kid.type && other.travel === kid.travel &&
        Math.hypot(p.x - q.x, p.y - q.y) < 26;
    });
    if (close) close.count++;
    else clusters.push({ kid, count: 1 });
  }
  return clusters
    .map(({ kid, count }) => {
      const p = position(game, kid);
      const nearby = clusters.filter(({ kid: other }) => {
        const q = position(game, other);
        return Math.hypot(p.x - q.x, p.y - q.y) < 44;
      });
      const laneIndex = nearby.findIndex(({ kid: other }) => other.id === kid.id);
      const lane = nearby.length > 1 ? (laneIndex - (nearby.length - 1) / 2) * 25 : 0;
      const index = kid.type === 'normal' ? 0 : kid.type === 'sweet' ? 1 : 2;
      const returning =
        kid.travel === 'return' || (kid.afterWait === 'return' && kid.state === 'waiting');
      const message = kid.messageUntil > game.tick ? messages[kid.message] : undefined;
      const countLabel = count > 1 ? '<g class="kid-stack"><circle cx="22" cy="-34" r="13" fill="#432448" stroke="#f8d68c" stroke-width="2"/><text x="22" y="-30" text-anchor="middle" font-size="12" font-weight="bold" fill="#fff5d5">×' + count + '</text></g>' : '';
      return `<g class="kid ${returning ? 'returning' : ''}" transform="translate(${p.x + lane} ${p.y})" data-kid="${kid.id}"><ellipse cy="7" rx="13" ry="6" fill="#081b18" opacity=".4"/><g class="kid-art ${kid.state === 'moving' ? 'walking' : ''}" transform="translate(-24 -43)">${sprite(index, '', 48)}</g>${Array.from({ length: kid.tolerance }, (_, i) => `<circle cx="${(i - (kid.tolerance - 1) / 2) * 11}" cy="17" r="3.5" fill="${i < kid.confusion ? '#f7c366' : '#294338'}" stroke="#e7d5aa" stroke-width="1"/>`).join('')}${countLabel}${message && nearby.length === 1 ? `<g class="speech"><rect x="-43" y="-67" width="86" height="19" rx="10"/><text y="-54">${text(language, ...message)}</text></g>` : ''}</g>`;
    })
    .join('');
}
export function placements(game: Game, tool: 'candy' | 'ghost' | null, language: Language) {
  if (!tool) return '';
  const points = tool === 'candy' ? game.stage.map.candyPoints : game.stage.map.ghostPoints;
  const placed = tool === 'candy' ? game.candy : game.ghosts;
  return points
    .filter((id) => !placed.has(id))
    .map((id) => {
      const n = game.stage.map.nodes[id];
      return `<g class="placement" data-place="${id}" role="button" tabindex="0" aria-label="${text(language, 'ここに置く', 'Place here')} ${id}" transform="translate(${n.x} ${n.y})"><circle r="34"/><text y="9">＋</text></g>`;
    })
    .join('');
}
export function items(game: Game) {
  return (
    [...game.candy]
      .map((id) => {
        const n = game.stage.map.nodes[id];
        return `<g class="candy-on-map" transform="translate(${n.x + 25} ${n.y + 18})"><ellipse rx="18" ry="12" fill="#2a213f" stroke="#d7a5e9"/><path d="m-16-7 8 3 16 0 8-3-4 7 4 7-8-3h-16l-8 3 4-7z" fill="#e799cd"/><path d="m-4-4 8 8" stroke="#fff3d2" stroke-width="3"/></g>`;
      })
      .join('') +
    [...game.ghosts]
      .map((id) => {
        const n = game.stage.map.nodes[id];
        return `<g transform="translate(${n.x - 24} ${n.y - 68})">${sprite(4, 'ghost-placed', 48)}</g>`;
      })
      .join('')
  );
}
export function effects(game: Game) {
  return game.events
    .filter((e) => ['homeward', 'boo'].includes(e.kind) && game.tick - e.tick < 60)
    .map((event) => {
      const n = game.stage.map.nodes[event.node!],
        age = (game.tick - event.tick) / 60;
      if (event.kind === 'boo')
        return `<g opacity="${1 - age}" transform="translate(${n.x - 34} ${n.y - 93 - age * 15})">${sprite(4, '', 68)}<text x="34" y="5" class="map-label">BOO!</text></g>`;
      return Array.from({ length: 7 }, (_, i) => {
        const angle = (i * Math.PI * 2) / 7;
        const distance = 10 + age * 65;
        return `<path d="m0-5 1.5 3.5 3.5 1.5-3.5 1.5L0 5l-1.5-3.5L-5 0l3.5-1.5Z" transform="translate(${n.x + Math.cos(angle) * distance} ${n.y + Math.sin(angle) * distance})" fill="#ffe4a0" opacity="${1 - age}"/>`;
      }).join('');
    })
    .join('');
}
