import { describe, it, expect } from 'vitest';
import { Game, EDGE_TICKS, SIGN_COOLDOWN } from '../src/engine';
import { STAGES, type Stage } from '../src/stages';
import { loadSave, writeSave, emptySave, unlocked } from '../src/save';

const stage = (index: number, patch: Partial<Stage> = {}): Stage => ({
  ...STAGES[index],
  ...patch,
});
const run = (game: Game, limit = 10000) => {
  game.start();
  for (let i = 0; i < limit && game.phase === 'playing'; i++) game.step();
  return game;
};
describe('deterministic forest simulation', () => {
  it('freezes a chosen route even when the sign changes afterward', () => {
    const game = new Game(STAGES[0]);
    game.turn('J');
    game.start();
    game.step(EDGE_TICKS);
    expect(game.kids[0].to).toBe('D1');
    game.turn('J');
    expect(game.kids[0].to).toBe('D1');
    run(game);
    expect(game.phase).toBe('won');
  });
  it('a remembered dead end adds confusion only once, and is ignored on return', () => {
    const game = new Game(stage(2, { kids: ['normal'] }));
    game.turn('J');
    game.start();
    game.step(EDGE_TICKS * 2 + 24 + EDGE_TICKS);
    expect(game.kids[0].confusion).toBe(1);
    expect(game.kids[0].visited.has('D2')).toBe(true);
    expect(game.kids[0].to).toBe('H');
    expect(game.events.filter((e) => e.kind === 'confused')).toHaveLength(1);
    expect(game.events.some((e) => e.kind === 'remember')).toBe(true);
  });
  it('returning children ignore signs and physically follow their entry route', () => {
    const game = new Game(STAGES[0]);
    game.turn('J');
    game.start();
    game.step(EDGE_TICKS * 2 + 24);
    expect(game.kids[0].travel).toBe('return');
    game.turn('J');
    game.step(EDGE_TICKS);
    expect(game.kids[0].to).toBe('G');
    game.step(EDGE_TICKS);
    expect(game.returned).toBe(1);
  });
  it('a prankster changes the sign persistently for following children', () => {
    const game = new Game(stage(2, { kids: ['prank', 'normal'], tolerance: 1, interval: 100 }));
    game.start();
    game.step(EDGE_TICKS);
    expect(game.signs.J).toBe(1);
    expect(game.kids[0].to).toBe('D2');
    game.step(100);
    expect(game.kids[1].to).toBe('D2');
  });
  it('only a sweet tooth chooses and consumes candy; it disappears once', () => {
    const game = new Game(stage(3, { kids: ['sweet', 'sweet'], interval: 170 }));
    game.place('candy', 'D1');
    game.start();
    game.step(EDGE_TICKS);
    expect(game.kids[0].to).toBe('D1');
    game.step(EDGE_TICKS);
    expect(game.candy.size).toBe(0);
    expect(game.events.filter((e) => e.kind === 'candy')).toHaveLength(1);
  });
  it('normal children ignore adjacent candy', () => {
    const game = new Game(stage(3, { kids: ['normal'] }));
    game.place('candy', 'D1');
    game.start();
    game.step(EDGE_TICKS);
    expect(game.kids[0].to).toBe('H');
    expect(game.candy.has('D1')).toBe(true);
  });
  it('candy cannot be placed at the house or gate, and has a finite inventory', () => {
    const game = new Game(STAGES[3]);
    expect(game.place('candy', 'H')).toBe(false);
    expect(game.place('candy', 'G')).toBe(false);
    expect(game.place('candy', 'D1')).toBe(true);
    expect(game.place('candy', 'D2')).toBe(false);
  });
  it('a ghost that fills tolerance pauses the child then sends them home', () => {
    const game = new Game(stage(6, { kids: ['normal'], tolerance: 1 }));
    expect(game.place('ghost', 'J1')).toBe(false);
    expect(game.place('ghost', 'J2')).toBe(true);
    game.start();
    game.step(EDGE_TICKS * 2);
    expect(game.kids[0].state).toBe('waiting');
    expect(game.kids[0].confusion).toBe(1);
    expect(game.ghosts.size).toBe(0);
    game.step(89);
    expect(game.kids[0].state).toBe('waiting');
    game.step();
    expect(game.kids[0].travel).toBe('return');
    run(game);
    expect(game.phase).toBe('won');
  });
  it('a ghost below tolerance forces just one segment back and cannot cause a loop', () => {
    const game = new Game(stage(6, { kids: ['normal'] }));
    game.place('ghost', 'J2');
    game.start();
    game.step(EDGE_TICKS * 2 + 90);
    expect(game.kids[0].travel).toBe('bounce');
    expect(game.kids[0].to).toBe('J1');
    run(game);
    expect(['won', 'lost']).toContain(game.phase);
  });
  it('a ghost after a remembered detour permits recovery through the upstream junction', () => {
    const game = new Game(stage(6, { kids: ['normal'], tolerance: 3 }));
    game.turn('J1');
    game.place('ghost', 'J2');
    game.start();
    game.step(EDGE_TICKS * 3 + 24);
    game.turn('J1');
    run(game);
    expect(game.phase).toBe('lost');
    expect(game.kids[0].confusion).toBe(2);
  });
  it('simultaneous arrivals are resolved in spawn ID order every time', () => {
    const create = () => {
      const game = new Game(stage(4, { kids: ['prank', 'prank'], interval: 0, allowance: 2 }));
      game.start();
      game.step();
      game.step();
      game.kids[1].remaining = game.kids[0].remaining;
      run(game);
      return game;
    };
    const a = create(),
      b = create();
    expect(a.events).toEqual(b.events);
    expect(
      a.events
        .filter((e) => e.kind === 'prank')
        .slice(0, 2)
        .map((e) => e.kid),
    ).toEqual([0, 1]);
  });
  it('enforces 0.6 second tap spacing, and disables input during pause', () => {
    const game = new Game(STAGES[0]);
    game.start();
    expect(game.turn('J')).toBe(true);
    expect(game.turn('J')).toBe(false);
    game.step(SIGN_COOLDOWN);
    expect(game.turn('J')).toBe(true);
    game.pause();
    const tick = game.tick;
    game.step(500);
    expect(game.tick).toBe(tick);
    expect(game.turn('J')).toBe(false);
    expect(game.place('candy', 'D1')).toBe(false);
    game.pause();
    game.step();
    expect(game.tick).toBe(tick + 1);
  });
  it('fails immediately on exceeding the allowance', () => {
    const game = run(new Game(STAGES[0]));
    expect(game.phase).toBe('lost');
    expect(game.arrived).toBe(1);
    expect(game.tick).toBe(168);
  });
  it('resolves every visitor when an unlimited-allowance stage is unattended', () => {
    for (const definition of STAGES) {
      const game = run(new Game({ ...definition, allowance: definition.kids.length }));
      expect(game.phase, `stage ${definition.id}`).toBe('won');
      expect(game.returned + game.arrived).toBe(definition.kids.length);
      expect(game.tick).toBeLessThan(6000);
    }
  });
  it('starting a fresh stage resets visitors, cooldowns, items, and time', () => {
    const game = new Game(STAGES[7]);
    game.place('candy', 'D1');
    game.start();
    game.step(200);
    const fresh = new Game(game.stage);
    expect(fresh.tick).toBe(0);
    expect(fresh.kids).toHaveLength(0);
    expect(fresh.candyLeft).toBe(1);
    expect(fresh.candy.size).toBe(0);
    expect(fresh.phase).toBe('ready');
  });
  it('has no random outcomes across repeated input replays', () => {
    const replay = () => {
      const game = new Game(STAGES[9]);
      game.turn('J1');
      game.turn('J2');
      game.place('ghost', 'J2');
      game.start();
      for (let i = 0; i < 6000 && game.phase === 'playing'; i++) {
        if (i % 73 === 0) game.turn('J1');
        if (i % 91 === 0) game.turn('J2');
        game.step();
      }
      return game.events;
    };
    expect(replay()).toEqual(replay());
  });
  it('adds no second confusion when a fixture forcibly revisits a dead end', () => {
    const game = new Game(stage(2, { kids: ['normal'] }));
    game.turn('J');
    game.start();
    game.step(168);
    const kid = game.kids[0];
    expect(kid.confusion).toBe(1);
    kid.state = 'moving';
    kid.travel = 'forward';
    kid.from = 'J';
    kid.to = 'D2';
    kid.path = ['G', 'J'];
    kid.remaining = 1;
    game.step();
    expect(kid.confusion).toBe(1);
    expect(game.events.filter((e) => e.kind === 'confused')).toHaveLength(1);
  });
  it('terminates under many timed sign and item sequences without stuck children', () => {
    let seed = 1985;
    const next = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed;
    };
    for (const definition of STAGES)
      for (let trial = 0; trial < 12; trial++) {
        const game = new Game({ ...definition, allowance: definition.kids.length });
        game.start();
        for (let tick = 0; tick < 6000 && game.phase === 'playing'; tick++) {
          for (const id of Object.keys(game.signs)) if (next() % 23 === 0) game.turn(id);
          if (next() % 83 === 0)
            game.place(
              'candy',
              definition.map.candyPoints[next() % definition.map.candyPoints.length],
            );
          if (next() % 97 === 0 && definition.map.ghostPoints.length) game.place('ghost', 'J2');
          game.step();
        }
        expect(game.phase, `stage ${definition.id}, trial ${trial}`).toBe('won');
        expect(game.returned + game.arrived).toBe(definition.kids.length);
      }
  });
});
describe('progress and settings', () => {
  it('round-trips records and unlocks the following stage', () => {
    let stored = '';
    const storage = {
      getItem: () => stored,
      setItem: (_: string, value: string) => {
        stored = value;
      },
    };
    const save = emptySave();
    save.stars[0] = 3;
    save.stars[1] = 2;
    save.language = 'en';
    expect(writeSave(save, storage)).toBe(true);
    expect(loadSave(storage)).toEqual(save);
    expect(unlocked(save)).toBe(3);
  });
  it('recovers from corrupt, incompatible, or unavailable storage', () => {
    for (const value of ['broken', '{}', '{"version":7}', '{"version":1,"stars":[9,-3,"x"]}']) {
      const loaded = loadSave({ getItem: () => value });
      expect(loaded.stars).toHaveLength(10);
      expect(loaded.stars.every((n) => n >= 0 && n <= 3)).toBe(true);
    }
    expect(
      loadSave({
        getItem: () => {
          throw Error('disabled');
        },
      }),
    ).toEqual(emptySave());
    expect(
      writeSave(emptySave(), {
        setItem: () => {
          throw Error('full');
        },
      }),
    ).toBe(false);
  });
});
