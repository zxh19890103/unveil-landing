import * as THREE from "three";
import React, { useEffect, useReducer, useState } from "react";
import ReactDOM from "react-dom";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

const $h = React.createElement;

type HtmlConstructProps<O extends THREE.Object3D> = { obj: O, [k: string]: any };
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
  private html: () => React.ReactNode;

  private _$for: F;
  private _$forUserData: Record<string, any>;
  private _htmlRender: VoidFunction;

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
    this._htmlRender?.();
    this._$for.remove(this);
    this._$for.userData = this._$forUserData;
    this._$forUserData = null;
  }

  $for(obj: F) {
    this._$for = obj;
    this._htmlRender?.();
    obj.add(this);

    const userData = obj.userData;

    this._$forUserData = userData;

    obj.userData = new Proxy(userData, {
      get: (target, p, receiver) => {
        return target[p as string];
      },
      set: (target, p, newValue, receiver) => {
        target[p as string] = newValue;
        this._htmlRender?.();
        return true;
      },
    });
  }
}
