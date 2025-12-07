import type { Vector2 } from "three";

declare global {
  namespace Geo {
    export type LatLng = { lat: number; lon: number; alt?: number };
    export type Point = { x: number; y: number };
    export type UV = Vector2;
    export type Integer = number;
  }
}
