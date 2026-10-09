export type KidType = 'normal' | 'sweet' | 'prank';
export type NodeKind = 'gate' | 'junction' | 'deadend' | 'home';
export interface MapNode {
  id: string;
  kind: NodeKind;
  x: number;
  y: number;
  links: string[];
  choices?: string[];
}
export interface ForestMap {
  id: 'A' | 'B' | 'C';
  nodes: Record<string, MapNode>;
  candyPoints: string[];
  ghostPoints: string[];
}
export interface Stage {
  id: number;
  title: [string, string];
  hint: [string, string];
  map: ForestMap;
  kids: KidType[];
  tolerance: number;
  interval: number;
  candy: number;
  ghosts: number;
  allowance: number;
}
const node = (
  id: string,
  kind: NodeKind,
  x: number,
  y: number,
  links: string[],
  choices?: string[],
): MapNode => ({ id, kind, x, y, links, choices });
export const MAPS: Record<'A' | 'B' | 'C', ForestMap> = {
  A: {
    id: 'A',
    nodes: {
      G: node('G', 'gate', 250, 530, ['J']),
      J: node('J', 'junction', 250, 330, ['G', 'H', 'D1'], ['H', 'D1']),
      H: node('H', 'home', 330, 115, ['J']),
      D1: node('D1', 'deadend', 90, 245, ['J']),
    },
    candyPoints: ['D1'],
    ghostPoints: [],
  },
  B: {
    id: 'B',
    nodes: {
      G: node('G', 'gate', 250, 530, ['J']),
      J: node('J', 'junction', 250, 340, ['G', 'H', 'D1', 'D2'], ['H', 'D2', 'D1']),
      H: node('H', 'home', 250, 115, ['J']),
      D1: node('D1', 'deadend', 85, 275, ['J']),
      D2: node('D2', 'deadend', 415, 275, ['J']),
    },
    candyPoints: ['D1', 'D2'],
    ghostPoints: [],
  },
  C: {
    id: 'C',
    nodes: {
      G: node('G', 'gate', 250, 540, ['J1']),
      J1: node('J1', 'junction', 250, 395, ['G', 'J2', 'D1'], ['J2', 'D1']),
      D1: node('D1', 'deadend', 85, 360, ['J1']),
      J2: node('J2', 'junction', 310, 230, ['J1', 'H', 'D2'], ['H', 'D2']),
      D2: node('D2', 'deadend', 105, 185, ['J2']),
      H: node('H', 'home', 340, 85, ['J2']),
    },
    candyPoints: ['D1', 'D2', 'J2'],
    ghostPoints: ['J2'],
  },
};
const n: KidType = 'normal',
  s: KidType = 'sweet',
  p: KidType = 'prank';
const definitions: Array<
  [
    Stage['title'],
    Stage['hint'],
    'A' | 'B' | 'C',
    KidType[],
    number,
    number,
    number,
    number,
    number,
  ]
> = [
  [
    ['はじめての迷子', 'A little detour'],
    ['看板をタップして、行き止まりへご案内。', 'Tap the sign and point it toward the dead end.'],
    'A',
    [n],
    1,
    180,
    0,
    0,
    0,
  ],
  [
    ['ぞろぞろ来た！', 'Here comes company!'],
    [
      '3人のお客さま。看板ひとつで、みんな遠回り。',
      'Three little visitors. One sign can send them all home.',
    ],
    'A',
    [n, n, n],
    1,
    180,
    0,
    0,
    0,
  ],
  [
    ['そこ、さっき行った！', 'Been there, done that'],
    [
      '同じ道は覚えちゃう。左右の行き止まりを使おう。',
      'They remember! Use both different dead ends.',
    ],
    'B',
    [n, n],
    2,
    180,
    0,
    0,
    0,
  ],
  [
    ['あまい罠', 'A sweet little trap'],
    [
      '紫の帽子はおやつ好き。お菓子に誘われるよ。',
      'Purple hats love sweets. Candy takes priority over signs.',
    ],
    'B',
    [s, n, s],
    2,
    180,
    1,
    0,
    0,
  ],
  [
    ['看板どろぼう', 'Mischief makers'],
    [
      '緑のいたずらっ子は、看板を回してから進む！',
      'Green pranksters turn the sign before choosing a path!',
    ],
    'B',
    [n, p, n, p],
    2,
    180,
    0,
    0,
    0,
  ],
  [
    ['森の奥へ', 'Into the woods'],
    ['看板が2本に。手前と奥で、それぞれ遠回り。', 'Two signs now. Make a detour at each junction.'],
    'C',
    [n, n, n, n],
    2,
    180,
    0,
    0,
    0,
  ],
  [
    ['おばけのお仕事', 'A ghost on duty'],
    [
      'おばけは奥の分岐へ。びっくりで迷い値がひとつ増える。',
      'Place a ghost at the far junction for one extra confusion.',
    ],
    'C',
    [n, n, n],
    2,
    180,
    0,
    1,
    0,
  ],
  [
    ['トリック合戦', 'Trick versus trick'],
    [
      'お菓子とおばけで切り抜けよう。到達は1人まで。',
      'Candy and a ghost can help. One visitor is allowed.',
    ],
    'C',
    [n, s, p, n, s, p],
    2,
    165,
    1,
    1,
    1,
  ],
  [
    ['お菓子の噂', 'Word of the candy'],
    [
      '10人も来ちゃった！先回りして看板を回そう。',
      'Ten visitors! Stay one step ahead of the parade.',
    ],
    'C',
    [n, s, p, n, s, p, n, s, p, n],
    2,
    150,
    1,
    1,
    1,
  ],
  [
    ['パンプキン・パレード', 'The pumpkin parade'],
    [
      '大王のパレード開幕。魔女の静かな夜を守ろう！',
      'The Pumpkin King opens the parade. Keep your cozy night!',
    ],
    'C',
    [n, s, p, n, s, p, n, s, p, n, s, n],
    2,
    135,
    2,
    2,
    2,
  ],
];
export const STAGES: Stage[] = definitions.map(
  ([title, hint, map, kids, tolerance, interval, candy, ghosts, allowance], i) => ({
    id: i + 1,
    title,
    hint,
    map: MAPS[map],
    kids,
    tolerance,
    interval,
    candy,
    ghosts,
    allowance,
  }),
);
