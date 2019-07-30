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
    case 'march': {
      const offsets = [];
      const _alloc = (constructor, size) => {
        const offset = self.LocalModule._doMalloc(size * constructor.BYTES_PER_ELEMENT);
        const b = new constructor(self.LocalModule.HEAP8.buffer, self.LocalModule.HEAP8.byteOffset + offset, size);
        b.offset = offset;
        offsets.push(offset);
        return b;
      };
      const _freeAll = () => {
        for (let i = 0; i < offsets.length; i++) {
          self.LocalModule._doFree(offsets[i]);
        }
      };

      const {dims: dimsData, potential: potentialData, shift: shiftData} = data;
      const dims = _alloc(Int32Array, 3);
      dims[0] = dimsData[0];
      dims[1] = dimsData[1];
      dims[2] = dimsData[2];
      const potential = _alloc(Float32Array, potentialData.length);
      potential.set(potentialData);
      const shift = _alloc(Float32Array, 3);
      shift[0] = shiftData[0];
      shift[1] = shiftData[1];
      shift[2] = shiftData[2];
      const indexOffset = 0;
      const positions = _alloc(Float32Array, 1024*1024/Float32Array.BYTES_PER_ELEMENT);
      const faces = _alloc(Uint32Array, 1024*1024/Uint32Array.BYTES_PER_ELEMENT);
      const positionIndex = _alloc(Uint32Array, 1);
      const faceIndex = _alloc(Uint32Array, 1);
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
      _freeAll();
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
