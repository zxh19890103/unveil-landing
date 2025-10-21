import type React from "react";
import * as THREE from "three";

declare module "three" {
  /**
   * Represents an extended Three.js Object3D with additional interaction and UI capabilities.
   *
   * @interface Object3D
   * @property {string} $$type - The type identifier for the 3D object
   * @property {string} $$displayName - The display name of the 3D object
   * @property {boolean} __$interactive - Determines if the object can be interacted with via raycasting
   * @property {InteractiveStyle} __$hoverStyle - The style applied when hovering over the object
   * @property {Record<string, any>} __$forUserData - Custom user data storage
   * @property {VoidFunction} __$tooltipUpdate - Callback function for updating tooltip
   * @property {VoidFunction} __$popupUpdate - Callback function for updating popup
   * @property {VoidFunction} __$infoUpdate - Callback function for updating info panel
   *
   * @method tooltip - Attaches a tooltip to the 3D object
   * @template O - Type extending Object3D
   * @param {Tooltip<O>} def - Tooltip definition
   *
   * @method popup - Attaches a popup to the 3D object
   * @template O - Type extending Object3D
   * @param {Tooltip<O>} def - Popup definition
   *
   * @method info - Attaches an info panel to the 3D object
   * @template O - Type extending Object3D
   * @param {Tooltip<O>} def - Info panel definition
   */
  interface Object3D {
    readonly $$type: string;
    readonly $$displayName: string;
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

    showDanger(ms?: number): void;
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
