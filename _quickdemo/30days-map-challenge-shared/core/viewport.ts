// https://excalidraw.com/#json=10FBfrK1ZIFNnyaCdXNUA,PEpVPvflYpordBytJm5hZA

export class Viewport {
  width: number;
  width_half: number;

  height: number;
  height_half: number;

  point: Geo.Point = { x: 0, y: 0 };
  pointLeftTop: Geo.Point = { x: 0, y: 0 };
  pointRightBottom: Geo.Point = { x: 0, y: 0 };

  /**
   * the latlng of the viewport's center;
   */
  position: Geo.LatLng = { lat: 0, lon: 0 };

  southWest: Geo.LatLng;
  eastNorth: Geo.LatLng;

  setPosition(lat: number, lon: number) {
    this.position.lat = lat;
    this.position.lon = lon;
  }

  constructor() {}
}
