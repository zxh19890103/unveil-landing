import * as THREE from "three";
import React, { useEffect, useReducer, useState } from "react";
import ReactDOM from "react-dom";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

const $h = React.createElement;

type HtmlConstructProps<O extends THREE.Object3D> = {
  obj: O;
  [k: string]: any;
};
type HtmlConstruct<O extends THREE.Object3D> = (
  props: HtmlConstructProps<O>
) => React.ReactNode;

const ticker = () => {
  return performance.now();
};

const emptyDeps = [];

export class Label<F extends THREE.Object3D> extends CSS2DObject {
  private readonly container: HTMLDivElement;
  public portal: React.ReactPortal = null;

  private _$for: F;
  private _$forUserData: Record<string, any>;
  private _htmlRender: VoidFunction;

  private renderRate = 500;
  private lastRenderAt = 0;

  constructor(_html: HtmlConstruct<F>) {
    const container = document.createElement("div");
    super(container);
    this.container = container;

    const uneffect = () => {
      this._htmlRender = null;
    };

    const effect = () => uneffect;

    this.portal = ReactDOM.createPortal(
      $h(() => {
        const [_, forceUpdate] = useReducer(ticker, 0);
        this._htmlRender = forceUpdate;
        useEffect(effect, emptyDeps);
        this.lastRenderAt = performance.now();

        if (this._$for) {
          return $h(_html, { obj: this._$for, ...this._$forUserData });
        } else {
          return null;
        }
      }),
      container
    );
  }

  $unfor() {
    if (!this._$for) return;
    const $for = this._$for;
    this._$for = null;
    this._htmlRender?.();

    $for.remove(this);
    $for.userData = this._$forUserData;

    this._$forUserData = null;
  }

  updatePlace(camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
    // this.box.setFromObject(this._$for);
    // const size = new THREE.Vector3();
    // this.box.getSize(size);
    // const s = new THREE.Vector2();
    // renderer.getSize(s);
    // size.project(camera);
    // const width = Math.abs((size.x * s.y) / 2);
    // const height = Math.abs((size.y * s.x) / 2);
    // console.log(width, height);
    // const { width, height } = getScreenSize(this._$for, camera);
    // console.log(width, height);
  }

  $for(obj: F, placement: Placement = "top") {
    this._$for = obj;
    this._htmlRender?.();
    obj.add(this);

    this.container.classList.add(`placement-${placement}`);

    const userData = obj.userData;

    this._$forUserData = userData;

    obj.userData = new Proxy(userData, {
      get: (target, p, receiver) => {
        return target[p as string];
      },
      set: (target, p, newValue, receiver) => {
        target[p as string] = newValue;

        const now = performance.now();
        if (now - this.lastRenderAt > this.renderRate) {
          this._htmlRender?.();
        } else {
        }
        return true;
      },
    });
  }
}

/**
 * 測量一個 Three.js 物件在螢幕上的顯示大小（像素）。
 *
 * @param {THREE.Object3D} object 你想要測量的 3D 物件。
 * @param {THREE.Camera} camera 當前場景使用的相機。
 * @returns {{width: number, height: number}} 物件在螢幕上的寬度和高度。
 */
function getScreenSize(object, camera) {
  // 1. 取得物件的邊界盒（Bounding Box）
  const box = new THREE.Box3().setFromObject(object);

  // 如果邊界盒無效，返回 (0, 0)
  if (box.isEmpty()) {
    return { width: 0, height: 0 };
  }

  // 2. 取得邊界盒的八個頂點
  const vertices = [
    new THREE.Vector3(box.min.x, box.min.y, box.min.z),
    new THREE.Vector3(box.min.x, box.min.y, box.max.z),
    new THREE.Vector3(box.min.x, box.max.y, box.min.z),
    new THREE.Vector3(box.min.x, box.max.y, box.max.z),
    new THREE.Vector3(box.max.x, box.min.y, box.min.z),
    new THREE.Vector3(box.max.x, box.min.y, box.max.z),
    new THREE.Vector3(box.max.x, box.max.y, box.min.z),
    new THREE.Vector3(box.max.x, box.max.y, box.max.z),
  ];

  // 3. 將頂點投影到螢幕座標，並找到最大/最小的 x, y 值
  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  vertices.forEach((vertex) => {
    // 投影到 2D 螢幕座標
    vertex.project(camera);

    // 將 [-1, 1] 範圍轉換為像素座標
    const x = (vertex.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vertex.y * 0.5 + 0.5) * window.innerHeight;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });

  // 4. 計算並返回螢幕上的寬度和高度
  const width = maxX - minX;
  const height = maxY - minY;

  return { width, height };
}
