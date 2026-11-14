import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const require = createRequire(import.meta.url);
async function loadSource(name) {
  const source = await readFile(
    new URL(`../src/components/game/${name}.ts`, import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const resolved = outputText.replace(
    'from "three"',
    `from "${pathToFileURL(require.resolve("three")).href}"`,
  );
  return import(
    `data:text/javascript;base64,${Buffer.from(resolved).toString("base64")}`
  );
}
const world = await loadSource("world");
const rules = await loadSource("activity-rules");

test("all island shorelines support launching, landing, and matching terrain", () => {
  for (const island of world.islands) {
    assert(world.heightAt(island.cx, island.cz) >= island.top);
    for (let n = 0; n < 72; n++) {
      const angle = (n * Math.PI) / 36;
      const radius =
        island.r + 2 * Math.sin(angle * 3) + 1.2 * Math.cos(angle * 5);
      const x = island.cx + Math.cos(angle) * radius * island.sx;
      const z = island.cz + Math.sin(angle) * radius * island.sz;
      const [nx, nz] = world.shoreNormal(x, z);
      assert(Math.abs(world.islandDistance(island, x, z)) < 1e-8);
      assert(
        world.landSDF(x + nx * 4, z + nz * 4) > 2.4,
        `${island.id} launch`,
      );
      assert(
        world.heightAt(x - nx * 2, z - nz * 2) !== null,
        `${island.id} landing`,
      );
      assert(Math.abs(world.islandGround(island, x, z) - 0.6) < 1e-8);
    }
  }
});
test("race gates are navigable by boat and crab never enters water", () => {
  for (const gate of rules.raceGates) assert(world.landSDF(gate.x, gate.z) > 5);
  for (let t = 0; t < 200; t += 0.2) {
    const p = rules.crabPosition(t);
    assert(world.heightAt(p.x, p.z) !== null);
  }
});
test("circuit rejects wrong presses, advances correct presses, and completes", () => {
  let step = 0;
  for (const button of rules.circuitSequence) {
    assert.equal(rules.circuitStep(step, (button + 1) % 4), -1);
    step = rules.circuitStep(step, button);
  }
  assert.equal(step, rules.circuitSequence.length);
});
test("radio rewards the center and scores both extremes symmetrically", () => {
  assert.equal(rules.signalScore(0.5), 100);
  assert.equal(rules.signalScore(0), 0);
  assert.equal(rules.signalScore(1), 0);
  assert.equal(rules.signalScore(0.4), rules.signalScore(0.6));
});
test("landmark collision blocks interiors but leaves interaction points accessible", () => {
  for (const item of world.obstacles)
    assert(world.blockedByProp(item.x, item.z, 0.35));
  for (const [x, z] of [
    [24, 216],
    [-165, 135],
    [182, 142],
    [30, 413],
  ]) {
    assert(world.heightAt(x, z) !== null);
    assert(!world.blockedByProp(x, z, 0.35));
  }
});
