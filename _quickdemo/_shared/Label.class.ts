import * as THREE from "three";
import React, { useEffect, useReducer, useState } from "react";
import ReactDOM from "react-dom";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

const $h = React.createElement;

type HtmlConstructProps<O extends THREE.Object3D> = { obj: O };
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
  private _forceUpdate: VoidFunction;

  constructor(_html: HtmlConstruct<F>) {
    const container = document.createElement("div");
    super(container);
    this.container = container;

    const uneffect = () => {
      this._forceUpdate = null;
    };

    const effect = () => uneffect;

    this.portal = ReactDOM.createPortal(
      $h(() => {
        const [_, forceUpdate] = useReducer(ticker, 0);
        this._forceUpdate = forceUpdate;
        useEffect(effect, emptyDeps);

        if (this._$for) {
          return $h(_html, { obj: this._$for });
        } else {
          return null;
        }
      }),
      container
    );

    // this.userData
  }

  $for(obj: F) {
    this._$for = obj;
    this._forceUpdate?.();
    obj.add(this);
  }
}
