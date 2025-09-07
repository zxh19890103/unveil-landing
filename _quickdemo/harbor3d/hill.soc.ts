import * as THREE from "three";
import { geoMercator } from "@/_shared/geo-mercator.js";
import { whenReady } from "@/_shared/SoCFramework.js";
import { textLoader } from "@/_shared/loader.js";

const shapeLatlngStr = `
121.6784825,38.8798929,0 121.6773667,38.8800266,0 121.6765943,38.8813295,0 121.6764226,38.8823985,0 121.6773238,38.8839352,0 121.6774097,38.8854385,0 121.6781392,38.8865742,0 121.678268,38.8876766,0 121.6802421,38.8879772,0 121.6800275,38.8885785,0 121.6796413,38.8890461,0 121.680285,38.8895138,0 121.6800275,38.8904825,0 121.6808429,38.8906495,0 121.681272,38.8906161,0 121.681272,38.8912174,0 121.6808,38.8913176,0 121.6807141,38.8929543,0 121.6797271,38.8932549,0 121.6793408,38.8937893,0 121.6808858,38.8942903,0 121.6821733,38.8940565,0 121.6835036,38.8932215,0 121.6839328,38.8926871,0 121.6835036,38.8922194,0 121.6839757,38.8913844,0 121.683804,38.8910169,0 121.6832891,38.8906161,0 121.6825166,38.8906495,0 121.6821733,38.8902487,0 121.6822591,38.8890795,0 121.6829028,38.8885451,0 121.6840186,38.8887121,0 121.6845336,38.8877768,0 121.6852632,38.8878436,0 121.6854348,38.8872423,0 121.6850057,38.8866076,0 121.6843619,38.88614,0 121.6844907,38.8854385,0 121.6839328,38.885405,0 121.6831174,38.8865074,0 121.6828599,38.8869083,0 121.6822162,38.8868415,0 121.6819158,38.8863738,0 121.6824308,38.8858059,0 121.6830745,38.8853048,0 121.6829028,38.8849374,0 121.6818299,38.8848706,0 121.681787,38.8846033,0 121.6827312,38.8844029,0 121.6844049,38.8835677,0 121.684319,38.8810622,0 121.683847,38.8808284,0 121.6832891,38.8798595,0 121.6825166,38.8796591,0 121.6817441,38.8787571,0 121.6814008,38.8796591,0 121.6806712,38.8795589,0 121.6803708,38.8789575,0 121.6799417,38.8787571,0 121.6793408,38.8788907,0 121.6786971,38.87859,0 121.6781821,38.8788907,0 121.678225,38.8792916,0 121.6784825,38.8798929,0 
`;

whenReady((world, camera, renderer, controls) => {
  renderer.setClearColor(0xffffff);

  world.add(new THREE.AxesHelper(10));

  const grassLand = textLoader.load("/quickdemo/harbor3d/7546-v1.jpg");
  const cityLand = textLoader.load("/quickdemo/harbor3d/cityland.jpg");

  grassLand.wrapS = THREE.MirroredRepeatWrapping;
  grassLand.wrapT = THREE.MirroredRepeatWrapping;
  grassLand.magFilter = THREE.LinearFilter;
  cityLand.wrapS = THREE.MirroredRepeatWrapping;
  // grassLand.minFilter
  // grassLand.wrapS = THREE.MirroredRepeatWrapping;

  const mercator = geoMercator(150, 10000, 121.63, 38.935);

  const toXyz = (latlng: LatLng) => {
    const xy = mercator.project(latlng);
    return new THREE.Vector3(xy[0], latlng[2] ?? 0, -xy[1]);
  };

  const parse = (coordinates: string) => {
    return coordinates
      .split(/[\n\s]/)
      .map((i) => i.trim())
      .filter(Boolean)
      .map((i) => {
        return i.split(",").map((c) => Number(c)) as LatLng;
      });
  };

  const centerLatlng = [121.68062955877913, 38.88629044521131] as LatLng;

  const center = toXyz(centerLatlng);
  controls.target.copy(center);
  camera.position.z = 30;

  const shape = parse(shapeLatlngStr);

  const createHill = (shape: LatLng[], peaks: LatLng[]) => {
    const curve = new THREE.CatmullRomCurve3(
      shape.map(toXyz),
      true,
      "catmullrom",
      0.5
    );

    const ridge = new THREE.CatmullRomCurve3(
      peaks.map(toXyz),
      false,
      "catmullrom",
      0.5
    );

    const newXAxis = ridge
      .getPointAt(1)
      .sub(ridge.getPointAt(0))
      .setComponent(1, 0)
      .normalize();

    const newYAxis = new THREE.Vector3(0, 1, 0);
    const newZAxis = new THREE.Vector3().crossVectors(newYAxis, newXAxis);
    const basis = new THREE.Matrix4().makeBasis(newXAxis, newYAxis, newZAxis);
    const elevation = Math.max(...peaks.map((x) => x[2]));

    world.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(ridge.getSpacedPoints(300)),
        new THREE.LineBasicMaterial({ color: 0xffffff })
      )
    );

    world.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getSpacedPoints(300)),
        new THREE.LineBasicMaterial({ color: 0xffffff })
      )
    );

    const points = curve.getSpacedPoints(500);

    let pt0 = new THREE.Vector3();
    let xSeries = [];

    const indices: number[] = [];
    const uvs: number[] = [];

    points.forEach((pt) => {
      pt0.copy(pt).applyMatrix4(basis);
      xSeries.push(pt0.x);
    });

    let x0 = Math.min(...xSeries);
    let x1 = Math.max(...xSeries);
    const span = x1 - x0;

    xSeries.forEach((v, i) => {
      const r = (v - x0) / span;
      uvs.push(r, 1);
    });

    xSeries.forEach((v, i) => {
      const r = (v - x0) / span;
      xSeries[i] = ridge.getPointAt(r);
      uvs.push(r, 0);
    });

    const totalPts = [...points, ...xSeries];

    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(totalPts);

    const rOffset = points.length;

    for (let i = 0, len = points.length - 1; i < len; i++) {
      const index0 = i;
      const index1 = i + 1;

      const rindex0 = rOffset + i;
      const rindex1 = rOffset + i + 1;

      indices.push(index0, index1, rindex1, rindex1, rindex0, index0);
    }

    geometry.setIndex(indices);
    geometry.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array(uvs), 2)
    );

    return new THREE.Mesh(
      geometry,
      new THREE.ShaderMaterial({
        visible: true,
        transparent: true,
        opacity: 0.1,
        precision: "mediump",
        glslVersion: "300 es",
        side: THREE.DoubleSide,
        wireframe: false,
        uniforms: {
          map: { value: grassLand },
          cityLand: { value: cityLand },
          maxY: { value: elevation },
        },
        vertexShader: `
            uniform float maxY;
            varying vec2 vUv;
            varying float vY;

            void main() {
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
              vec4 wpos = modelMatrix * vec4(position.xyz, 1.0);
              vY = 1.0 - wpos.y / maxY;
              vUv = uv;
            }
            `,
        fragmentShader: `
            uniform sampler2D map;
            uniform sampler2D cityLand;
            varying vec2 vUv;
            varying float vY;

            out vec4 FragColor;

            void main() {
              vec4 texel2 = texture2D(cityLand, vUv);
              vec4 texel1 = texture2D(map, vUv);
              vec4 quantizedColor = mix(texel1, texel2, pow(vY, 3.0));
              FragColor = vec4(quantizedColor.rgb, 1.0);
            }
            `,
      })
    );
  };

  const hill = createHill(shape, [
    [121.67955387799792, 38.8813347859973, 0.3],
    [121.67992629541239, 38.88630445482012, 0.4],
    [121.68210759741146, 38.89206055333178, 0.3],
  ]);

  world.add(hill);
});
