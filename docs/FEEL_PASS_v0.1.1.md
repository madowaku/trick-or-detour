# Feel Pass v0.1.1: human playtest fixes

Status: **proposed / requires local verification and actual Android playtest**. This is not a QA pass.

## Reported problems (2026-10-10)
- Kids too large and fast; overlap hides identities.
- Narrow play area; turning signs feels laggy.
- Human player blocked on Stage 005 although the scripted solution passes.
- The board looks very similar through all ten stages.

## Implemented on this branch
1. Default game tempo is 0.7× (real-time only; logical 60 Hz ticks and all deterministic outcomes remain unchanged). Button toggles 0.7× / 1×.
2. Manual sign cooldown 36 → 9 simulation ticks (0.60 → 0.15 game-time seconds). During default 0.7× speed this is about 0.21 real-time seconds.
3. Render kids 72 → 48 map units. Children of the same type and travel phase within 26 map units render as a single token with a ×N badge. Different groups in the same area get a lateral display offset. No changes to simulation identity or decisions.
4. Compact mobile game-only header, HUD and helper chrome for a larger visible board.
5. Chapter mood tints for 001–003 / 004–006 / 007–009 / 010. This is only an initial visual distinction, not new maps.
6. Stage 005 is a lower-pressure introduction to pranksters: normal / prankster / normal, tolerance 1. One preparatory turn of J toward D2 lets the first child take D2; the prankster rotates the sign toward D1 for the next two. No reflex-timing is required.

## Required acceptance steps
- Run `npm ci && npm run verify`: typecheck, build, entire test suite and all stage solution replays must pass.
- Stage 005 manual: rotate J once before Start, start, see all 3 kids return, earn 3 stars.
- Stage 003, 004, 008, 009, 010: human-play at 0.7×, then opt-in 1×; judge readable anticipation and ability to finish without knowing tick times.
- On 360×800 and 720×1280, validate touch targets, actual forest occupancy, crowd badges and counter consistency.
- On Android A401OP, compare to main: no accidental double taps, sign feedback within roughly 0.2 real seconds, pause/restart/speed transitions work.
- Check no layout overflow at 360×800 with Japanese *and* English.
- Check for visual state conflicts: adjacent kids, multiple messages, prankster flipping and kid entering the cottage.
- Ensure all dark chapter tints leave roads, signs and child types visible.
- Update screenshots and verification doc *after* visual QA.

## Design gate
Only after human feel improves, expand true stage variety by changing terrain/route silhouette and sign positions, not merely color grading. Keep the sign manipulation readable and stage solutions re-verified.

## Caveats
MVP v0.1's `docs/VERIFICATION.md` describes the previous shipped behavior, especially the old Stage 005 solution and 0.6-second cooldown. This document does not claim the revised branch has been tested.
