import * as THREE from "three";

export const createUserDataProxy = (
  obj: THREE.Object3D,
  rate: number = 500
) => {
  if (obj.__$forUserData !== undefined) {
    console.log("Proxy for userData has created!");
    return;
  }

  const userData = obj.userData;
  let lastRenderAt = performance.now();

  obj.__$forUserData = userData;

  obj.userData = new Proxy(userData, {
    get: (target, p, receiver) => {
      return target[p as string];
    },
    set: (target, p, newValue, receiver) => {
      target[p as string] = newValue;

      const now = performance.now();
      if (now - lastRenderAt > rate) {
        obj.__$popupUpdate?.();
        obj.__$tooltipUpdate?.();
        obj.__$infoUpdate?.();

        lastRenderAt = now;
      } else {
      }
      return true;
    },
  });
};

export const checkIfUserDataProxyIsNoNeed = (obj: THREE.Object3D) => {
  if (
    obj.__$popupUpdate === null &&
    obj.__$tooltipUpdate === null &&
    obj.__$infoUpdate === null
  ) {
    obj.userData = obj.__$forUserData;
  }
};
