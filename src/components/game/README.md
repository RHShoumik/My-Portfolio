# The archipelago

Four distinct portfolio environments share the same sailing, walking, swimming and buggy controls.

- Skills: tropical workshop. Press R nearby for a circuit-memory game and skill notes.
- Experience: industrial shipyard. Career archive and a five-gate harbor sprint. The timer begins at the first gate; the last gate finishes it. Best time lasts for the current visit.
- Travel: wooded campsite. Travel journal and crab photography on the southeastern beach. Approach within seven meters, frame the crab, then press P or use the camera button. Download the PNG from the journal.
- Contact: rocky lighthouse and radio station. Tune the signal and use email, LinkedIn or GitHub links. These open the relevant destinations; no messages are submitted automatically.

WASD/arrows move, mouse drag orbits, wheel zooms, double-click resets. E changes between shore and boat, Q switches between shore and swimming/buggy, F changes vehicle. On touch devices use the joystick and buttons; drag the open scene to orbit. A destination selector, route markers, and desktop minimap help navigation across the widely spaced islands. R and activity buttons open native modal dialogs; movement stops until closed. Activities are optional.

## Implementation

`world.ts` owns island footprints, ground heights and major landmark collision bounds. `archipelago.tsx` uses the same ground function for terrain and scenery. `sea.tsx` mirrors the footprint formula for coastal foam. Change all three together when introducing a new footprint family.

`activity-rules.ts` holds pure game rules. `activities.tsx` owns the scene interactions, optional activity state and accessible dialog UI. All timers and animation frames are cleaned up on unmount. Photo capture only renders the local game scene; it sends nothing to a server. Record times and postcards are session-memory data.

Geometry and texture resources created by the new procedural detail components are disposed when unmounted. Grass uses instancing; tree leaves are combined into one canopy mesh. Water geometry and device pixel ratio are capped for GPU cost.

## Verification

Run:

    node --test tests/island.test.mjs
    npx tsc --noEmit --incremental false
    npx eslint src/components/game tests/island.test.mjs

Tests cover shoreline launches/landings, terrain agreement, race gate clearance, crab habitat, circuit outcomes, radio scoring and landmark access. They do not establish rendered appearance or frame rate. Browser playtesting remains required, especially on mobile and lower-powered GPUs. The models are procedural, not scanned or artist-authored photorealistic assets. Collision bounds cover major landmarks, not every decorative prop.
