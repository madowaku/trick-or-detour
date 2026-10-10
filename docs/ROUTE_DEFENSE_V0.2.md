# TRICK OR DETOUR! v0.2: Winding Forest Route Defense

## Play

From the Vite development server:
- http://localhost:5174/route-v02.html
- Or click **NEW まよい森ルートディフェンス v0.2** from the original title screen.

To run:

~~~sh
npm ci
npm run dev -- --port 5174
node --test tests/route-v02.test.mjs
npm run verify
~~~

Static files are included in the Vite production dist automatically because they live in public/.

## Rule changes

The v0.1 ten-stage mode is preserved. This is a separate **three-stage experiment** with its own record key \`route-defense.v02\` in localStorage.

### Win and loss
- Children spawn from the forest gate (G), initially searching for the witch's cottage (W).
- **Long routes**, not dead ends, make children homesick. Every traversed edge increments walking progress.
- Walking distance needed to become homesick differs by stage / child.
- After a child becomes homesick, actively point the sign toward **the gate G** and lead them out of the forest. Only then is that child safely returned.
- A child sent toward G *before* becoming homesick refuses to leave and instead heads to W. This rule must be taught clearly to avoid a trivial permanent exit arrow.
- Any child reaching W loses the stage.
- Signs act instantly; a child's current road is locked after passing a junction.
- All links are real graph edges. Paths in each stage contain cycles. No dead-end memory logic.

### Controls
- Tap/click the glowing arrow at a junction to cycle directions.
- Set signs before starting or change signs in real time.
- Start, pause, retry, 0.8×/1× speed, switch Japanese/English.
- 360px wide mobile and desktop are supported as responsive targets; real-device testing still required.

## Stages
1. **ぐるっと一周**: one loop, one child, one rotatable sign. Walked edges required: 4.
2. **大回り、小回り**: a short 2-edge loop and a longer 4-edge loop. Required: 5.
3. **迷子の大行進**: three children with thresholds 4/6/4, two loops, shared sign A and exit sign J. Spawn spacing: 210 ticks.

Default logical travel time = 156 ticks per edge at 60 ticks/s. Default playback tempo = 0.8×; can switch to 1×.

## Deterministic solutions
Tick values are simulation ticks, **not** milliseconds. Confirm with node tests before shipping.

1. Stage 1: before starting A once (W→B). After tick 200, A once (B→G). Win when child travels G→A→B→C→A→G.
2. Stage 2: before starting A twice (W→B→C). After tick 200, A once (C→G). Win via long loop.
3. Stage 3: before starting A once (J→B) and J once (W→G). Tick 590: A twice (B→D→J). Tick 670: A twice (J→B→D). Tick 900: A once (D→J). The first and third kids go home via J; the middle one gets a longer lap. This exact action sequence is enforced by the automated test.

**Important:** Re-run solutions after modifying rules; existence of a scripted solution is not a substitute for human playfeel.

## Main question

Can the player anticipate a returning child, switch a sign **at the right junction**, and enjoy seeing them escape via the exit? Compare against the old stage 001–010 mode.

### Human-playtest prompts
- Do you enjoy recognizing that the child has returned to a familiar place?
- Is the homesick meter and its color change visible?
- Can you tell the cottage and the gate apart on a 360×800 screen?
- Are loop directions legible?
- Can you complete Stage 1 without reading a tick-perfect walkthrough?
- In Stage 3, do mixed timelines feel strategic or frantic?

## Not in this prototype
Candy, ghosts, prank kids, lanterns, narrative bosses, ten finished levels. Only reintroduce after loop-route core feels good. Decoration uses the existing forest background and lightweight SVG/emoji symbols; advanced sprites and animation can be ported from v0.1.

## Status
Implemented in a feature branch for review. Automated tests and device/browser QA results must be checked before claiming completion.
