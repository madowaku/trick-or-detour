import { Game, type Kid } from '../src/engine';
import { STAGES, type Stage } from '../src/stages';
export interface Input {
  tick: number;
  action: 'turn' | 'candy' | 'ghost';
  node: string;
}
function target(game: Game, kid: Kid) {
  const choices = game.stage.map.nodes[kid.to].choices!;
  const valid = choices.filter((id) => !kid.visited.has(id) && id !== kid.from);
  const forward = valid.find((id) => game.stage.map.nodes[id].kind !== 'deadend');
  const deadends = valid.filter((id) => game.stage.map.nodes[id].kind === 'deadend');
  const offset = kid.type === 'prank' ? 1 : 0;
  const predicted = choices[(game.signs[kid.to] + offset) % choices.length];
  const desired = deadends.includes(predicted) ? predicted : (deadends[0] ?? forward ?? choices[0]);
  // When the only alternative is a remembered branch, every sign resolves
  // to the homeward path anyway, so no intervention is necessary.
  if (deadends.length === 0) return game.signs[kid.to];
  return (choices.indexOf(desired) - offset + choices.length) % choices.length;
}
export function findSolution(stage: Stage, lead = 70) {
  const game = new Game(stage),
    inputs: Input[] = [];
  for (const id of Object.keys(game.signs)) {
    const choices = stage.map.nodes[id].choices!;
    const first = choices.findIndex((n) => stage.map.nodes[n].kind === 'deadend');
    for (let i = 0; i < first; i++) {
      game.turn(id);
      inputs.push({ tick: 0, action: 'turn', node: id });
    }
  }
  game.start();
  for (let i = 0; i < 9000 && game.phase === 'playing'; i++) {
    for (const id of Object.keys(game.signs)) {
      const incoming = game.kids
        .filter(
          (k) =>
            k.state === 'moving' && k.to === id && k.travel !== 'return' && k.remaining <= lead,
        )
        .sort((a, b) => a.remaining - b.remaining || a.id - b.id)[0];
      if (incoming && target(game, incoming) !== game.signs[id] && game.turn(id))
        inputs.push({ tick: game.tick, action: 'turn', node: id });
    }
    game.step();
  }
  return { game, inputs };
}
export function replay(stage: Stage, inputs: Input[]) {
  const game = new Game(stage);
  for (const input of inputs.filter((i) => i.tick === 0)) {
    if (input.action === 'turn') game.turn(input.node);
    else game.place(input.action, input.node);
  }
  game.start();
  for (let tick = 0; tick < 9000 && game.phase === 'playing'; tick++) {
    if (tick !== 0)
      for (const input of inputs.filter((i) => i.tick === tick)) {
        if (input.action === 'turn') game.turn(input.node);
        else game.place(input.action, input.node);
      }
    game.step();
  }
  return game;
}
export const solvePack = () =>
  STAGES.map((stage) => {
    const found = findSolution(stage);
    return found.game.phase === 'won' ? found : searchSolution(stage);
  });

function copy(source: Game) {
  const game = new Game(source.stage);
  Object.assign(game, {
    phase: source.phase,
    tick: source.tick,
    spawned: source.spawned,
    returned: source.returned,
    arrived: source.arrived,
    candyLeft: source.candyLeft,
    ghostsLeft: source.ghostsLeft,
    signs: { ...source.signs },
    lastTurn: { ...source.lastTurn },
    rotatedAt: { ...source.rotatedAt },
    candy: new Set(source.candy),
    ghosts: new Set(source.ghosts),
    events: [...source.events],
    kids: source.kids.map((k) => ({ ...k, visited: new Set(k.visited), path: [...k.path] })),
  });
  return game;
}
// Bounded beam search supplies a legal witness when greedy timing is insufficient.
// Search inputs are quantized to 0.2 s, and always use the public cooldown API.
export function searchSolution(stage: Stage, width = 500) {
  type Candidate = { game: Game; inputs: Input[] };
  let beam: Candidate[] = [];
  const sign = Object.keys(new Game(stage).signs)[0];
  for (let turns = 0; turns < stage.map.nodes[sign].choices!.length; turns++) {
    const game = new Game(stage),
      inputs: Input[] = [];
    for (let i = 0; i < turns; i++) {
      game.turn(sign);
      inputs.push({ tick: 0, action: 'turn', node: sign });
    }
    game.start();
    beam.push({ game, inputs });
  }
  for (let tick = 0; tick < 3000 && beam.length; tick += 12) {
    const next: Candidate[] = [];
    const seen = new Set<string>();
    for (const candidate of beam)
      for (const turn of [false, true]) {
        const game = copy(candidate.game),
          inputs = [...candidate.inputs];
        if (turn) {
          if (!game.turn(sign)) continue;
          inputs.push({ tick, action: 'turn', node: sign });
        }
        game.step(12);
        if (game.phase === 'won') return { game, inputs };
        if (game.phase === 'lost' || game.kids.some((k) => k.state !== 'resolved' && k.to === 'H'))
          continue;
        const key = JSON.stringify([
          game.signs,
          game.lastTurn,
          game.returned,
          game.kids.map((k) => [
            k.to,
            k.from,
            k.remaining,
            k.state,
            k.wait,
            k.confusion,
            [...k.visited],
            k.travel,
          ]),
        ]);
        if (!seen.has(key)) {
          seen.add(key);
          next.push({ game, inputs });
        }
      }
    const score = (c: Candidate) =>
      c.game.returned * 1000 +
      c.game.kids.reduce(
        (sum, k) => sum + k.confusion * 100 + (k.state === 'resolved' ? 0 : k.visited.size * 20),
        0,
      ) -
      c.inputs.length * 0.02;
    next.sort((a, b) => score(b) - score(a));
    beam = next.slice(0, width);
  }
  throw Error(`No solution found for ${stage.id}`);
}
