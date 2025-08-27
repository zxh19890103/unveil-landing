import * as THREE from "three";
import { geoMercator } from "@/_shared/geo-mercator.js";
import { whenReady } from "@/_shared/SoCFramework.js";
import { textLoader } from "@/_shared/loader.js";

const shapeLatlngStr = `
              121.6358332,38.9381659,0
              121.6331295,38.9370977,0
              121.6343312,38.9351616,0
              121.6327004,38.9351282,0
              121.6322283,38.9356623,0
              121.6300825,38.9347777,0
              121.6309408,38.93295,0
              121.6292886,38.932491,0
              121.6273892,38.9354122,0
              121.6255893,38.9346987,0
              121.6267934,38.9316484,0
              121.6244357,38.9308013,0
              121.6228504,38.9327585,0
              121.6221634,38.9324831,0
              121.6234213,38.9303257,0
              121.6224248,38.9298813,0
              121.6213579,38.9309402,0
              121.6210635,38.9303633,0
              121.6165816,38.9286232,0
              121.6131295,38.9310894,0
              121.609911,38.9295701,0
              121.6005997,38.9181014,0
              121.5875637,38.9025454,0
              121.6400938,38.8869862,0
              121.705399,38.8721417,0
              121.7096824,38.8769744,0
              121.7100666,38.8801203,0
              121.7124046,38.8808914,0
              121.712511,38.8831324,0
              121.7108764,38.8868852,0
              121.7121603,38.8903705,0
              121.7144743,38.8925197,0
              121.7163593,38.8951365,0
              121.7166151,38.8965116,0
              121.7173654,38.8967483,0
              121.7179336,38.8978687,0
              121.718931,38.8977532,0
              121.7221672,38.904659,0
              121.7187424,38.906976,0
              121.7190941,38.9080908,0
              121.7202182,38.9129457,0
              121.7208661,38.9153732,0
              121.720484,38.9176671,0
              121.7140983,38.9194667,0
              121.7133087,38.9180959,0
              121.7096008,38.9192627,0
              121.7055495,38.9205964,0
              121.7064763,38.9216629,0
              121.699575,38.9236621,0
              121.6838835,38.9283943,0
              121.6811014,38.9278887,0
              121.678491,38.9288521,0
              121.6793064,38.9302877,0
              121.6779331,38.9322907,0
              121.677504,38.933359,0
              121.6755299,38.9330585,0
              121.6739849,38.932925,0
              121.6720537,38.93179,0
              121.6708521,38.9315229,0
              121.6714958,38.9333923,0
              121.6696934,38.9339932,0
              121.6667752,38.929186,0
              121.663299,38.9303544,0
              121.6658739,38.9352951,0
              121.6643719,38.9358626,0
              121.6614966,38.9308552,0
              121.6589646,38.93179,0
              121.6615824,38.9367639,0
              121.6600804,38.9372313,0
              121.6575913,38.9322239,0
              121.6547589,38.9331587,0
              121.657205,38.9381659,0
              121.6554455,38.9388335,0
              121.6515402,38.9322907,0
              121.6498665,38.9314895,0
              121.6476778,38.931189,0
              121.6469912,38.9325578,0
              121.646562,38.9331587,0
              121.647592,38.9335593,0
              121.6472916,38.9340934,0
              121.6476778,38.934494,0
              121.6501669,38.9335593,0
              121.6505102,38.9341268,0
              121.6473345,38.9355956,0
              121.6513686,38.9400352,0
              121.6502098,38.9407696,0
              121.6505102,38.9412035,0
              121.6472058,38.9429392,0
              121.6425709,38.9397014,0
              121.6417126,38.9404024,0
              121.6358332,38.9381659,0
`;

whenReady((world, camera, renderer, controls) => {
  const mercator = geoMercator(150, 10000, 121.63, 38.935);

  const toXyz = (latlng: LatLng) => {
    const xy = mercator.project(latlng);
    return new THREE.Vector3(xy[0], 0, -xy[1]);
  };

  const parse = (coordinates: string) => {
    return coordinates
      .split("\n")
      .map((i) => i.trim())
      .filter(Boolean)
      .map((i) => {
        return i.split(",").map((c) => Number(c)) as LatLng;
      });
  };

  const centerLatlng = [121.66281753515082, 38.90913394082861] as LatLng;

  const center = toXyz(centerLatlng);
  controls.target.copy(center);
  camera.position.z = 30;

  const shape = parse(shapeLatlngStr);

  const createHill = (latlng: LatLng, elevation: number, shape: LatLng[]) => {
    const curve = new THREE.CatmullRomCurve3(
      shape.map((s) => toXyz(s)),
      true,
      "catmullrom",
      0.5
    );
    const points = curve.getSpacedPoints(600);

    const top = toXyz(latlng);
    top.y = elevation * 0.03;

    points.unshift(top);

    const indices: number[] = [];

    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints(points);
    geometry.computeVertexNormals();

    const uvs: Float32Array = new Float32Array(2 * points.length);

    uvs[0] = 0.5;
    uvs[1] = 1.0;

    for (let i = 1, len = points.length - 1; i < len; i++) {
      const index0 = 0;
      const index1 = i;
      const index2 = i + 1;

      uvs[2 * index1] = 1;
      uvs[2 * index1 + 1] = 0.5;

      indices.push(index0, index1, index2);
    }

    geometry.setIndex(indices);
    geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));

    const tex = textLoader.load("/quickdemo/harbor3d/hills.jpg");
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;

    return new THREE.Mesh(
      geometry,
      new THREE.MeshToonMaterial({
        color: 0xffffff,
        emissive: 0x12de09,
        emissiveIntensity: 0.3,
        map: tex,
      })
    );
  };

  const hill = createHill(centerLatlng, 138, shape);

  world.add(hill);
});
