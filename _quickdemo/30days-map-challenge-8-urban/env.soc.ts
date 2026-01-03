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

import * as suncalc from "suncalc";

// const EARTH_RADIUS = 6378137;
const Meters_per_lat = 111132;
const Meters_per_lon = (lat: number) =>
  111320 * Math.cos((lat * Math.PI) / 180);

whenReady(async (world, camera, renderer, controls) => {
  const [lat, lng] = [22.776902264528893, 112.78552013465016];

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

  const getGooTileUrl = (
    xyz: { x: number; y: number; z: number },
    styled = false
  ) => {
    return `http://0.0.0.0:3003/gtile/${xyz.z}/${xyz.x}/${xyz.y}?styled=${styled}`;
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
    new THREE.ShaderMaterial({
      uniforms: {
        map: {
          value: textLoader.load(
            // getGooTileUrl({ x: __ti__[0], y: __ti__[1], z: zoom }, true)
            `http://0.0.0.0:3003/texture/data-gtiles/googletile.jpeg`
          ),
        },
      },
      vertexShader: `
        uniform sampler2D map;

        float getGreenMask(vec3 color) {
            // Conversion to YCbCr
            float y = 0.2989 * color.r + 0.5866 * color.g + 0.1145 * color.b;
            float cb = 0.5647 * (color.b - y);
            float cr = 0.7132 * (color.r - y);

            // Reference Green in CbCr space
            // Pure Green (0,1,0) translates roughly to:
            vec2 targetCbCr = vec2(-0.338, -0.429);
            
            float d = distance(vec2(cb, cr), targetCbCr);
            
            // Smooth transition using smoothstep
            return smoothstep(0.01, 0.65, d);
        }

        varying vec2 vUv;
        varying float vGreenMask;

        void main() {
            vUv = uv;
            vec4 mapColor = texture2D(map, uv);
            float greenMask = getGreenMask(mapColor.rgb);
            vGreenMask = greenMask;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
        `,
      fragmentShader: `
      uniform sampler2D map;
      varying vec2 vUv;
      varying float vGreenMask;

      void main() {
        vec4 color = texture2D(map, vUv);
        // color = mix(vec4(1.0, 0.0, 0.0, 1.0), color, vGreenMask);
        gl_FragColor = vec4(color.rgb, 1.0);
      }
        `,
      //   color: 0xffffff,
      //   toneMapped: textLoader.load(
      //     getGooTileUrl({ x: __ti__[0], y: __ti__[1], z: zoom }, true)
      //   ),
    })
  );

  ground.rotation.x = -Math.PI / 2;

  world.add(new THREE.AxesHelper(meters_by_x * 1.5));

  world.add(ground);

  const trees = new TreesCluster({
    locations: Array(1000)
      .fill(0)
      .map(() => {
        return new THREE.Vector2(Math.random() * 1000, Math.random() * 1000);
      }),
    worldSize: new THREE.Vector2(meters_by_x, meters_by_y),
  });
  world.add(trees);
  //   CreateSky();

  function CreateSky() {
    const sky = new Sky();
    sky.scale.setScalar(meters_by_x * 1.2); // Large scale to encompass the scene

    // Set sky uniforms
    const uniforms = sky.material.uniforms;
    uniforms["turbidity"].value = 1;
    uniforms["rayleigh"].value = 1;
    uniforms["mieCoefficient"].value = 0.05;
    uniforms["mieDirectionalG"].value = 80;

    // Set sun position

    const sun = new THREE.Vector3();
    world.add(sky);

    let now = Date.now();

    const updateSun = () => {
      const sunPosition = suncalc.getPosition(new Date(now), lat, lng);
      console.log(sunPosition);
      const phi = Math.PI / 2 - sunPosition.altitude; // Near horizon for sunset
      const theta = sunPosition.azimuth;
      sun.setFromSphericalCoords(1, phi, theta).normalize();
      uniforms["sunPosition"].value.copy(sun);
      sky.material.needsUpdate = true;

      __lights__.dir.position.copy(sun);
    };

    __lights__.amb.intensity = 0.05;
    __lights__.dir.intensity = 2.7;

    updateSun();

    // animationLoop((delta) => {
    //   now += 20 * 1000;
    //   updateSun();
    // });

    // const fogColor = new THREE.Color().setHSL(0.6, 0.2, 0.8);
    // const density = 0.0003;
    // world.fog = new THREE.FogExp2(fogColor, density);
    // Ensure the background matches the fog color for a seamless sky
    // renderer.setClearColor(fogColor);
  }
});

type TreesClusterOptions = {
  locations: THREE.Vector2[];
  worldSize: THREE.Vector2;
};

class TreesCluster extends THREE.Group {
  constructor({ locations, worldSize }: TreesClusterOptions) {
    super();

    const pts: number[] = [];
    const uv1: number[] = [];

    const scale = 0.05;
    const delta = 1 / scale;
    const scaledSize = worldSize.clone().multiplyScalar(scale);
    const offset = worldSize.clone().multiplyScalar(-0.5);

    for (let i = 0, S = Math.ceil(scaledSize.x); i < S; i++) {
      for (let j = 0, T = Math.ceil(scaledSize.y); j < T; j++) {
        const x = i * delta;
        const y = j * delta;
        const r0 = -delta + 2 * Math.random() * delta;
        const r1 = -delta + 2 * Math.random() * delta;
        pts.push(offset.x + x + r0, 0.0, offset.y + y + r1);
        uv1.push(x / worldSize.x, 1 - y / worldSize.y);
      }
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    geometry.setAttribute("uv1", new THREE.Float32BufferAttribute(uv1, 2));

    const myMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uSize: {
          value: 80,
        },
        map: {
          value: textLoader.load(
            "/quickdemo/green-forest-isolated-on-background-3d-rendering-illustration-png.png"
          ),
        },
        greenMask: {
          value: textLoader.load(
            "http://0.0.0.0:3003/texture/data-gtiles/googletile.cute_3d_tile.5.png"
          ),
        },
      },
      transparent: true,
      depthTest: false,
      vertexShader: `
            attribute vec2 uv1;
            uniform float uSize;

            varying vec2 vUv1;

            void main() {
                // Apply a slight "sway" based on time for wind effect
                vec3 vPosition = position;
                vec4 mvPosition = modelViewMatrix * vec4(vPosition, 1.0);
                // Size attenuation: PointSize decreases as distance (-mvPosition.z) increases
                gl_PointSize = uSize * (300.0 / -mvPosition.z);

                vUv1 = uv1;

                gl_Position = projectionMatrix * mvPosition;
            }

        `,
      fragmentShader: `
        uniform sampler2D map;
        uniform sampler2D greenMask;
        varying vec2 vUv1;

        void main() {
            // gl_PointCoord gives us (0,0) to (1,1) for the current point square
            vec2 uv = gl_PointCoord;
            uv.t = 1.0 - uv.t;
            vec4 color = texture2D(map, uv);
            vec4 greenMaskColor = texture2D(greenMask, vUv1);
            
            if (color.a < 0.5) discard;
            if (greenMaskColor.r > 0.5) discard;

            float alphaMask = step(0.5, 1.0 - color.r);
            gl_FragColor = vec4(color.rgb, alphaMask);
        }

        `,
    });

    const points = new THREE.Points(
      geometry,
      myMaterial
      //   new THREE.PointsMaterial({
      //     color: 0xffffff,
      //     sizeAttenuation: true,
      //     size: 100,
      //     transparent: true,
      //     map: textLoader.load(
      //       "/quickdemo/harbor3d/real_tree_models/textures/Maple_Leaf_baseColor.png"
      //     ),
      //     depthTest: false,
      //   })
    );

    this.add(points);
  }
}
