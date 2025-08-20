import type React from "react";
import * as THREE from "three";

declare module "three" {
  interface Object3D {
    /**
     * Whether this object can be cast by Ray caster.
     */
    __$interactive: boolean;
    __$hoverStyle: InteractiveStyle;

    __$forUserData: Record<string, any>;
    __$tooltipUpdate: VoidFunction;
    __$popupUpdate: VoidFunction;

    tooltip(def: Tooltip): void;
    popup(def: Tooltip): void;
  }

  interface Object3DEventMap extends InteractiveEventMap {}
}

declare global {
  type Tooltip<O extends THREE.Object3D> = (props: {
    obj: O;
    [k: string]: any;
  }) => React.ReactNode;

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
    mouseIn: InteractiveEventMapPayload;
    mouseOut: InteractiveEventMapPayload;
    mousemove: InteractiveEventMapPayload;
  }

  type InteractiveEventType = keyof InteractiveEventMap;

  interface WithActiveCamera {
    controls: THREE.Controls;
    camera: THREE.PerspectiveCamera;
    activeCamera: THREE.PerspectiveCamera;
  }
}
