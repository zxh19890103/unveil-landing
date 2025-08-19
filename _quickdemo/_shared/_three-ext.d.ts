import * as THREE from "three";

declare module "three" {
  interface Object3D {
    /**
     * Whether this object can be cast by Ray caster.
     */
    __$interactive: boolean;
  }
}
