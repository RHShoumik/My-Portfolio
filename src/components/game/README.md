# The archipelago

Four distinct portfolio environments share the same sailing, walking, swimming and buggy controls.

- Skills: tropical workshop. Press R nearby for a circuit-memory game and skill notes.
- Experience: industrial shipyard. Career archive and a five-gate harbor sprint. The timer begins at the first gate; the last gate finishes it. Best time lasts for the current visit.
- Travel: wooded campsite. Travel journal and crab photography on the southeastern beach. Approach within seven meters, frame the crab, then press P or use the camera button. Download the PNG from the journal.
- Contact: rocky lighthouse and radio station. Tune the signal and use email, LinkedIn or GitHub links. These open the relevant destinations; no messages are submitted automatically.

Thrills, all started with G (or the on-screen button) when close:

- Human cannon on the dockyard: countdown, boom, a barrel-rolling flight out to sea. Best distance lasts for the visit.
- Hot-air balloon on the Skills island: a tour over every island. G jumps out; G again (or 55 m above ground) opens the parachute; steer with WASD toward the red target.
- Trampoline on the Skills island: each bounce higher, with flips. G hops off.
- Zipline from the Travel island's hill, dropping you into the sea.
- Treasure hunt: six chests (one on a raft at sea), each with a fact from the portfolio data. All six set off fireworks. Found chests are remembered in localStorage.

The first visit in a browser session opens with a camera flight over the islands (any key, click or tap skips it; skipped for reduced motion). Birds, deer, rabbits, sheep, chickens, dogs and dolphins live around the islands; animals flee the player, except the dogs, which come to say hello.

WASD/arrows move, mouse drag orbits, wheel zooms, double-click resets. E changes between shore and boat, Q switches between shore and swimming/buggy, F changes vehicle. On touch devices use the joystick and buttons; drag the open scene to orbit. A destination selector, route markers, and desktop minimap help navigation across the widely spaced islands. R and activity buttons open native modal dialogs; movement stops until closed. Activities are optional.

## Implementation

`world.ts` owns island footprints, ground heights and major landmark collision bounds. `archipelago.tsx` uses the same ground function for terrain and scenery. `sea.tsx` mirrors the footprint formula for coastal foam. Change all three together when introducing a new footprint family.

`activity-rules.ts` holds pure game rules. `activities.tsx` owns the scene interactions, optional activity state and accessible dialog UI. All timers and animation frames are cleaned up on unmount. Photo capture only renders the local game scene; it sends nothing to a server. Record times and postcards are session-memory data.

Geometry and texture resources created by the new procedural detail components are disposed when unmounted. Grass uses instancing; tree leaves are combined into one canopy mesh. Water geometry and device pixel ratio are capped for GPU cost.

`placement.ts` decides where decoration may go: never on routes, landmarks, activity spots, rides or chests (`thrills-data.ts`). `flora.tsx` draws each plant kind per island as one instanced mesh, swayed by a shared wind uniform. `wildlife.tsx` holds the birds (three instanced meshes for all of them), land animals and dolphins. `sky.tsx` is the sky dome and sun direction; `SKY` in `world.ts` is the horizon and fog colour.

`thrills.tsx` runs the rides through the `ride` object in `store.ts`: while `ride.active`, the player copies its position, pose and camera distance instead of moving itself, and `ride.release` hands control back. The rides component is mounted before the player so it writes first each frame. `intro.tsx` is mounted after the player and blends from its follow camera.

## Verification

Run:

    node --test tests/island.test.mjs
    npx tsc --noEmit --incremental false
    npx eslint src/components/game tests/island.test.mjs

Tests cover shoreline launches/landings, terrain agreement, race gate clearance, crab habitat, circuit outcomes, radio scoring and landmark access. They do not establish rendered appearance or frame rate. Browser playtesting remains required, especially on mobile and lower-powered GPUs. The models are procedural, not scanned or artist-authored photorealistic assets. Collision bounds cover major landmarks, not every decorative prop.
