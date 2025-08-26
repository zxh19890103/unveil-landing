import * as THREE from "three";
import { __lights__, whenReady } from "@/_shared/SoCFramework.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";

whenReady((world) => {
  const data = {
    arr: [],
    name: {
      first: "zhang",
      last: "xinghai",
    },
  };

  const notify = (p: string | symbol, path: string) => {
    console.log(`${String(p)} changed`, path);
  };

  const proxyArray = (arr, path, cache) => {
    return new Proxy(arr, {
      get(target, p, receiver) {
        const value = target[p];
        if (Object.getPrototypeOf(value) === Array.prototype) {
          const proxy = proxyArray(target[p], `${path}/${String(p)}`, cache);
          cache.set(value, proxy);
          return proxy;
        } else if (Object.getPrototypeOf(value) === Object.prototype) {
          const proxy = proxyComplex(target[p], `${path}/${String(p)}`, cache);
          cache.set(value, proxy);
          return proxy;
        } else {
          return target[p];
        }
      },
      set(target, p, val, receiver) {
        console.log("set", p, receiver);
        target[p] = val;
        notify(p, `${path}/${String(p)}`);
        return true;
      },
    });
  };

  const proxyComplex = (data, path, cache) => {
    return new Proxy(data, {
      get(target, p, receiver) {
        const value = target[p];

        if (cache.has(value)) {
          return cache.get(value);
        }

        if (Object.getPrototypeOf(value) === Array.prototype) {
          const proxy = proxyArray(target[p], `${path}/${String(p)}`, cache);
          cache.set(value, proxy);
          return proxy;
        } else if (Object.getPrototypeOf(value) === Object.prototype) {
          const proxy = proxyComplex(target[p], `${path}/${String(p)}`, cache);
          cache.set(value, proxy);
          return proxy;
        } else {
          return target[p];
        }
      },
      set(target, p, val, receiver) {
        target[p] = val;
        notify(p, `${path}/${String(p)}`);
        return true;
      },
    });
  };

  const createProxy = (data: any) => {
    const proxyCache = new WeakMap();
    const data2 = proxyComplex(data, "", proxyCache);
    return data2;
  };

  const data2 = createProxy(data);

  data2.arr = [12, 121];
  data2.name.first = "singhi";

  const loader = new SVGLoader();
  loader.load("/quickdemo/harbor3d/map.svg", (data) => {
    const group = new THREE.Group();

    group.scale.setScalar(0.01);

    const { paths } = data;

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      // Get the points from the path
      const points = path.currentPath.getPoints();

      // Create a BufferGeometry and set its attributes
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      // Define a material for the line
      const material = new THREE.LineBasicMaterial({
        color: path.color,
        linewidth: 1, // Note: linewidth is not supported in most browsers
      });

      // Create the line and add it to the group
      const line = new THREE.Line(geometry, material);
      group.add(line);
    }

    const box = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3();
    console.log(box.getSize(size));

    world.add(group);
  });
});
