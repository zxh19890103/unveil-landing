import * as THREE from "three";
import { createPopup, createTooltip } from "./tooltip.js";

function tooltip<O extends THREE.Object3D>(this: O, tooltip: Tooltip<O>) {
  createTooltip(this, tooltip);
}

function popup<O extends THREE.Object3D>(this: O, tooltip: Tooltip<O>) {
  createPopup(this, tooltip);
}

Object.defineProperty(THREE.Object3D.prototype, "tooltip", {
  value: tooltip,
});

Object.defineProperty(THREE.Object3D.prototype, "popup", {
  value: popup,
});
