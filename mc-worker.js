/* importScripts('/archae/plugins/_core_engines_resource/serve/three.js');
const {exports: THREE} = self.module;
importScripts('/archae/assets/murmurhash.js');
const {exports: murmur} = self.module;
importScripts('/archae/assets/autows.js');
const {exports: Autows} = self.module;
importScripts('/archae/assets/alea.js');
const {exports: alea} = self.module;
self.module = {}; */

// let Module = null;
// let slab = null;
const NUM_CELLS = 8;
const OVERSCAN = 1;
const NUM_CELLS_OVERSCAN = NUM_CELLS + OVERSCAN;
const NUM_CHUNKS_HEIGHT = 10;                 
const NUM_CELLS_HEIGHT = NUM_CELLS * NUM_CHUNKS_HEIGHT;
const NUM_CELLS_OVERSCAN_Y = NUM_CELLS_HEIGHT + OVERSCAN;
let noiserOffset = 0;
self.wasmModule = (moduleName, moduleFn) => {
  // console.log('wasm module', moduleName, moduleFn);
  if (moduleName === 'mc') {
    self.LocalModule = moduleFn({
      print(text) { console.log(text); },
      printErr(text) { console.warn(text); },
      locateFile(path, scriptDirectory) {
        if (path === 'mc.wasm') {
          return 'bin/' + path;
        } else {
          return path;
        }
      },
      onRuntimeInitialized: () => {
        // Module = localModule;

        noiserOffset = self.LocalModule._doNoiser(7);

        loaded = true;
        _flushMessages();
      },
    });

    // console.log('got module', Module);
  } else {
    console.warn('unknown wasm module', moduleName);
  }
};
importScripts('bin/mc.js');

class Allocator {
  constructor() {
    this.offsets = [];
  }
  alloc(constructor, size) {
    const offset = self.LocalModule._doMalloc(size * constructor.BYTES_PER_ELEMENT);
    const b = new constructor(self.LocalModule.HEAP8.buffer, self.LocalModule.HEAP8.byteOffset + offset, size);
    b.offset = offset;
    this.offsets.push(offset);
    return b;
  }
  freeAll() {
    for (let i = 0; i < this.offsets.length; i++) {
      self.LocalModule._doFree(this.offsets[i]);
    }
    this.offsets.length = 0;
  }
}

const queue = [];
let loaded = false;
const _handleMessage = data => {
  const {method} = data;
  switch (method) {
    case 'getBiomeColors': {
      // const {x, z} = data;

      const allocator = new Allocator();

      const colors = allocator.alloc(Uint8Array, 300*300*3);

      self.LocalModule._doNoiserGetBiomeColors(
        noiserOffset,
        -150,
        150,
        -150,
        150,
        colors.offset
      );

      self.postMessage({
        result: {
          colors,
        },
      });
      allocator.freeAll();
      break;
    }
    case 'getGeometry': {
      const {x, z} = data;

      const allocator = new Allocator();

      const biomes = allocator.alloc(Uint8Array, NUM_CELLS_OVERSCAN * NUM_CELLS_OVERSCAN);
      const temperature = allocator.alloc(Uint8Array, 1);
      const humidity = allocator.alloc(Uint8Array, 1);
      const elevations = allocator.alloc(Float32Array, NUM_CELLS_OVERSCAN * NUM_CELLS_OVERSCAN);
      const ethers = allocator.alloc(Float32Array, NUM_CELLS_OVERSCAN * NUM_CELLS_OVERSCAN * NUM_CELLS_OVERSCAN_Y);
      const water = allocator.alloc(Float32Array, NUM_CELLS_OVERSCAN * NUM_CELLS_OVERSCAN * NUM_CELLS_OVERSCAN_Y);
      const lava = allocator.alloc(Float32Array, NUM_CELLS_OVERSCAN * NUM_CELLS_OVERSCAN * NUM_CELLS_OVERSCAN_Y);

      self.LocalModule._doNoiserApply(
        noiserOffset,
        x,
        z,
        biomes.offset,
        temperature.offset,
        humidity.offset,
        1,
        elevations.offset,
        1,
        ethers.offset,
        1,
        water.offset,
        lava.offset,
        1,
        0,
        0
      );

      const positions = allocator.alloc(Float32Array, 1024*1024/Float32Array.BYTES_PER_ELEMENT);
      const faces = allocator.alloc(Uint32Array, 1024*1024/Uint32Array.BYTES_PER_ELEMENT);
      // const positionIndex = allocator.alloc(Uint32Array, 1);
      // const faceIndex = allocator.alloc(Uint32Array, 1);
      const attributeRanges = allocator.alloc(Uint32Array, NUM_CHUNKS_HEIGHT * 6);
      const indexRanges = allocator.alloc(Uint32Array, NUM_CHUNKS_HEIGHT * 6);
      const colors = allocator.alloc(Float32Array, 1024*1024/Float32Array.BYTES_PER_ELEMENT);

      self.LocalModule._doNoiserFill(
        noiserOffset,
        x,
        z,
        biomes.offset,
        elevations.offset,
        ethers.offset,
        water.offset,
        lava.offset,
        positions.offset,
        faces.offset,
        attributeRanges.offset,
        indexRanges.offset,
        colors.offset,
      );
      self.postMessage({
        result: {
          biomes,
          temperature,
          humidity,
          elevations,
          ethers,
          water,
          lava,
          positions,
          faces,
          attributeRanges,
          indexRanges,
          colors,
        },
      });
      allocator.freeAll();
      break;
    }
    case 'march': {
      const allocator = new Allocator();

      const {dims: dimsData, potential: potentialData, shift: shiftData} = data;
      const dims = allocator.alloc(Int32Array, 3);
      dims[0] = dimsData[0];
      dims[1] = dimsData[1];
      dims[2] = dimsData[2];
      const potential = allocator.alloc(Float32Array, potentialData.length);
      potential.set(potentialData);
      const shift = allocator.alloc(Float32Array, 3);
      shift[0] = shiftData[0];
      shift[1] = shiftData[1];
      shift[2] = shiftData[2];
      const indexOffset = 0;
      const positions = allocator.alloc(Float32Array, 1024*1024/Float32Array.BYTES_PER_ELEMENT);
      const faces = allocator.alloc(Uint32Array, 1024*1024/Uint32Array.BYTES_PER_ELEMENT);
      const positionIndex = allocator.alloc(Uint32Array, 1);
      const faceIndex = allocator.alloc(Uint32Array, 1);
      self.LocalModule._doMarchingCubes(
        dims.offset,
        potential.offset,
        shift.offset,
        indexOffset,
        positions.offset,
        faces.offset,
        positionIndex.offset,
        faceIndex.offset
      );
      self.postMessage({
        result: {
          positions: positions.slice(0, positionIndex[0]),
          faces: faces.slice(0, faceIndex[0]),
        },
      });
      allocator.freeAll();
      break;
    }
    case 'collide': {
      const allocator = new Allocator();

      const {positions: positionsData, indices: indicesData, origin: originData, direction: directionData} = data;

      const positions = allocator.alloc(Float32Array, positionsData.length);
      positions.set(positionsData);
      const indices = allocator.alloc(Uint32Array, indicesData.length);
      indices.set(indicesData);
      const origin = allocator.alloc(Float32Array, 3);
      origin[0] = originData[0];
      origin[1] = originData[1];
      origin[2] = originData[2];
      const direction = allocator.alloc(Float32Array, 3);
      direction[0] = directionData[0];
      direction[1] = directionData[1];
      direction[2] = directionData[2];
      const result = allocator.alloc(Float32Array, 3);

      self.LocalModule._doCollide(
        positions.offset,
        indices.offset,
        positions.length,
        indices.length,
        origin.offset,
        direction.offset,
        result.offset
      );

      self.postMessage({
        result: Float32Array.from([result[0], result[1], result[2]]),
      });

      allocator.freeAll();
      break;
    }
    default: {
      console.warn('unknown method', data.method);
      break;
    }
  }
};
const _flushMessages = () => {
  for (let i = 0; i < queue.length; i++) {
    _handleMessage(queue[i]);
  }
};
self.onmessage = e => {
  const {data} = e;
  if (!loaded) {
    queue.push(data);
  } else {
    _handleMessage(data);
  }
};
