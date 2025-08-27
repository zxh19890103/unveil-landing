import * as THREE from "three";
import { setPopupObject } from "./tooltip.js";
import gsap from "gsap";

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

  const hover = (obj: THREE.Object3D) => {
    if (obj.__$hoverStyle) {
    }
  };

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
        docElement.style.cursor = "default";
      } else {
        if (currentTarget === null) {
          fire(nextTarget, "mouseIn");
        } else {
          fire(currentTarget, "mouseOut");
          fire(nextTarget, "mouseIn");
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
  const currentCamera = context.camera;

  const camera = new THREE.PerspectiveCamera(
    currentCamera.fov,
    currentCamera.aspect,
    currentCamera.near,
    currentCamera.far
  );

  const lookat = new THREE.Vector3();

  let _target: THREE.Object3D;

  return {
    follow: (target: THREE.Object3D) => {
      context.activeCamera = camera;
      context.controls.enabled = false;

      // don't add one object to two objects as child.
      if (_target) {
        _target.remove(camera);
      }

      camera.up.set(0, 0, 1);
      camera.position.set(0, 10, 0);
      camera.lookAt(lookat);
      target.add(camera);

      _target = target;
    },
    unfollow: () => {
      context.controls.enabled = true;
      context.activeCamera = currentCamera;

      _target.remove(camera);
      _target = null;
    },
  };
};

export const createSelector = (context: WithActiveCamera) => {
  let current: THREE.Object3D;

  const hightlight = new THREE.Mesh(
    new THREE.CircleGeometry(1.4),
    new THREE.MeshBasicMaterial({
      color: 0xdf2a32,
      transparent: true,
      opacity: 0.35,
    })
  );

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
