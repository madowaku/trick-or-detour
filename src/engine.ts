import type { Stage, KidType } from './stages';
export const TICKS_PER_SECOND = 60;
export const EDGE_TICKS = 84;
export const SIGN_COOLDOWN = 9;
export type Phase = 'ready' | 'playing' | 'paused' | 'won' | 'lost';
type Travel = 'forward' | 'backtrack' | 'bounce' | 'return';
export interface Kid {
  id: number;
  type: KidType;
  tolerance: number;
  confusion: number;
  visited: Set<string>;
  path: string[];
  from: string;
  to: string;
  remaining: number;
  travel: Travel;
  state: 'moving' | 'waiting' | 'resolved';
  wait: number;
  afterWait: 'return' | 'backtrack' | 'bounce';
  message: 'lost' | 'remember' | 'prank' | 'candy' | 'boo' | 'bye' | 'treat' | '';
  messageUntil: number;
}
export interface GameEvent {
  tick: number;
  kind: string;
  node?: string;
  kid?: number;
}
export class Game {
  readonly stage: Stage;
  phase: Phase = 'ready';
  tick = 0;
  spawned = 0;
  returned = 0;
  arrived = 0;
  signs: Record<string, number> = {};
  lastTurn: Record<string, number> = {};
  rotatedAt: Record<string, number> = {};
  kids: Kid[] = [];
  candy = new Set<string>();
  ghosts = new Set<string>();
  candyLeft: number;
  ghostsLeft: number;
  events: GameEvent[] = [];
  constructor(stage: Stage) {
    this.stage = stage;
    this.candyLeft = stage.candy;
    this.ghostsLeft = stage.ghosts;
    for (const node of Object.values(stage.map.nodes))
      if (node.choices) {
        this.signs[node.id] = 0;
        this.lastTurn[node.id] = -SIGN_COOLDOWN;
        this.rotatedAt[node.id] = -60;
      }
  }
  start() {
    if (this.phase === 'ready') this.phase = 'playing';
  }
  pause() {
    if (this.phase === 'playing') this.phase = 'paused';
    else if (this.phase === 'paused') this.phase = 'playing';
  }
  turn(id: string): boolean {
    const choices = this.stage.map.nodes[id]?.choices;
    if (
      !choices ||
      !['ready', 'playing'].includes(this.phase) ||
      (this.phase === 'playing' && this.tick - this.lastTurn[id] < SIGN_COOLDOWN)
    )
      return false;
    this.signs[id] = (this.signs[id] + 1) % choices.length;
    this.lastTurn[id] = this.tick;
    this.rotatedAt[id] = this.tick;
    this.emit('turn', id);
    return true;
  }
  place(tool: 'candy' | 'ghost', id: string): boolean {
    if (!['ready', 'playing'].includes(this.phase)) return false;
    const allowed = tool === 'candy' ? this.stage.map.candyPoints : this.stage.map.ghostPoints;
    const occupied = tool === 'candy' ? this.candy : this.ghosts;
    const left = tool === 'candy' ? this.candyLeft : this.ghostsLeft;
    if (!allowed.includes(id) || left <= 0 || occupied.has(id)) return false;
    occupied.add(id);
    if (tool === 'candy') this.candyLeft--;
    else this.ghostsLeft--;
    this.emit('place', id);
    return true;
  }
  step(count = 1) {
    for (let step = 0; step < count && this.phase === 'playing'; step++) {
      this.tick++;
      if (
        this.spawned < this.stage.kids.length &&
        this.tick >= 1 + this.spawned * this.stage.interval
      )
        this.spawn();
      // Stable spawn order is also the resolution order for simultaneous arrivals.
      for (const kid of this.kids) {
        if (kid.state === 'resolved') continue;
        if (kid.state === 'waiting') {
          if (--kid.wait === 0) this.finishWait(kid);
        } else if (--kid.remaining === 0) this.arrive(kid);
        if (this.phase !== 'playing') break;
      }
      if (
        this.phase === 'playing' &&
        this.spawned === this.stage.kids.length &&
        this.returned + this.arrived === this.stage.kids.length
      ) {
        this.phase = 'won';
        this.emit('win');
      }
    }
  }
  get stars() {
    return this.phase === 'won' ? Math.max(1, 3 - this.arrived) : 0;
  }
  get unresolved() {
    return this.stage.kids.length - this.returned - this.arrived;
  }
  private emit(kind: string, node?: string, kid?: number) {
    this.events.push({ tick: this.tick, kind, node, kid });
  }
  private say(kid: Kid, message: Kid['message']) {
    kid.message = message;
    kid.messageUntil = this.tick + 100;
  }
  private spawn() {
    const id = this.spawned++;
    const kid: Kid = {
      id,
      type: this.stage.kids[id],
      tolerance: this.stage.tolerance,
      confusion: 0,
      visited: new Set(),
      path: ['G'],
      from: 'G',
      to: this.stage.map.nodes.G.links[0],
      remaining: EDGE_TICKS,
      travel: 'forward',
      state: 'moving',
      wait: 0,
      afterWait: 'return',
      message: '',
      messageUntil: 0,
    };
    this.kids.push(kid);
    this.emit('spawn', 'G', id);
  }
  private move(kid: Kid, from: string, to: string, travel: Travel) {
    kid.from = from;
    kid.to = to;
    kid.remaining = EDGE_TICKS;
    kid.travel = travel;
    kid.state = 'moving';
  }
  private arrive(kid: Kid) {
    const node = this.stage.map.nodes[kid.to];
    if (kid.travel === 'return') {
      kid.path.pop();
      if (node.kind === 'gate') {
        kid.state = 'resolved';
        this.returned++;
        this.emit('homeward', 'G', kid.id);
      } else this.move(kid, node.id, kid.path[kid.path.length - 2], 'return');
      return;
    }
    if (kid.travel === 'backtrack' || kid.travel === 'bounce') kid.path.pop();
    else kid.path.push(node.id);
    if (kid.type === 'sweet' && this.candy.delete(node.id)) {
      this.say(kid, 'candy');
      this.emit('candy', node.id, kid.id);
    }
    if (node.kind === 'home') {
      kid.state = 'resolved';
      this.arrived++;
      this.say(kid, 'treat');
      this.emit('arrival', node.id, kid.id);
      if (this.arrived > this.stage.allowance) {
        this.phase = 'lost';
        this.emit('lose');
      }
      return;
    }
    if (node.kind === 'deadend') {
      if (!kid.visited.has(node.id)) {
        kid.visited.add(node.id);
        kid.confusion++;
        this.say(kid, 'lost');
        this.emit('confused', node.id, kid.id);
      } else this.say(kid, 'remember');
      kid.state = 'waiting';
      kid.wait = 24;
      kid.afterWait = kid.confusion >= kid.tolerance ? 'return' : 'backtrack';
      return;
    }
    if (this.ghosts.delete(node.id)) {
      kid.confusion++;
      this.say(kid, 'boo');
      this.emit('boo', node.id, kid.id);
      kid.state = 'waiting';
      kid.wait = 90;
      kid.afterWait = kid.confusion >= kid.tolerance ? 'return' : 'bounce';
      return;
    }
    const choices = node.choices!;
    if (kid.type === 'prank') {
      this.signs[node.id] = (this.signs[node.id] + 1) % choices.length;
      this.rotatedAt[node.id] = this.tick;
      this.say(kid, 'prank');
      this.emit('prank', node.id, kid.id);
    }
    const available = choices.filter((id) => !kid.visited.has(id) && id !== kid.from);
    // A ghost can force a child back upstream. Allow resuming toward home when
    // the other branch is remembered; this is recovery, not a player U-turn.
    if (!available.length && kid.travel === 'bounce')
      available.push(...choices.filter((id) => !kid.visited.has(id)));
    const signTarget = choices[this.signs[node.id]];
    const candyTarget =
      kid.type === 'sweet' ? available.find((id) => this.candy.has(id)) : undefined;
    let target = candyTarget ?? (available.includes(signTarget) ? signTarget : undefined);
    if (!target) {
      this.say(kid, 'remember');
      this.emit('remember', node.id, kid.id);
      target = available.find((id) => this.stage.map.nodes[id].kind !== 'deadend') ?? available[0];
    }
    // Tree maps always have an unvisited route to the home; guard invalid data.
    if (!target) throw new Error(`No legal route at ${node.id} for kid ${kid.id}`);
    this.move(kid, node.id, target, 'forward');
  }
  private finishWait(kid: Kid) {
    const current = kid.to;
    if (kid.afterWait === 'return') {
      this.say(kid, 'bye');
      this.emit('return', current, kid.id);
      this.move(kid, current, kid.path[kid.path.length - 2], 'return');
    } else this.move(kid, current, kid.path[kid.path.length - 2], kid.afterWait);
  }
}
