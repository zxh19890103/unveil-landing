import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

export class ImageObj extends CSS2DObject {
  private readonly container: HTMLDivElement;
  private img: HTMLImageElement;

  constructor(imageUrl: string, width = 64, height = 64) {
    const div = document.createElement("div");
    div.style.position = "relative";
    div.style.width = `${width}px`;
    div.style.height = `${height}px`;
    div.style.pointerEvents = "none"; // let mouse pass through if needed

    const img = document.createElement("img");
    img.src = imageUrl;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.transformOrigin = "center center";
    img.style.transition = "transform 0.1s linear"; // optional
    div.appendChild(img);

    super(div); // pass the div to CSS2DObject

    this.container = div;
    this.img = img;
  }

  /** Rotate the image in degrees */
  setRotation(deg: number) {
    this.img.style.transform = `rotate(${deg}deg) scale(${this._scale})`;
  }

  /** Scale the image (uniform scale) */
  private _scale = 1;
  setScale(scale: number) {
    this._scale = scale;
    this.img.style.transform = `rotate(${this._rotation}deg) scale(${scale})`;
  }

  /** Combined setter (optional convenience) */
  setTransform(deg: number, scale: number) {
    this._rotation = deg;
    this._scale = scale;
    this.img.style.transform = `rotate(${deg}deg) scale(${scale})`;
  }

  private _rotation = 0;
}
