import { type LngLat } from "./crs.js";
import { latLonToTile, tileToLatLon } from "./clac.js";

type Integer = number;
type BBOX = {};

export class MapTileManager {
  gridByLvs: MapTilesGrid[];

  /**
   * tiles that are visible on the display at this moment;
   */
  private activeTiles: MapTile[];

  /**
   * tiles about to be visible.
   */
  private nextActiveTiles: MapTile[];

  /**
   * tiles that are visible on the display at a specified zoom level.
   */
  generateTiles(bbox: BBOX, lv: number) {}

  /**
   * compare the activeTiles and nextActiveTiles, conduct the following logic:
   * 1. preseve items that are shared in both array.
   * 2. mark some `add`
   * 3. mark some `remove`
   */
  recomputeActiveTiles() {}
}

class MapTilesGrid {
  manager: MapTileManager;
  readonly lv: number;
  items: MapTile[][];
}

export class MapTile {
  manager: MapTileManager;
  grid: MapTilesGrid;

  readonly ix: Integer;
  readonly iy: Integer;

  readonly leftTopLatLng: LngLat;
  readonly diffLatLngHalf: LngLat;
  readonly diffLatLngHalfHalf: LngLat;

  constructor(
    /**
     * the center lat
     */
    readonly lat: number,
    /**
     * the center lng
     */
    readonly lon: number,
    /**
     * zoom level, integer
     */
    readonly iz: Integer
  ) {
    const ixy = latLonToTile(lat, lon, iz);
    this.leftTopLatLng = tileToLatLon(ixy[0], ixy[1], iz);
    this.diffLatLngHalf = {
      lat: this.leftTopLatLng.lat - lat,
      lon: lon - this.leftTopLatLng.lon,
    };

    this.diffLatLngHalfHalf = {
      lat: this.diffLatLngHalf.lat / 2,
      lon: this.diffLatLngHalf.lon / 2,
    };

    this.ix = ixy[0];
    this.iy = ixy[1];
  }

  readonly parent: MapTile = null;
  /**
   * #--------
   * | 0 | 1 |
   * | 2 | 3 |
   * #--------
   */
  readonly children: MapTile[] = [];
  private childrenGenerated = false;

  sq() {
    const z = this.iz + 1;

    const centerLat = this.lat;
    const centerLon = this.lon;

    let lat: number;
    let lon: number;
    let tile: MapTile;

    // left top
    lat = centerLat + this.diffLatLngHalfHalf.lat;
    lon = centerLon - this.diffLatLngHalfHalf.lon;
    tile = new MapTile(lat, lon, z);
    // @ts-ignore
    tile.parent = this;
    this.children[0] = tile;

    // left bottom
    lat = centerLat - this.diffLatLngHalfHalf.lat;
    lon = centerLon - this.diffLatLngHalfHalf.lon;
    tile = new MapTile(lat, lon, z);
    // @ts-ignore
    tile.parent = this;
    this.children[1] = tile;

    // right bottom
    lat = centerLat - this.diffLatLngHalfHalf.lat;
    lon = centerLon + this.diffLatLngHalfHalf.lon;
    tile = new MapTile(lat, lon, z);
    // @ts-ignore
    tile.parent = this;
    this.children[2] = tile;

    // right top
    lat = centerLat + this.diffLatLngHalfHalf.lat;
    lon = centerLon + this.diffLatLngHalfHalf.lon;
    tile = new MapTile(lat, lon, z);
    // @ts-ignore
    tile.parent = this;
    this.children[3] = tile;
  }
}
