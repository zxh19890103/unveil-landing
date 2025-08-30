import type React from "react";
import * as THREE from "three";

declare module "three" {
  interface Object3D {
    readonly $$type: string;
    /**
     * Whether this object can be cast by Ray caster.
     */
    __$interactive: boolean;
    __$hoverStyle: InteractiveStyle;

    __$forUserData: Record<string, any>;
    __$tooltipUpdate: VoidFunction;
    __$popupUpdate: VoidFunction;
    __$infoUpdate: VoidFunction;

    tooltip<O extends Object3D>(def: Tooltip<O>): void;
    popup<O extends Object3D>(def: Tooltip<O>): void;
    info<O extends Object3D>(def: Tooltip<O>): void;
  }

  interface Object3DEventMap extends InteractiveEventMap {}
}

declare global {
  type TooltipProps<O extends THREE.Object3D> = {
    obj: O;
    data: O["userData"];
  } & O["userData"];

  type Tooltip<O extends THREE.Object3D> = (
    props: TooltipProps<O>
  ) => React.ReactNode;

  type InteractiveStyle =
    | {
        color?: THREE.ColorRepresentation;
        opacity?: number;
      }
    | "outlined";

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
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    activeCamera: THREE.PerspectiveCamera;
  }
}
