import test from 'node:test';
import assert from 'node:assert/strict';
import {RouteGame,ROUTE_STAGES,EDGE_TICKS} from '../public/route-v02.js';

function run(game, limit=10000) {
  game.start();
  for(let tick=0;tick<limit&&game.phase==='playing';tick++)game.step();
  return game;
}
test('three route stages have cyclic roads instead of dead ends',()=>{
  for(const stage of ROUTE_STAGES){
    assert.equal(stage.edges.some(([a,b])=>a==='G'||b==='G'),true);
    assert.equal(stage.edges.some(([a,b])=>a==='W'||b==='W'),true);
    assert.ok(Object.keys(stage.signs).length>=1);
    assert.ok(stage.edges.length >= Object.keys(stage.nodes).length);
  }
});
test('stage 001: a full loop makes the child homesick; switch to exit',()=>{
  const game=new RouteGame(ROUTE_STAGES[0]);
  assert.equal(game.turn('A'),true); // W -> B
  game.start();
  game.step(200); // child already read the sign at A
  assert.equal(game.turn('A'),true); // B -> exit G
  run(game);
  assert.equal(game.phase,'won');
  assert.equal(game.returned,1);
  assert.equal(game.arrived,0);
  assert.ok(game.events.some(e=>e.kind==='homesick'));
});
test('stage 001: sending a child to the exit too early fails',()=>{
  const game=new RouteGame(ROUTE_STAGES[0]);
  game.turn('A');game.turn('A'); // point at G
  run(game);
  assert.equal(game.phase,'lost');
  assert.equal(game.arrived,1);
  assert.ok(game.events.some(e=>e.kind==='refusal'));
});
test('stage 002: long loop and timely exit returns the child',()=>{
  const game=new RouteGame(ROUTE_STAGES[1]);
  game.turn('A');game.turn('A'); // W->B->C (long loop)
  game.start();
  game.step(200);
  game.turn('A'); // C -> G
  run(game);
  assert.equal(game.phase,'won');
  assert.equal(game.returned,1);
  assert.equal(game.arrived,0);
});
test('stage 003: staggered departures, shared signs, and two loops',()=>{
  const game=new RouteGame(ROUTE_STAGES[2]);
  game.turn('A'); // first three kids enter B loop
  game.turn('J'); // point final junction to exit
  game.start();
  game.step(590); // all three children have passed A the first time
  game.turn('A'); // A -> J for first child, now homesick
  game.step(80); // child 1 entered J route
  game.turn('A');game.turn('A'); // A -> D for child 2, still wants candy
  game.step(230);
  game.turn('A'); // A -> J for child 3 and child 2 after long lap
  run(game);
  assert.equal(game.phase,'won');
  assert.equal(game.returned,3);
  assert.equal(game.arrived,0);
  assert.equal(game.events.filter(e=>e.kind==='homesick').length,3);
});
test('signs can be rotated instantly and decisions are locked for a segment',()=>{
  const game=new RouteGame(ROUTE_STAGES[0]);
  game.turn('A');game.start();game.step(EDGE_TICKS);
  assert.equal(game.kids[0].to,'B');
  game.turn('A');game.turn('A'); // G then W, but current destination stays B
  assert.equal(game.kids[0].to,'B');
});
test('simulation is deterministic for the same set of actions',()=>{
  const play=()=>{
    const g=new RouteGame(ROUTE_STAGES[2]);
    g.turn('A');g.turn('J');g.start();
    for(let i=0;i<2500&&g.phase==='playing';i++){
      if(i===589)g.turn('A');
      if(i===669){g.turn('A');g.turn('A');}
      if(i===899)g.turn('A');
      g.step();
    }
    return {events:g.events,returned:g.returned,arrived:g.arrived,phase:g.phase};
  };
  assert.deepEqual(play(),play());
});
