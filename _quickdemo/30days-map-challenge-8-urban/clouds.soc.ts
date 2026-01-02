import * as THREE from "three";
import {
  latLonToTile,
  tileToLatLon,
} from "@/30days-map-challenge-shared/core/clac.js";
import {
  __lights__,
  animationLoop,
  whenReady,
} from "@/_shared/SoCFramework.js";
import { textLoader } from "@/_shared/loader.js";
import { Sky } from "three/addons/objects/Sky.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// const EARTH_RADIUS = 6378137;
const Meters_per_lat = 111132;
const Meters_per_lon = (lat: number) =>
  111320 * Math.cos((lat * Math.PI) / 180);

whenReady(async (world, camera, renderer, controls) => {
  const [lat, lng] = [23.090569847494365, 113.39090491906563];

  // const [lng, lat] = [106.5774281, 29.5526704];
  const zoom = 12; // it's the best zoom level to load the data of osm and dem.

  const __ti__ = latLonToTile(lat, lng, zoom);
  const reGen = false;

  // bbox;
  const leftTop = tileToLatLon(__ti__[0], __ti__[1], zoom);
  const rightTop = tileToLatLon(__ti__[0] + 1, __ti__[1], zoom);
  const leftBottom = tileToLatLon(__ti__[0], __ti__[1] + 1, zoom);
  const rightBottom = tileToLatLon(__ti__[0] + 1, __ti__[1] + 1, zoom);
  const center = tileToLatLon(__ti__[0] + 0.5, __ti__[1] + 0.5, zoom);

  const bbox = `${leftBottom.lat},${leftBottom.lon},${rightTop.lat},${rightTop.lon}`;

  const getGooTileUrl = (xyz: { x: number; y: number; z: number }) => {
    return `http://0.0.0.0:3003/gtile/${xyz.z}/${xyz.x}/${xyz.y}?styled=true`;
  };

  const meters_per_lon = Meters_per_lon(center.lat);

  const meters_by_x = meters_per_lon * (rightTop.lon - leftBottom.lon);
  const meters_by_y = Meters_per_lat * (rightTop.lat - leftBottom.lat);

  camera.near = 100;
  camera.far = 100000;
  camera.updateProjectionMatrix();
  camera.position.set(0, 600, 2000);

  controls.zoomSpeed = 1;
  controls.rotateSpeed = 1;

  const segments_by_x = 1266;
  const segments_by_y = 1164;

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(
      meters_by_x,
      meters_by_y,
      segments_by_x,
      segments_by_y
    ),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: textLoader.load(
        getGooTileUrl({ x: __ti__[0], y: __ti__[1], z: zoom })
      ),
    })
  );

  ground.rotation.x = -Math.PI / 2;

  world.add(new THREE.AxesHelper(meters_by_x * 1.5));

  world.add(ground);
  const clouds = new Clouds(new THREE.Vector3(meters_by_x, meters_by_y, 500));
  world.add(clouds);
});

class Clouds extends THREE.Group {
  readonly mesh: THREE.Mesh;

  constructor(coverage: THREE.Vector3) {
    super();

    const texture = textLoader.load(
      "/quickdemo/30days-map-challenge-8-urban/cloud10.png"
    );

    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipMapLinearFilter;

    const fog = new THREE.Fog(0xff0000, -100, 3000);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
        fogColor: { value: fog.color },
        fogNear: { value: fog.near },
        fogFar: { value: fog.far },
      },
      vertexShader: /*glsl */ `
        varying vec2 vUv;

        void main() {

          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

        }
      `,
      fragmentShader: /*glsl */ `
      	uniform sampler2D map;

        uniform vec3 fogColor;
        uniform float fogNear;
        uniform float fogFar;

        varying vec2 vUv;

        void main() {

          float depth = gl_FragCoord.z / gl_FragCoord.w;
          float fogFactor = smoothstep( fogNear, fogFar, depth );

          vec4 color = texture2D( map, vUv );
          // float alpha0 = smoothstep(0.001, 0.3, color.a);
          float varW = pow( gl_FragCoord.z, 20.0 );
          gl_FragColor = mix( color, vec4(color.rgb, varW ), fogFactor);
          gl_FragColor = color;
        }
      `,
      depthTest: false,
      transparent: true,
    });

    const ndc = coverage.clone().divideScalar(2);

    let geometries = [];
    for (let i = 0; i < 3000; i++) {
      const plane = new THREE.PlaneGeometry(1024, 1024);

      // Position/Rotate each plane to form a cloud puff
      plane.translate(
        -ndc.x + Math.random() * coverage.x,
        coverage.z + 1000 * Math.random(),
        -ndc.y + Math.random() * coverage.y
      );

      const scale = Math.random() * Math.random() * 1.5 + 0.5;
      plane.scale(scale, 1, scale);

      geometries.push(plane);
    }

    const finalGeometry = mergeGeometries(geometries);

    const mesh = new THREE.Mesh(finalGeometry, material);

    this.mesh = mesh;

    this.add(mesh);
  }

  vary() {
    const Vertex = new THREE.Vector3();

    const position = this.mesh.geometry.attributes.position;
    for (let plane = 0; plane < 3000; plane++) {
      for (let i = 0; i < 4; i++) {
        const I0 = plane * 16 + i * 3;
        Vertex.x = position[I0];
        Vertex.y = position[I0 + 1];
        Vertex.z = position[I0 + 2];
      }
    }
    position.needsUpdate = true;
  }
}
