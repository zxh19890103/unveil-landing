import * as THREE from "three";
import { whenReady } from "@/_shared/SoCFramework.js";
import { textLoader } from "@/_shared/loader.js";

whenReady((world, camera, renderer, controls) => {
  const points = [
    {
      x: 11.832389999997872,
      y: 0,
      z: -4.581635935029392,
    },
    {
      x: 11.544899999999814,
      y: 0,
      z: -4.000413006109118,
    },
    {
      x: 11.184390000001088,
      y: 0,
      z: -3.2274649614721422,
    },
    {
      x: 10.969049999999925,
      y: 0,
      z: -2.787029374313373,
    },
    {
      x: 11.223030000000733,
      y: 0,
      z: -2.558327710231095,
    },
    {
      x: 11.763750000001494,
      y: 0,
      z: -2.3737559988114207,
    },
    {
      x: 12.089879999999198,
      y: 0,
      z: -2.2050807465179365,
    },
    {
      x: 12.3946200000006,
      y: 0,
      z: -2.3737559988114207,
    },
    {
      x: 13.437450000000695,
      y: 0,
      z: -2.6967651333260947,
    },
    {
      x: 13.617690000000948,
      y: 0,
      z: -2.5121934217375106,
    },
    {
      x: 13.836570000000847,
      y: 0,
      z: -2.3275871528481775,
    },
    {
      x: 14.235690000001,
      y: 0,
      z: -2.143015441678382,
    },
    {
      x: 14.699160000000688,
      y: 0,
      z: -2.050712307409539,
    },
    {
      x: 15.046769999997878,
      y: 0,
      z: -2.050712307409539,
    },
    {
      x: 15.433019999998976,
      y: 0,
      z: -2.1199310187247984,
    },
    {
      x: 15.819240000001855,
      y: 0,
      z: -2.050712307409539,
    },
    {
      x: 16.86210000000017,
      y: 0,
      z: -1.6007388481150988,
    },
    {
      x: 17.82767999999919,
      y: 0,
      z: -1.2776951578772515,
    },
    {
      x: 18.664530000000923,
      y: 0,
      z: -0.9431092565555366,
    },
    {
      x: 19.735860000001537,
      y: 0,
      z: -0.5380260163245997,
    },
    {
      x: 20.443980000001716,
      y: 0,
      z: -0.284201037820663,
    },
    {
      x: 21.92457000000161,
      y: 0,
      z: 0.31578661036896843,
    },
    {
      x: 22.877280000001576,
      y: 0,
      z: 0.6734914916144075,
    },
    {
      x: 23.765609999999526,
      y: 0,
      z: 0.9850275273845163,
    },
    {
      x: 24.847079999999266,
      y: 0,
      z: 1.4234933316835507,
    },
    {
      x: 25.46507999999932,
      y: 0,
      z: 1.6427262340785944,
    },
    {
      x: 26.585160000000485,
      y: 0,
      z: 2.150445308354159,
    },
    {
      x: 27.010019999998747,
      y: 0,
      z: 2.519726960986865,
    },
    {
      x: 27.396269999999845,
      y: 0,
      z: 3.0851570956476104,
    },
    {
      x: 27.537870000000453,
      y: 0,
      z: 3.7198405024783323,
    },
    {
      x: 27.5250000000014,
      y: 0,
      z: 4.169883083826399,
    },
    {
      x: 27.331889999997827,
      y: 0,
      z: 4.7122979186842935,
    },
  ].map((x) => {
    return new THREE.Vector3(x.x, x.y, x.z);
  });

  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal", 0.5);

  const curveLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curve.getSpacedPoints(100)),
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );

  const width = 0.6;
  const roadShape = new THREE.Shape();
  roadShape.moveTo(0, -width / 2);
  roadShape.lineTo(0, width / 2);

  // 3. Create the geometry.
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    steps: 300, // Number of segments for a smooth path
    extrudePath: curve,
    depth: 1,
    bevelEnabled: true,
    bevelSegments: 12,
    bevelSize: 0.1,
    bevelThickness: 0.7,
    bevelOffset: 0,
    UVGenerator: {
      generateSideWallUV(geometry, vertices, indexA, indexB, indexC, indexD) {
        // const pts = vertices.length / 3;
        // console.log('generateSideWallUV =', pts, indexA, indexB, indexC, indexD);

        const s = 0.2;

        return Array(4)
          .fill(0)
          .map((_, i) => {
            if (i === 0) {
              return new THREE.Vector2(0, s);
            } else if (i === 1) {
              return new THREE.Vector2(0.7, s);
            } else if (i === 2) {
              return new THREE.Vector2(0.7, s + 0.03);
            } else if (i === 3) {
              return new THREE.Vector2(0, s + 0.03);
            }
          });
      },
      generateTopUV: (geometry, vertices, indexA, indexB, indexC) => {
        return null;
      },
    },
  };

  const texture = textLoader.load(
    "/quickdemo/harbor3d/road/textures/Material.003_baseColor.png"
  );

  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  const roadGeometry = new THREE.ExtrudeGeometry(roadShape, extrudeSettings);
  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.8,
    color: 0xffffff,
    wireframe: false,
    map: texture,
  });

  console.log(roadGeometry.getAttribute("position").array);

  const mesh = new THREE.Mesh(roadGeometry, material);

  controls.target.copy(curve.getPointAt(0.5));

  world.add(curveLine, mesh);
  world.add(new THREE.AxesHelper(1));
});
