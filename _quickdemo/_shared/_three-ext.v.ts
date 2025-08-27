import * as THREE from "three";
import { createInfo, createPopup, createTooltip } from "./tooltip.js";

function tooltip<O extends THREE.Object3D>(this: O, tooltip: Tooltip<O>) {
  createTooltip(this, tooltip);
}

function popup<O extends THREE.Object3D>(this: O, popup: Tooltip<O>) {
  createPopup(this, popup);
}

function info<O extends THREE.Object3D>(this: O, info: Tooltip<O>) {
  createInfo(this, info);
}

Object.defineProperty(THREE.Object3D.prototype, "tooltip", {
  value: tooltip,
});

Object.defineProperty(THREE.Object3D.prototype, "popup", {
  value: popup,
});

Object.defineProperty(THREE.Object3D.prototype, "info", {
  value: info,
});
