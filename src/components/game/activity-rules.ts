/** Pure activity rules shared by the scene and its controls. */
export const raceGates = [
  { x: -303, z: 106 },
  { x: -270, z: 68 },
  { x: -230, z: 95 },
  { x: -245, z: 145 },
  { x: -290, z: 115 },
];
export const circuitSequence = [0, 2, 1, 3, 2, 0] as const;
export function circuitStep(step: number, button: number) {
  return button === circuitSequence[step] ? step + 1 : -1;
}
export function signalScore(position: number) {
  return Math.max(0, Math.round(100 - Math.abs(position - 0.5) * 200));
}
export function crabPosition(time: number) {
  return {
    x: 364 + Math.sin(time * 0.65) * 5,
    z: 250 + Math.sin(time * 0.4) * 4,
  };
}
