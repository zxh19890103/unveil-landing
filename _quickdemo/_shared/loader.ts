import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";

const loaderManager = new THREE.LoadingManager(
  (...args) => {},
  (url, loaded, total) => {
    for (const fn of progressFns) fn(loaded, total);
  },
  () => {}
);

type OnProgressFn = (loaded: number, total: number) => void;

const progressFns: OnProgressFn[] = [];

function onLoading(fn: OnProgressFn) {
  progressFns.push(fn);
}

function onLoadingDelete(fn: OnProgressFn) {
  const index = progressFns.indexOf(fn);
  progressFns.slice(index, 1);
}

type LazyGLTF = {
  pending: boolean;
  data: GLTF;
  err: any;
  tick: number;
};

type LazyGLTFLoadFn = [(data: THREE.Group) => void, (err: any) => void];

class CacheGLTFLoader extends GLTFLoader {
  private cache: Map<string, LazyGLTF> = new Map();
  private lazyLoadFns: WeakMap<LazyGLTF, LazyGLTFLoadFn[]> = new WeakMap();

  constructor() {
    super(loaderManager);
  }

  private onLazyGltfLoad(data, load, fail) {
    const fns = this.lazyLoadFns.get(data);
    fns.push([load, fail]);
  }

  private queryGLtf(url: string) {
    return new Promise<THREE.Group>((load, fail) => {
      if (this.cache.has(url)) {
        console.log("[cache gltf:]", url);
        const data = this.cache.get(url);
        if (data.pending) {
          this.onLazyGltfLoad(data, load, fail);
        } else {
          if (data.err) {
            fail(data.err);
          } else {
            const copy = data.data.scene.clone();
            load(copy);
          }
        }
        return;
      }

      const lazyGltf: LazyGLTF = {
        data: null,
        pending: true,
        err: null,
        tick: 0,
      };

      this.cache.set(url, lazyGltf);
      this.lazyLoadFns.set(lazyGltf, []);

      // create
      super.load(
        url,
        (data) => {
          lazyGltf.pending = false;
          lazyGltf.data = data;

          for (const [_load] of this.lazyLoadFns.get(lazyGltf)) {
            const copy = data.scene.clone();
            _load(copy);
          }
          this.lazyLoadFns.delete(lazyGltf);

          const copy = data.scene.clone();
          load(copy);
        },
        () => {},
        (err) => {
          lazyGltf.pending = false;
          lazyGltf.data = null;
          lazyGltf.err = err;

          for (const [_, _fail] of this.lazyLoadFns.get(lazyGltf)) _fail(err);
          this.lazyLoadFns.delete(lazyGltf);

          fail(err);
        } // retry
      );
    });
  }

  load2(url: string) {
    return this.queryGLtf(url);
  }
}

const gltfLoader = new CacheGLTFLoader();
const textLoader = new THREE.TextureLoader(loaderManager);
const audioLoader = new THREE.AudioLoader(loaderManager);

export { textLoader, gltfLoader, audioLoader, onLoading, onLoadingDelete };
