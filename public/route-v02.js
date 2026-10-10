/* TRICK OR DETOUR! Route Defense v0.2 playable experiment.
 * Standalone ES module: deterministic model plus DOM-based renderer.
 * No external assets or services required beyond the game's own /assets/.
 */
export const EDGE_TICKS = 156;
export const ROUTE_STAGES = [
  {
    id: 1, title: ['ぐるっと一周', 'One more lap'],
    hint: ['輪の中を一周したら、看板を出口へ回そう。', 'Send the visitor around the loop, then point to the exit.'],
    threshold: [4], spawnInterval: 210,
    nodes: { G:[75,540], A:[240,430], B:[95,295], C:[282,265], W:[415,135] },
    edges: [['G','A'],['A','B'],['B','C'],['C','A'],['A','W']],
    signs: { A:['W','B','G'] }, fixed: { B:'C', C:'A' }
  },
  {
    id: 2, title: ['大回り、小回り', 'Long way or short way'],
    hint: ['短い輪と長い輪。長いほうなら一周で帰りたくなる！', 'The long loop gets a visitor homesick in one lap.'],
    threshold: [5], spawnInterval: 210,
    nodes: { G:[70,542], A:[236,433], B:[103,352], C:[340,343], D:[366,235], E:[180,205], W:[423,112] },
    edges: [['G','A'],['A','B'],['A','C'],['C','D'],['D','E'],['E','A'],['A','W']],
    signs: { A:['W','B','C','G'] }, fixed: { B:'A', C:'D', D:'E', E:'A' }
  },
  {
    id: 3, title: ['迷子の大行進', 'The winding parade'],
    hint: ['3人が同じ看板を使う。帰す子と遠回りさせる子を見極めよう。', 'Three kids, two loops and two signs. Time your detours!'],
    threshold: [4,6,4], spawnInterval: 210,
    nodes: { G:[60,546], A:[197,455], B:[70,330], C:[205,290], D:[327,361], E:[345,240], F:[185,169], J:[375,500], W:[437,120] },
    edges: [['G','A'],['A','B'],['B','C'],['C','A'],['A','D'],['D','E'],['E','F'],['F','A'],['A','J'],['J','G'],['J','W']],
    signs: { A:['J','B','D'], J:['W','G'] },
    fixed: { B:'C', C:'A', D:'E', E:'F', F:'A' }
  }
];
export class RouteGame {
  constructor(stage) {
    this.stage = stage;
    this.phase = 'ready';
    this.tick = 0;
    this.spawned = 0;
    this.returned = 0;
    this.arrived = 0;
    this.kids = [];
    this.events = [];
    this.signs = Object.fromEntries(Object.keys(stage.signs).map(id => [id, 0]));
  }
  turn(id) {
    if (!(id in this.signs) || !['ready','playing'].includes(this.phase)) return false;
    this.signs[id] = (this.signs[id] + 1) % this.stage.signs[id].length;
    this.events.push({ kind:'turn', tick:this.tick, node:id });
    return true;
  }
  start() { if (this.phase === 'ready') this.phase = 'playing'; }
  pause() {
    if (this.phase === 'playing') this.phase = 'paused';
    else if (this.phase === 'paused') this.phase = 'playing';
  }
  spawn() {
    const id = this.spawned++;
    const kid = { id, from:'G', to:'A', remaining:EDGE_TICKS,
      walked:0, threshold:this.stage.threshold[id], state:'moving',
      message:'', messageUntil:0, history:['G'] };
    this.kids.push(kid);
    this.events.push({kind:'spawn',tick:this.tick,kid:id});
  }
  travel(kid, destination) {
    const neighbors = this.stage.edges.some(([a,b]) =>
      (a === kid.to && b === destination) || (b === kid.to && a === destination));
    if (!neighbors) throw Error('Invalid link from '+kid.to+' to '+destination);
    kid.from = kid.to;
    kid.to = destination;
    kid.remaining = EDGE_TICKS;
    kid.history.push(kid.from);
  }
  arrive(kid) {
    const at = kid.to;
    if (at === 'W') {
      kid.state = 'resolved'; this.arrived++;
      kid.message = 'trick or treat!';
      this.events.push({kind:'arrival',tick:this.tick,kid:kid.id});
      this.phase = 'lost';
      return;
    }
    if (at === 'G') {
      kid.state = 'resolved'; this.returned++;
      kid.message = 'home!';
      this.events.push({kind:'returned',tick:this.tick,kid:kid.id});
      return;
    }
    kid.walked++;
    if (kid.walked === kid.threshold) {
      kid.message = '帰りたい！';
      kid.messageUntil = this.tick + EDGE_TICKS;
      this.events.push({kind:'homesick',tick:this.tick,kid:kid.id,node:at});
    }
    let target = this.stage.fixed[at];
    if (this.stage.signs[at]) target = this.stage.signs[at][this.signs[at]];
    if (!target) throw Error('No instruction at '+at);
    // Young trick-or-treaters will NOT go home early. They still want sweets,
    // so prematurely sending them to the gate lets the witch's cottage win.
    if (target === 'G' && kid.walked < kid.threshold) {
      kid.message = 'まだ帰らない！';
      kid.messageUntil = this.tick + EDGE_TICKS;
      target = 'W';
      this.events.push({kind:'refusal',tick:this.tick,kid:kid.id,node:at});
      // A may have no direct edge to W on a complex map.
      if (!this.stage.edges.some(([a,b]) => (a===at&&b==='W')||(b===at&&a==='W'))) {
        target = 'W';
      }
    }
    this.travel(kid,target);
  }
  step(count=1) {
    for (let i=0;i<count && this.phase === 'playing';i++) {
      this.tick++;
      if (this.spawned < this.stage.threshold.length &&
          this.tick >= 1 + this.spawned * this.stage.spawnInterval) this.spawn();
      for (const kid of this.kids) {
        if (kid.state !== 'moving') continue;
        kid.remaining--;
        if (kid.remaining <= 0) this.arrive(kid);
        if (this.phase !== 'playing') break;
      }
      if (this.phase === 'playing' &&
        this.spawned === this.stage.threshold.length &&
        this.returned === this.stage.threshold.length) {
        this.phase = 'won';
        this.events.push({kind:'win',tick:this.tick});
      }
    }
  }
}
export const destination = (game,id) => game.stage.signs[id][game.signs[id]];
export const kidPosition = (game,kid) => {
  const a=game.stage.nodes[kid.from],b=game.stage.nodes[kid.to];
  const t=1-kid.remaining/EDGE_TICKS;
  return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
};
const $ = (id) => document.getElementById(id);
let model, lang='ja', speed=0.8, selected=0;
let frameLast=0, accumulator=0, eventPointer=0;
let best=[0,0,0];
const T=(ja,en)=>lang==='ja'?ja:en;
const asText=(str)=>String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
function loadRecords() {
  try {
    const data=JSON.parse(localStorage.getItem('route-defense.v02')||'null');
    if(Array.isArray(data?.best)) best=best.map((_,i)=>data.best[i]===3?3:0);
    if(data?.lang==='en') lang='en';
  } catch {}
}
function saveRecords() {
  try { localStorage.setItem('route-defense.v02', JSON.stringify({best,lang})); } catch {}
}
function switchStage(index) {
  selected=Math.min(2,Math.max(0,index));
  model=new RouteGame(ROUTE_STAGES[selected]);
  accumulator=0; eventPointer=0; frameLast=0;
  buildShell(); draw();
}
function nextDirection(id) {
  const to=destination(model,id);
  return to==='G'?T('森の出口','Exit'):to==='W'?T('魔女の家','Witch cottage'):T('迂回路','Detour')+' '+to;
}
function buildShell() {
  const stage=model.stage;
  $('route-app').innerHTML=[
    '<header class="topbar"><a class="back" href="./">'+T('← もとの10ステージ','← Classic 10 stages')+'</a>',
    '<strong>TRICK <em>OR</em> DETOUR!</strong><button data-action="language" class="lang">'+(lang==='ja'?'EN':'日本語')+'</button></header>',
    '<main class="layout"><section class="intro"><p class="eyebrow">ROUTE DEFENSE / v0.2 PLAYTEST</p>',
    '<h1>🎃 '+T('まよい森ルートディフェンス','The winding forest')+'</h1>',
    '<p>'+T('行き止まりではなく、ぐるっと遠回り。帰りたくなった子を出口へ誘導しよう。','No dead ends. Make kids take a loop, then send the homesick ones to the exit.')+'</p>',
    '<nav class="stages" aria-label="Stage">',
    ROUTE_STAGES.map((s,i)=>'<button data-stage="'+i+'" class="'+(i===selected?'current':'')+'">0'+s.id+(best[i]?' ★':'')+'</button>').join(''),
    '</nav><h2>'+T(stage.title[0],stage.title[1])+'</h2><p class="hint">'+T(stage.hint[0],stage.hint[1])+'</p>',
    '<div class="legend"><span>🟢 '+T('森の出口','Forest exit')+'</span><span>🏠 '+T('魔女の家','Witch cottage')+'</span><span>🪧 '+T('看板はタップ','Tap to rotate')+'</span></div>',
    '<div class="side-info"><strong>'+T('子供のきもち','Children’s mood')+'</strong><p>'+T('歩いた道が長くなると「帰りたい！」に。帰りたくない子に出口を示すと、魔女の家へ向かってしまう。','After enough walking, children become homesick. Send one to the exit too early and they head for the witch cottage instead.')+'</p></div></section>',
    '<section class="play"><div class="hud"><span>'+T('ステージ','STAGE')+' <b>0'+stage.id+'</b></span>',
    '<span>'+T('お客さん','VISITORS')+' <b id="remaining">0/'+stage.threshold.length+'</b></span>',
    '<span>'+T('帰宅','SENT HOME')+' <b id="returned">0</b></span>',
    '<span>'+T('到達','AT COTTAGE')+' <b id="arrived">0</b></span></div>',
    '<div class="board"><svg id="route-map" viewBox="0 0 500 625" role="img" aria-label="'+T('森のルート図','Forest route map')+'"></svg>',
    '<div class="overlay" id="route-overlay"></div></div>',
    '<div class="toolstrip"><button class="start" data-action="start">'+T('🎃 子供たちを呼ぶ','🎃 Start parade')+'</button>',
    '<button data-action="pause">'+T('⏸ とめる','⏸ Pause')+'</button>',
    '<button data-action="speed">'+T('速度','Speed')+' ×'+speed+'</button>',
    '<button data-action="restart">'+T('↻ やりなおす','↻ Restart')+'</button></div>',
    '<p class="footnote" id="status"></p></section></main>',
    '<footer>TRICK OR DETOUR! · ROUTE EXPERIMENT 3 STAGES · '+T('試作版','PROTOTYPE')+'</footer>'
  ].join('');
}
const drawRoad=(from,to)=>{
  const a=model.stage.nodes[from],b=model.stage.nodes[to];
  return '<path d="M'+a[0]+','+a[1]+' L'+b[0]+','+b[1]+'" class="road-shadow"/>'+
    '<path d="M'+a[0]+','+a[1]+' L'+b[0]+','+b[1]+'" class="road"/>';
};
function drawSign(id) {
  const stage=model.stage, xy=stage.nodes[id],to=destination(model,id),end=stage.nodes[to];
  const angle=Math.atan2(end[1]-xy[1],end[0]-xy[0])*180/Math.PI;
  const label=nextDirection(id);
  return '<g class="sign" data-sign="'+id+'" role="button" tabindex="0" aria-label="'+asText(id+': '+label)+'">'+
    '<circle cx="'+xy[0]+'" cy="'+xy[1]+'" r="36" class="sign-hit"/>'+
    '<g transform="translate('+xy[0]+' '+xy[1]+')"><circle r="24" fill="#61472a" stroke="#eec27d" stroke-width="3"/>'+
    '<g transform="rotate('+angle+')"><path d="M-15-12H9L24 0 9 12H-15Z" fill="#ffd18a" stroke="#6b402c" stroke-width="2.5"/>'+
    '<path d="M-10 0H16" stroke="#6b402c" stroke-width="3.4"/></g></g>'+
    '<text x="'+xy[0]+'" y="'+(xy[1]+48)+'" class="sign-label">'+id+' · '+asText(label)+'</text></g>';
}
function drawKid(kid,index) {
  const xy=kidPosition(model,kid);
  const nearby=model.kids.filter(k=>k.state==='moving'&&
    Math.hypot(kidPosition(model,k)[0]-xy[0],kidPosition(model,k)[1]-xy[1])<33);
  const offset=nearby.length>1?(nearby.findIndex(k=>k.id===kid.id)-(nearby.length-1)/2)*20:0;
  const x=xy[0]+offset,y=xy[1];
  const ready=kid.walked>=kid.threshold;
  const faces=['🧙','🐈','👻'];
  const mood=ready?'🏠':'🍬';
  const msg=kid.messageUntil>model.tick?kid.message:'';
  return '<g class="visitor" transform="translate('+x+' '+y+')">'+
    '<ellipse rx="19" ry="7" cy="18" fill="#0e1d2c80"/>'+
    '<circle r="22" fill="'+(ready?'#8ddcc8':'#fbd6a0')+'" stroke="#482e4a" stroke-width="3"/>'+
    '<text x="0" y="10" class="kid-emoji">'+faces[index%3]+'</text>'+
    '<text x="27" y="-17" class="mood">'+mood+'</text>'+
    '<rect x="-22" y="25" width="44" height="6" rx="3" fill="#382b46"/>'+
    '<rect x="-22" y="25" width="'+Math.min(44,44*kid.walked/kid.threshold)+'" height="6" rx="3" fill="'+(ready?'#5bc7a4':'#efaf53')+'"/>'+
    (msg?'<g class="bubble"><rect x="-42" y="-61" width="84" height="23" rx="11"/><text y="-45">'+asText(T(msg,msg==='帰りたい！'?'Want home!':'Not yet!'))+'</text></g>':'')+
    '</g>';
}
function draw() {
  if(!model || !$('route-map')) return;
  const stage=model.stage;
  const roads=stage.edges.map(([a,b])=>drawRoad(a,b)).join('');
  const houses=Object.entries(stage.nodes).map(([id,xy])=>{
    if(id==='G')return '<g transform="translate('+xy[0]+' '+xy[1]+')"><circle r="31" fill="#235e53" stroke="#a4ffcc" stroke-width="3"/><text class="site-icon" y="10">🚪</text><text class="landmark" y="51">'+T('森の出口','EXIT')+'</text></g>';
    if(id==='W')return '<g transform="translate('+xy[0]+' '+xy[1]+')"><circle r="35" fill="#5c365c" stroke="#ffbf70" stroke-width="3"/><text class="site-icon" y="11">🏠</text><text class="landmark" y="54">'+T('魔女の家','COTTAGE')+'</text></g>';
    return '';
  }).join('');
  const pathIcons=Object.entries(stage.fixed).map(([id,target])=>{
    const a=stage.nodes[id],b=stage.nodes[target];
    const angle=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;
    return '<g transform="translate('+a[0]+' '+a[1]+') rotate('+angle+')"><path d="M-9-7H3L12 0 3 7H-9" stroke="#ffe9a3" stroke-width="3" fill="none"/></g>';
  }).join('');
  $('route-map').innerHTML='<g class="roads">'+roads+'</g>'+houses+pathIcons+
    Object.keys(stage.signs).map(drawSign).join('')+
    model.kids.filter(k=>k.state==='moving').map(drawKid).join('');
  $('remaining').textContent=model.spawned+' / '+stage.threshold.length;
  $('returned').textContent=model.returned;
  $('arrived').textContent=model.arrived;
  $('status').textContent=model.phase==='ready'?T('看板はスタート前にも回せるよ。','You can turn signs before starting.'):
    model.phase==='playing'?T('看板の向きは子供が分岐に着く瞬間に決まる。','The sign is read the moment a child reaches the junction.'):
    model.phase==='paused'?T('時間停止中','The forest is paused'):
    model.phase==='won'?T('大成功！ 全員おうちに帰った！','Success! Everyone went home!'):
    T('魔女の家に到着されちゃった！','Someone reached the witch cottage!');
  const action=$('route-overlay');
  if(model.phase==='won'||model.phase==='lost') {
    if(action.dataset.phase!==model.phase) {
      action.dataset.phase=model.phase;
      action.innerHTML='<div class="result"><span class="result-big">'+(model.phase==='won'?'🎉':'🍬')+'</span><h2>'+
        (model.phase==='won'?T('みんな帰っちゃった！','Everybody went home!'):T('トリック・オア・トリート！','Trick or treat!'))+
        '</h2><p>'+(model.phase==='won'?T('ぐるっと迂回、大成功！','That was quite a detour!'):T('看板の切替タイミングを工夫してみよう。','Try a different sign timing.'))+
        '</p><button data-action="'+(model.phase==='won'?'next':'restart')+'">'+(model.phase==='won'?T('次のステージ →','Next stage →'):T('もう一度','Retry'))+'</button></div>';
    }
    if(model.phase==='won'&&!best[selected]) { best[selected]=3;saveRecords(); }
  } else if(model.phase==='paused'){
    if(action.dataset.phase!=='paused') {action.dataset.phase='paused';action.innerHTML='<div class="result"><h2>'+T('ひとやすみ','Paused')+'</h2><button data-action="pause">'+T('つづける','Continue')+'</button></div>';}
  } else {action.dataset.phase=model.phase;action.innerHTML='';}
  const start=document.querySelector('[data-action="start"]');
  if(start) {start.disabled=model.phase!=='ready';start.textContent=model.phase==='ready'?T('🎃 子供たちを呼ぶ','🎃 Start parade'):T('パレード中','Parade started');}
}
function bootstrap() {
  loadRecords();
  switchStage(0);
  $('route-app').addEventListener('click',e=>{
    const target=e.target.closest('[data-sign],[data-stage],[data-action]');
    if(!target)return;
    if(target.dataset.sign) { if(model.turn(target.dataset.sign)) draw();return; }
    if(target.dataset.stage!==undefined) { switchStage(Number(target.dataset.stage));return; }
    const action=target.dataset.action;
    if(action==='start')model.start();
    if(action==='pause')model.pause();
    if(action==='restart')switchStage(selected);
    if(action==='next')switchStage((selected+1)%ROUTE_STAGES.length);
    if(action==='speed') {speed=speed===0.8?1:0.8;target.textContent=T('速度','Speed')+' ×'+speed;}
    if(action==='language') {lang=lang==='ja'?'en':'ja';saveRecords();buildShell();}
    draw();
  });
  $('route-app').addEventListener('keydown',e=>{
    const target=e.target.closest('[data-sign]');
    if(target&&(e.key==='Enter'||e.key===' ')){e.preventDefault();model.turn(target.dataset.sign);draw();}
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden&&model.phase==='playing')model.pause();
    accumulator=0;frameLast=0;draw();
  });
  function frame(now) {
    const delta=frameLast?Math.min(100,now-frameLast):0;
    frameLast=now;
    if(model.phase==='playing'){
      accumulator+=delta*speed;
      while(accumulator>=1000/60&&model.phase==='playing'){model.step(1);accumulator-=1000/60;}
    } else accumulator=0;
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
if (typeof document!=='undefined' && document.getElementById('route-app')) bootstrap();
