import * as THREE from "three";

declare module "three" {
  interface Object3D {
    /**
     * Whether this object can be cast by Ray caster.
     */
    __$interactive: boolean;
    __$hoverStyle: InteractiveStyle;
  }

  interface Object3DEventMap extends InteractiveEventMap {}
}

declare global {
  type InteractiveStyle = {
    color?: THREE.ColorRepresentation;
    opacity?: number;
    scale?: number;
  };

  type InteractiveEventMapPayload = {
    payload: any;
  };

  interface InteractiveEventMap {
    click: InteractiveEventMapPayload;
    select: InteractiveEventMapPayload;
    mousein: InteractiveEventMapPayload;
    mouseout: InteractiveEventMapPayload;
    mousemove: InteractiveEventMapPayload;
  }

  type InteractiveEventType = keyof InteractiveEventMap;
}
