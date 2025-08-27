import * as THREE from "three";
import React, { useReducer } from "react";
import ReactDOM from "react-dom";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import {
  checkIfUserDataProxyIsNoNeed,
  createUserDataProxy,
} from "./userData.js";

const $h = React.createElement;

type HtmlConstructProps<O extends THREE.Object3D> = {
  obj: O;
  data: O["userData"];
} & O["userData"];

type HtmlConstruct<O extends THREE.Object3D> = (
  props: HtmlConstructProps<O>
) => React.ReactNode;

const ticker = () => {
  return performance.now();
};

export class Label<F extends THREE.Object3D> extends CSS2DObject {
  private readonly container: HTMLDivElement;
  public portal: React.ReactPortal = null;

  private _$for: F;

  constructor(_html: HtmlConstruct<F>) {
    const container = document.createElement("div");
    container.className = "";
    super(container);
    this.container = container;

    this.portal = ReactDOM.createPortal(
      $h(() => {
        const [_, forceUpdate] = useReducer(ticker, 0);
        if (this._$for) {
          const $for = this._$for;
          $for.__$tooltipUpdate = forceUpdate;
          return $h(_html, {
            data: $for.__$forUserData,
            obj: $for,
            ...$for.__$forUserData,
          });
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
    $for.__$tooltipUpdate?.();

    $for.__$tooltipUpdate = null;
    $for.remove(this);
    checkIfUserDataProxyIsNoNeed($for);
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
    obj.add(this);
    this.container.classList.add(`placement-${placement}`);
    createUserDataProxy(obj);
  }
}
