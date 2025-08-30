import * as THREE from "three";
import { setPopupObject } from "./tooltip.js";
import gsap from "gsap";
import type { Persipective } from "@/harbor3d/state.js";

type CreateInteractiveEmitterEventMap = {
  click: {
    obj: THREE.Object3D;
  };
};

export const createInteractive = (
  context: WithActiveCamera,
  docElement: HTMLDivElement
) => {
  const coords = new THREE.Vector2();
  const caster = new THREE.Raycaster();

  caster.params.Line.threshold = 0.01;

  const sorter = (a: THREE.Intersection, b: THREE.Intersection) =>
    a.distance - b.distance;

  const onCurrentTargetSet = (target: THREE.Object3D) => {
    currentTarget = target;
    setPopupObject(target);
  };

  const findTarget = (hit: THREE.Object3D, instanceId: number) => {
    let target = hit;

    while (target && target.__$interactive !== true) {
      target = target.parent;
    }

    return target ?? null;
  };

  const fire = (
    obj: THREE.Object3D,
    event: InteractiveEventType,
    payload: any = null
  ) => {
    obj.dispatchEvent({ type: event, payload });
  };

  const hoverData = new WeakMap<THREE.Object3D, any>();
  const meaure = new THREE.Box3();
  const meaureSize = new THREE.Vector3();

  const hover2 = (obj: THREE.Object3D, mousein: boolean) => {
    if (obj.__$hoverStyle === undefined) return;

    if (mousein) {
      if (obj.__$hoverStyle === "outlined") {
        meaure.setFromObject(obj);
        meaure.getSize(meaureSize);

        const outlined = new THREE.Mesh(
          new THREE.BoxGeometry(meaureSize.x, meaureSize.y, meaureSize.z),
          new THREE.MeshBasicMaterial({
            color: 0x23ef90,
            wireframe: true,
            depthTest: false,
          })
        );

        obj.add(outlined);
        hoverData.set(obj, outlined);
      } else {
      }
    } else {
      if (obj.__$hoverStyle === "outlined") {
        if (hoverData.has(obj)) {
          obj.remove(hoverData.get(obj));
        }
      } else {
      }
    }
  };
  const hover = (...args) => {};

  const cast = () => {
    const intersections = caster.intersectObject(context.scene, true);
    intersections.sort(sorter);
    const intersection = intersections[0];

    const nextTarget =
      intersection === undefined
        ? null
        : (findTarget(
            intersection.object,
            intersection.instanceId
          ) as THREE.Object3D);

    if (currentTarget === nextTarget) {
      // keep
    } else {
      // mutation
      if (nextTarget === null) {
        fire(currentTarget, "mouseOut");
        hover(currentTarget, false);

        docElement.style.cursor = "default";
      } else {
        if (currentTarget === null) {
          fire(nextTarget, "mouseIn");
          hover(nextTarget, true);
        } else {
          fire(currentTarget, "mouseOut");
          hover(currentTarget, false);
          fire(nextTarget, "mouseIn");
          hover(nextTarget, true);
        }

        docElement.style.cursor = "pointer";
      }

      onCurrentTargetSet(nextTarget);
    }
  };

  const enter = () => {
    docElement.addEventListener("pointermove", move);
    docElement.addEventListener("pointerleave", leave);
    docElement.addEventListener("pointerdown", down);
    docElement.addEventListener("pointerup", up);
  };

  const leave = () => {
    isDown = false;
    docElement.style.cursor = "default";
    onCurrentTargetSet(null);

    docElement.removeEventListener("pointermove", move);
    docElement.removeEventListener("pointerleave", leave);
    docElement.removeEventListener("pointerdown", down);
    docElement.removeEventListener("pointerup", up);
  };

  const move = (e: PointerEvent) => {
    // smartLoop.start();

    const w = docElement.clientWidth;
    const h = docElement.clientHeight;

    const x = 2 * (e.pageX / w) - 1;
    const y = 1 - 2 * (e.pageY / h);
    coords.set(x, y);
    caster.setFromCamera(coords, context.activeCamera);

    cast();
  };

  const down = () => {
    isDown = true;
  };

  const up = () => {
    if (isDown) {
      if (currentTarget) {
        fire(currentTarget, "click");
        emitter.dispatchEvent({ type: "click", obj: currentTarget });
      }

      isDown = false;
    }
  };

  const enable = () => {
    enter();
    docElement.addEventListener("pointerenter", enter);
  };

  const disable = () => {
    leave();
    docElement.removeEventListener("pointerenter", enter);
  };

  let currentTarget: THREE.Object3D = null;
  let isDown = false;

  const emitter = new THREE.EventDispatcher<CreateInteractiveEmitterEventMap>();

  return {
    enable,
    disable,
    onClick(fn: (e: CreateInteractiveEmitterEventMap["click"]) => void) {
      emitter.addEventListener("click", fn);
    },
  };
};

export const createFollowing = (context: WithActiveCamera) => {
  const persipective = (p: Persipective) => {
    if (!_target) return;

    switch (p) {
      case "top": {
        _target.remove(camera);
        camera.up.set(0, 0, 1);
        camera.position.set(0, 1, 0).setLength(lookAtDist);
        camera.lookAt(lookat);
        _target.add(camera);
        break;
      }
      case "back": {
        _target.remove(camera);
        camera.up.set(0, 1, 0);
        camera.position.set(0, 1, -1).setLength(lookAtDist);
        camera.lookAt(lookat);
        _target.add(camera);
        break;
      }
      case "front": {
        _target.remove(camera);
        camera.up.set(0, 1, 0);
        camera.position.set(0, 1, 1).setLength(lookAtDist);
        camera.lookAt(lookat);
        _target.add(camera);
        break;
      }
      case "left": {
        _target.remove(camera);
        camera.up.set(0, 1, 0);
        camera.position.set(1, 1, 0).setLength(lookAtDist);
        camera.lookAt(lookat);
        _target.add(camera);
        break;
      }
      case "right": {
        _target.remove(camera);
        camera.up.set(0, 1, 0);
        camera.position.set(-1, 1, 0).setLength(lookAtDist);
        camera.lookAt(lookat);
        _target.add(camera);
        break;
      }
    }
  };

  const currentCamera = context.camera;

  const camera = new THREE.PerspectiveCamera(
    currentCamera.fov,
    currentCamera.aspect,
    currentCamera.near,
    currentCamera.far
  );

  const mearure = new THREE.Box3();
  const size = new THREE.Vector3();
  const lookat = new THREE.Vector3();
  const lookAtDist = 2;

  let _target: THREE.Object3D;

  return {
    follow: (target: THREE.Object3D) => {
      context.activeCamera = camera;
      context.controls.enabled = false;

      // don't add one object to two objects as child.
      if (_target) {
        _target.remove(camera);
      }

      _target = target;

      mearure.setFromObject(target);
      mearure.getSize(size);

      persipective("top");
    },
    unfollow: () => {
      context.controls.enabled = true;
      context.activeCamera = currentCamera;

      _target.remove(camera);
      _target = null;
    },
    persipective: persipective,
  };
};

export const createSelector = (context: WithActiveCamera) => {
  let current: THREE.Object3D;

  const hightlight = new THREE.Mesh(
    new THREE.CircleGeometry(1.1),
    new THREE.MeshBasicMaterial({
      color: 0xdf2a32,
      transparent: true,
      opacity: 0.35,
      depthTest: false,
    })
  );

  hightlight.raycast = () => {};
  hightlight.rotation.x = -Math.PI / 2;

  const timeline = gsap.timeline({});

  timeline.add(
    gsap.to(hightlight.scale, {
      x: 0.1,
      y: 0.1,
      repeat: -1,
      repeatDelay: 0,
      delay: 0,
      duration: 1.2,
      yoyo: true,
      ease: "power1.inOut",
    }),
    0
  );

  return {
    select: (target: THREE.Object3D) => {
      if (current) {
        current.remove(hightlight);
      }

      current = target;
      current.add(hightlight);

      timeline.play();
    },
    unselect: () => {
      if (!current) return;

      timeline.pause();
      current.remove(hightlight);
      current = null;
    },
  };
};
