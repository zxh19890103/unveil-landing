import { tileToLatLon } from "./clac.js";
import { Viewport } from "./viewport.js";

export class GlobalMap {
  private worldSize: number;
  private worldSize_half: number;

  zoom: number;
  zoomLevel: Geo.Integer;
  zoomDelta: number = 0.1;

  readonly viewport: Viewport;
  readonly tiles: TileManager;

  constructor(readonly domElement: HTMLElement, readonly center: Geo.LatLng) {
    this.viewport = new Viewport();
    this.initViewport();
    this.viewport.setPosition(center.lat, center.lon);

    this.tiles = new TileManager(20);
  }

  private initViewport() {
    this.viewport.width = this.domElement.clientWidth;
    this.viewport.height = this.domElement.clientHeight;

    this.viewport.width_half = this.domElement.clientWidth / 2;
    this.viewport.height_half = this.domElement.clientHeight / 2;
    // repsonsive to resize;
  }

  zoomIn() {}
  zoomOut() {}

  setZoom(zoom: number) {
    this.zoom = zoom;
    this.zoomLevel = Math.max(0, Math.min(Math.floor(zoom), 19));
    this.worldSize = 256 * Math.pow(2, zoom);
    this.worldSize_half = this.worldSize / 2;

    this.setViewportCenter(this.center.lat, this.center.lon);
    // calc the position shift.
  }

  latlngToWorldPoint(lat: number, lon: number) {
    const x = this.worldSize * ((lon + 180) / 360);
    const y = this.worldSize * ((90 - lat) / 180);
    return { x, y };
  }

  pointToLatlng(x: number, y: number) {
    const lat = 180 * ((this.worldSize_half - y) / this.worldSize);
    const lon = 360 * ((x - this.worldSize_half) / this.worldSize);
    return { lat, lon };
  }

  setViewportCenter(lat: number, lon: number) {
    this.viewport.setPosition(lat, lon);
    this.viewport.point = this.latlngToWorldPoint(lat, lon);
    this.viewport.pointLeftTop.x =
      this.viewport.point.x - this.viewport.width_half;
    this.viewport.pointLeftTop.y =
      this.viewport.point.y - this.viewport.height_half;

    this.viewport.pointRightBottom.x =
      this.viewport.point.x + this.viewport.width_half;
    this.viewport.pointRightBottom.y =
      this.viewport.point.y + this.viewport.height_half;

    const lv = this.zoomLevel;
    const n = Math.pow(2, lv);
    const step = this.worldSize / n;
    const tileX0 = Math.floor(this.viewport.pointLeftTop.x / step);
    const tileY0 = Math.floor(this.viewport.pointLeftTop.y / step);

    const tileX1 = Math.ceil(this.viewport.pointRightBottom.x / step);
    const tileY1 = Math.ceil(this.viewport.pointRightBottom.y / step);

    // console.log(n, tileX1 - tileX0, tileY1 - tileY0);
    // find the tiles occurs in the viewport.

    const tiles: Tile[] = [];
    for (let x = tileX0; x <= tileX1; x++) {
      for (let y = tileY0; y <= tileY1; y++) {
        tiles.push(this.tiles.create(x, y, lv));
      }
    }

    this.tiles.current = tiles;
  }

  debug_visualize() {
    const map = document.createElement("div");
    map.style.cssText = `position: fixed; top:0; right: 0; background: #dddddd; width: 300px; height: 300px`;
    const viewport = document.createElement("div");
    viewport.style.cssText = `position: absolute; background: #ef019091;`;
    map.appendChild(viewport);

    return {
      domElement: map,
      draw: () => {
        const size = this.worldSize;
        const vsizeX = this.viewport.width;
        const vsizeY = this.viewport.height;

        const ratioX = vsizeX / size;
        const ratioY = vsizeY / size;

        const top = this.viewport.pointLeftTop.y / size;
        const left = this.viewport.pointLeftTop.x / size;

        const mapClientSize = map.clientWidth;

        viewport.style.width = `${ratioX * mapClientSize}px`;
        viewport.style.height = `${ratioY * mapClientSize}px`;
        viewport.style.top = `${top * mapClientSize}px`;
        viewport.style.left = `${left * mapClientSize}px`;
      },
    };
  }

  getVisibleTiles() {}
}

class Tile {
  /**
   * left
   */
  readonly lat: number;
  /**
   * top
   */
  readonly lon: number;

  readonly key: string;

  constructor(
    readonly x: Geo.Integer,
    readonly y: Geo.Integer,
    readonly z: Geo.Integer
  ) {
    const latlng = tileToLatLon(x, y, z);
    this.lat = latlng.lat;
    this.lon = latlng.lon;

    this.key = `${z}/${x}/${y}`;
  }
}

class Tiles {
  readonly index = new Map<string, Tile>();
  readonly items = new Set<Tile>();

  add(tile: Tile) {
    this.index.set(tile.key, tile);
    this.items.add(tile);
  }

  remove(tile: Tile) {}
}

class TileManager {
  lods = new Map<Geo.Integer, Tiles>();

  current: Tile[] = [];
  next: Tile[] = [];

  constructor(n: Geo.Integer) {
    for (let z = 0; z <= n; z++) {
      this.lods.set(z, new Tiles());
    }
  }

  get(x: Geo.Integer, y: Geo.Integer, z: Geo.Integer) {
    const lod = this.lods.get(z);
    const key = `${z}/${x}/${y}`;
    if (lod.index.has(key)) {
      return lod.index.get(key);
    } else {
      const tile = this.create(x, y, z);
      return tile;
    }
  }

  create(x: Geo.Integer, y: Geo.Integer, z: Geo.Integer) {
    const tile = new Tile(x, y, z);
    const lod = this.lods.get(z);
    lod.add(tile);
    return tile;
  }
}
