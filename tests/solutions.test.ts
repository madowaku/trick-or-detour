import { it, expect } from 'vitest';
import { STAGES } from '../src/stages';
import { replay, type Input } from './solutions';
import witnesses from './clear-solutions.json';
for (const stage of STAGES)
  it(`Stage ${String(stage.id).padStart(3, '0')} has a replayable legal clear solution`, () => {
    const inputs = witnesses[stage.id - 1] as Input[];
    const found = { game: replay(stage, inputs), inputs };
    expect(
      found.game.phase,
      JSON.stringify({
        stage: stage.id,
        arrived: found.game.arrived,
        tick: found.game.tick,
        events: found.game.events.slice(-12),
      }),
    ).toBe('won');
    expect(found.game.arrived).toBeLessThanOrEqual(stage.allowance);
    expect(found.game.stars).toBe(3);
    expect(found.game.returned + found.game.arrived).toBe(stage.kids.length);
    expect(replay(stage, found.inputs).events).toEqual(found.game.events);
  });
