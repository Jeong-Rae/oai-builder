import { readFile } from 'node:fs/promises';

const directions = {
  up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0],
};

const mapPath = process.argv[2] ?? 'maps/001.map';
const map = JSON.parse(await readFile(mapPath, 'utf8'));

function initialState() {
  return {
    entities: Object.fromEntries(map.objects.map((object) => [
      object.kind === 'player' ? 'player' : object.id,
      { ...object, id: object.kind === 'player' ? 'player' : object.id,
        position: { ...object.position }, controls: object.kind === 'player' ? Object.keys(directions) : [] },
    ])),
    plateStates: Object.fromEntries(map.tiles.flatMap((row, y) =>
      row.flatMap((tile, x) => tile === 'plate' ? [[`${x},${y}`, 'inactive']] : []))),
    status: 'playing',
  };
}

function key(state) {
  return JSON.stringify([
    Object.values(state.entities).sort((a, b) => a.id.localeCompare(b.id)).map((entity) =>
      [entity.id, entity.position.x, entity.position.y, [...entity.controls].sort()]),
    Object.entries(state.plateStates).sort(), state.status,
  ]);
}

function nextState(state, direction) {
  const owner = Object.values(state.entities).find((entity) => entity.controls.includes(direction));
  if (!owner || owner.kind === 'anchor') return null;

  const [dx, dy] = directions[direction];
  const target = { x: owner.position.x + dx, y: owner.position.y + dy };
  const tileAt = (position) => map.tiles[position.y]?.[position.x];
  const entityAt = (position) => Object.values(state.entities).find((entity) =>
    entity.position.x === position.x && entity.position.y === position.y);
  const gateOpen = Object.values(state.plateStates).includes('active');

  if (!tileAt(target) || tileAt(target) === 'blank' || tileAt(target) === 'wall'
    || (tileAt(target) === 'gate' && !gateOpen)) return null;

  const targetEntity = entityAt(target);
  const next = structuredClone(state);
  if (targetEntity) {
    if (owner.kind === 'swapper' || targetEntity.kind === 'swapper') {
      const controls = [...next.entities[owner.id].controls];
      next.entities[owner.id].controls = [...next.entities[targetEntity.id].controls];
      next.entities[targetEntity.id].controls = controls;
    } else {
      next.entities[owner.id].controls = next.entities[owner.id].controls.filter((item) => item !== direction);
      next.entities[targetEntity.id].controls.push(direction);
    }
    return next;
  }

  let destination = target;
  if (tileAt(target) === 'wormhole') {
    destination = map.tiles.flatMap((row, y) => row.flatMap((tile, x) =>
      tile === 'wormhole' && (x !== target.x || y !== target.y) ? [{ x, y }] : []))[0];
    if (!destination || entityAt(destination)) return null;
  }

  const moving = next.entities[owner.id];
  const fromTile = tileAt(moving.position);
  moving.position = destination;
  if (moving.kind === 'normal') {
    if (fromTile === 'plate') next.plateStates[`${owner.position.x},${owner.position.y}`] = 'inactive';
    if (tileAt(destination) === 'plate') next.plateStates[`${destination.x},${destination.y}`] = 'active';
  }
  if (moving.kind === 'player' && tileAt(destination) === 'exit') next.status = 'completed';
  return next;
}

const queue = [{ state: initialState(), path: [] }];
const visited = new Set([key(queue[0].state)]);
let expanded = 0;

for (let head = 0; head < queue.length; head += 1) {
  const { state, path } = queue[head];
  expanded += 1;
  if (state.status === 'completed') {
    console.log(`path: ${path.join(' ')}`);
    console.log(`moves: ${path.length}`);
    console.log(`expanded states: ${expanded}`);
    process.exit(0);
  }
  for (const direction of Object.keys(directions)) {
    const next = nextState(state, direction);
    if (!next || visited.has(key(next))) continue;
    visited.add(key(next));
    queue.push({ state: next, path: [...path, direction] });
  }
}

console.log('path: none');
console.log(`expanded states: ${expanded}`);
process.exitCode = 1;
