import * as THREE from "three";
import {
  latLonToTile,
  tileToLatLon,
} from "@/30days-map-challenge-shared/core/clac.js";
import { __lights__, whenReady } from "@/_shared/SoCFramework.js";
import { textLoader } from "@/_shared/loader.js";
import { Sky } from "three/addons/objects/Sky.js";

/**
 * @todo
 *
 *  1. use sharp to convert the gtiff file to png correctly
 *  2. how to access the elevations information before load the dem picture.?
 *  3. access width and height before render it, setting them as segments.
 * 4. how to render it on sphere?
 */

// const EARTH_RADIUS = 6378137;
const Meters_per_lat = 111132;
const Meters_per_lon = (lat: number) =>
  111320 * Math.cos((lat * Math.PI) / 180);

whenReady(async (world, camera, renderer, controls) => {
  function CreateSky() {
    const sky = new Sky();
    sky.scale.setScalar(meters_by_x * 1.2); // Large scale to encompass the scene

    // Set sky uniforms
    const uniforms = sky.material.uniforms;
    uniforms["turbidity"].value = 10;
    uniforms["rayleigh"].value = 0.1;
    uniforms["mieCoefficient"].value = 0.5;
    uniforms["mieDirectionalG"].value = 0.1;

    // Set sun position
    const sun = new THREE.Vector3();
    const phi = THREE.MathUtils.degToRad(85); // Near horizon for sunset
    const theta = THREE.MathUtils.degToRad(180);
    sun.setFromSphericalCoords(1, phi, theta).normalize();
    // console.log("sun pos:", sun.toArray());
    // __lights__.dir.position.copy(sun);
    uniforms["sunPosition"].value.copy(sun);

    sky.material.needsUpdate = true;
    world.add(sky);
  }

  //   camera.far = 10 * EARTH_RADIUS;
  camera.near = 100;
  camera.far = 100000;
  camera.updateProjectionMatrix();

  controls.zoomSpeed = 1;
  controls.rotateSpeed = 1;

  const reGen = false;

  const [lat, lng] = [23.365712319441123, 103.40022228363058];
  const zoom = 12;

  const __ti__ = latLonToTile(lat, lng, zoom);
  console.log(__ti__, zoom);

  // bbox;
  const leftTop = tileToLatLon(__ti__[0], __ti__[1], zoom);
  const rightTop = tileToLatLon(__ti__[0] + 1, __ti__[1], zoom);
  const leftBottom = tileToLatLon(__ti__[0], __ti__[1] + 1, zoom);
  const rightBottom = tileToLatLon(__ti__[0] + 1, __ti__[1] + 1, zoom);
  const center = tileToLatLon(__ti__[0] + 0.5, __ti__[1] + 0.5, zoom);

  const bbox = `${leftBottom.lat},${leftBottom.lon},${rightTop.lat},${rightTop.lon}`;
  console.log(bbox);
  const bbox3857 = `${convert4326To3857(leftBottom)},${convert4326To3857(
    rightTop
  )}`;

  function calcbbox(x: number, y: number, z: number) {
    const leftTop = tileToLatLon(x, y, z);
    const rightTop = tileToLatLon(x + 1, y, z);
    const leftBottom = tileToLatLon(x, y + 1, z);
    const rightBottom = tileToLatLon(x + 1, y + 1, z);
    const center = tileToLatLon(x + 0.5, y + 0.5, z);

    const bbox = `${leftBottom.lat},${leftBottom.lon},${rightTop.lat},${rightTop.lon}`;
    const bbox3857 = `${convert4326To3857(leftBottom)},${convert4326To3857(
      rightTop
    )}`;

    return {
      x,
      y,
      z,
      leftTop,
      rightTop,
      leftBottom,
      rightBottom,
      center,
      bbox: bbox,
      bbox3857: bbox3857,
      toString: () => {
        return `${z}/${x}/${y} ~ ${bbox} ~ ${bbox3857}`;
      },
    };
  }

  function splitTo4() {
    const z = zoom + 1;

    const topLeft = [2 * __ti__[0], 2 * __ti__[1], z] as [
      number,
      number,
      number
    ];
    const topRight = [2 * __ti__[0] + 1, 2 * __ti__[1], z] as [
      number,
      number,
      number
    ];
    const bttomLeft = [2 * __ti__[0], 2 * __ti__[1] + 1, z] as [
      number,
      number,
      number
    ];
    const bttomRight = [2 * __ti__[0] + 1, 2 * __ti__[1] + 1, z] as [
      number,
      number,
      number
    ];

    const bbox0 = calcbbox(...topLeft);
    const bbox1 = calcbbox(...topRight);
    const bbox2 = calcbbox(...bttomLeft);
    const bbox3 = calcbbox(...bttomRight);

    return {
      bbox0,
      bbox1,
      bbox2,
      bbox3,
    };
  }

  function convert4326To3857({ lon, lat }) {
    const R = 6378137; // Earth's radius in meters

    // X coordinate: linear conversion
    let x = lon * (Math.PI / 180) * R;

    // Y coordinate: Mercator projection formula
    let y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) * R;

    return [x, y];
  }

  const getArcGisTileUrl = (bbox: string, size: number = 1024) => {
    // https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?F=image&FORMAT=PNG32&TRANSPARENT=true&SIZE=2048%2C2048&BBOX=-10018754.171394622%2C7514065.628545966%2C-7514065.628545966%2C10018754.171394622&BBOXSR=3857&IMAGESR=3857&DPI=180

    const query = new URLSearchParams();
    query.append("F", "image");
    query.append("FORMAT", "PNG32");
    query.append("TRANSPARENT", "true");
    query.append("SIZE", `${size},${size}`);
    query.append("BBOX", bbox);
    query.append("BBOXSR", "3857");
    query.append("IMAGESR", "3857");
    query.append("DPI", "180");

    return `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?${query.toString()}`;
  };

  const bbbbbbox3 = splitTo4();

  // const overlayUrl=`https://tile.openstreetmap.org/${zoom}/${__ti__[0]}/${__ti__[1]}.png`
  // const overlayUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief/default/GoogleMapsCompatible_Level8/${zoom}/${__ti__[1]}/${__ti__[0]}.jpg`;
  const overlayUrl = `https://mt1.google.com/vt/lyrs=s&x=${__ti__[0]}&y=${__ti__[1]}&z=${zoom}&scale=4&hl=en`;
  // const overlayUrl = `http://0.0.0.0:3003/texture/data-gtiles/googletile.cute_3d_tile.png`;
  const overlayUrl1 = `https://mt1.google.com/vt/lyrs=s&x=${bbbbbbox3.bbox0.x}&y=${bbbbbbox3.bbox0.y}&z=${bbbbbbox3.bbox0.z}&scale=4&hl=en`;
  const overlayUrl2 = `https://mt1.google.com/vt/lyrs=s&x=${bbbbbbox3.bbox1.x}&y=${bbbbbbox3.bbox1.y}&z=${bbbbbbox3.bbox1.z}&scale=4&hl=en`;
  const overlayUrl3 = `https://mt1.google.com/vt/lyrs=s&x=${bbbbbbox3.bbox2.x}&y=${bbbbbbox3.bbox2.y}&z=${bbbbbbox3.bbox2.z}&scale=4&hl=en`;
  const overlayUrl4 = `https://mt1.google.com/vt/lyrs=s&x=${bbbbbbox3.bbox3.x}&y=${bbbbbbox3.bbox3.y}&z=${bbbbbbox3.bbox3.z}&scale=4&hl=en`;

  // const overlayUrl = getArcGisTileUrl(bbox3857, 1024); //`https://mt1.google.com/vt/lyrs=s&x=${ti[0]}&y=${ti[1]}&z=${zoom}&scale=4&hl=en`;

  const meters_per_lon = Meters_per_lon(center.lat);

  const meters_by_x = meters_per_lon * (rightTop.lon - leftBottom.lon);
  const meters_by_y = Meters_per_lat * (rightTop.lat - leftBottom.lat);

  console.log(meters_by_x, meters_by_y);

  const calcXYZFromLatlng = (lat: number, lng: number) => {
    const dlat = lat - leftBottom.lat;
    const dlng = lng - leftBottom.lon;

    const x = meters_per_lon * dlng;
    const y = Meters_per_lat * dlat;

    return [x, y, 0];
  };

  const demTileUrl = `http://0.0.0.0:3003/texture/datadem/${zoom}-${__ti__[0]}-${__ti__[1]}.png`;

  // request dem data from openTopo
  fetch(
    `http://0.0.0.0:3003/dem?bbox=${bbox}&x=${__ti__[0]}&y=${__ti__[1]}&z=${zoom}&regen=${reGen}`
  );

  // request osm data from overpass api.
  // const osmWay = "building";

  function buildHighways(geojson) {
    const pts: number[] = [];
    const indices: number[] = [];

    const lines: number[][] = [];
    const lineHighways: string[] = [];

    let line: number[] = null;
    let cursor = 0;
    let last = 0;
    let max = 0;

    const highwayWidthConfig = {
      motorway: {
        approx_meters: 30,
        lanes_typical: "2-4 per direction + shoulders",
      },
      trunk: { approx_meters: 18, lanes_typical: "1-2 per direction" },
      primary: { approx_meters: 12, lanes_typical: "1-2 total" },
      secondary: { approx_meters: 9, lanes_typical: "1 total" },
      tertiary: { approx_meters: 7, lanes_typical: "1 total" },
      residential: { approx_meters: 6, lanes_typical: "shared" },
      path: { approx_meters: 1.5, lanes_typical: "none (pedestrian)" },
    };

    const getWidth = (highway) => {
      return highwayWidthConfig[highway]?.approx_meters ?? 3;
    };

    for (const { geometry, properties } of geojson.features) {
      const highway = properties.highway;
      if (
        !(
          highway === "motorway" ||
          highway === "trunk" ||
          highway === "primary" ||
          highway === "secondary" ||
          highway === "tertiary" ||
          highway === "path" ||
          highway === "residential"
        )
      ) {
        continue;
      }

      if (geometry.type === "Polygon") {
        for (const polygon of geometry.coordinates) {
          last = 0;
          max = polygon.length - 1;
          line = [];
          for (const coord of polygon) {
            pts.push(...calcXYZFromLatlng(coord[1], coord[0]));
            if (last < max) {
              indices.push(cursor, cursor + 1);
            }
            line.push(cursor);
            last++;
            cursor++;
          }

          lines.push(line);
          lineHighways.push(properties.highway);
        }
      } else if (geometry.type === "LineString") {
        const lineStr = geometry.coordinates;
        last = 0;
        max = lineStr.length - 1;
        line = [];
        for (const coord of lineStr) {
          pts.push(...calcXYZFromLatlng(coord[1], coord[0]));

          if (last < max) {
            indices.push(cursor, cursor + 1);
          } else {
          }

          line.push(cursor);

          cursor++;
          last++;
        }

        lines.push(line);
        lineHighways.push(properties.highway);
      }
    }

    const f32attri = new THREE.Float32BufferAttribute(pts, 3);

    const edgePts: number[] = [];
    const edgeUvs: number[] = [];
    const surfaceUvs: number[] = [];
    const edgeNormals: number[] = [];
    const edgeIndices: number[] = [];

    let edgePtCursor = 0;

    lines.forEach((line, idx) => {
      const l = line.length;
      const highwayType = lineHighways[idx];
      const width = getWidth(highwayType);
      const factor = 0.02;
      const isBigRoad = highwayType === "motorway" || highwayType === "trunk";
      const u0 = isBigRoad ? 0 : 0.56;
      const u1 = isBigRoad ? 0.56: 1;
      let i = 0;
      let v = 0;

      for (; i < l; i++) {
        let start = line[i];
        let end = line[i + 1];

        if (end === undefined) {
          // go back to add the last two edge points.
          end = line[i - 1];

          const pt0 = [
            f32attri.getX(start),
            f32attri.getY(start),
            f32attri.getZ(start),
          ] as THREE.Vector3Tuple;

          const pt1 = [
            f32attri.getX(end),
            f32attri.getY(end),
            f32attri.getZ(end),
          ] as THREE.Vector3Tuple;

          const dir = [
            pt0[0] - pt1[0],
            pt0[1] - pt1[1],
            pt0[2] - pt1[2],
          ] as THREE.Vector3Tuple;

          const edge = makeCenterLineEdgePts(pt0, dir, width);
          edgePts.push(...edge);

          edgeUvs.push(
            edge[0] / meters_by_x,
            edge[1] / meters_by_y,
            edge[3] / meters_by_x,
            edge[4] / meters_by_y
          );

          v += Math.hypot(pt0[0] - pt1[0], pt0[1] - pt1[1]) * factor;
          surfaceUvs.push(u0, v, u1, v);

          edgeNormals.push(0, 0, 1, 0, 0, 1);
          edgePtCursor += 2;
        } else {
          const pt0 = [
            f32attri.getX(start),
            f32attri.getY(start),
            f32attri.getZ(start),
          ] as THREE.Vector3Tuple;

          const pt1 = [
            f32attri.getX(end),
            f32attri.getY(end),
            f32attri.getZ(end),
          ] as THREE.Vector3Tuple;

          const dir = [
            pt1[0] - pt0[0],
            pt1[1] - pt0[1],
            pt1[2] - pt0[2],
          ] as THREE.Vector3Tuple;

          const edge = makeCenterLineEdgePts(pt0, dir, width);
          edgePts.push(...edge);
          edgeUvs.push(
            edge[0] / meters_by_x,
            edge[1] / meters_by_y,
            edge[3] / meters_by_x,
            edge[4] / meters_by_y
          );
          v += Math.hypot(pt0[0] - pt1[0], pt0[1] - pt1[1]) * factor;
          surfaceUvs.push(u0, v, u1, v);
          edgeNormals.push(0, 0, 1, 0, 0, 1);

          edgeIndices.push(
            edgePtCursor,
            edgePtCursor + 1,
            edgePtCursor + 3,
            edgePtCursor + 3,
            edgePtCursor + 2,
            edgePtCursor
          );

          edgePtCursor += 2;
        }
      }
    });

    const edgeVizGeo = new THREE.BufferGeometry();
    edgeVizGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(edgePts, 3)
    );
    edgeVizGeo.setAttribute("uv", new THREE.Float32BufferAttribute(edgeUvs, 2));
    edgeVizGeo.setAttribute(
      "uv1",
      new THREE.Float32BufferAttribute(surfaceUvs, 2)
    );
    edgeVizGeo.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(edgeNormals, 3)
    );

    edgeVizGeo.setIndex(edgeIndices);

    const surfaceMap = textLoader.load(
      "/quickdemo/30days-map-challenge-8-urban/road-face.png"
    );
    surfaceMap.channel = 1;
    surfaceMap.wrapS = surfaceMap.wrapT = THREE.RepeatWrapping;
    surfaceMap.magFilter = THREE.LinearFilter;
    surfaceMap.minFilter = THREE.LinearFilter;

    const edgeViz = new THREE.Mesh(
      edgeVizGeo,
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: surfaceMap,
        roughness: 1.0,
        side: THREE.DoubleSide,
        displacementMap: demmap,
        displacementScale: elevationSpan,
        displacementBias: elevations.minElevation + 7,
      })
    );

    // edgeViz.position.set(-meters_by_x / 2, -meters_by_y / 2, 0);
    edgeViz.frustumCulled = false;
    mesh.add(edgeViz);

    // const ptGeo = new THREE.BufferGeometry();
    // ptGeo.setAttribute("position", f32attri);
    // ptGeo.setIndex(indices);

    // const ptViz = new THREE.LineSegments(
    //   ptGeo,
    //   new THREE.ShaderMaterial({
    //     visible: true,
    //     uniforms: {
    //       uDem: {
    //         value: demmap,
    //       },
    //       uSize: {
    //         value: new THREE.Vector2(meters_by_x, meters_by_y),
    //       },
    //     },
    //     vertexShader: `
    //         uniform sampler2D uDem;
    //         uniform vec2 uSize;

    //         void main() {
    //           vec3 pos = position.xyz;
    //           vec2 uv = pos.xy / uSize;
    //           float h = texture2D(uDem, uv).r;
    //           pos.z = 1179.0 + 2173.0 * h + 2.5;
    //           gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    //           gl_PointSize = 2.0;
    //         }
    //       `,
    //     fragmentShader: `
    //         void main() {
    //           gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    //         }
    //       `,
    //   })
    // );

    // ptViz.position.set(-meters_by_x / 2, -meters_by_y / 2, 0);
    // ptViz.frustumCulled = false;
    // mesh.add(ptViz);
  }

  function buildWaterways(geojson) {
    const pts: number[] = [];
    const indices: number[] = [];
    const lines: number[][] = [];

    let line: number[] = null;
    let cursor = 0;
    let last = 0;
    let max = 0;

    for (const { geometry, properties } of geojson.features) {
      const waterway = properties.waterway;
      if (!(waterway === "river")) {
        continue;
      }

      if (geometry.type === "Polygon") {
        for (const polygon of geometry.coordinates) {
          last = 0;
          max = polygon.length - 1;
          line = [];
          for (const coord of polygon) {
            pts.push(...calcXYZFromLatlng(coord[1], coord[0]));
            if (last < max) {
              indices.push(cursor, cursor + 1);
            }
            line.push(cursor);
            last++;
            cursor++;
          }
          lines.push(line);
        }
      } else if (geometry.type === "LineString") {
        const lineStr = geometry.coordinates;
        last = 0;
        max = lineStr.length - 1;
        line = [];
        for (const coord of lineStr) {
          pts.push(...calcXYZFromLatlng(coord[1], coord[0]));

          if (last < max) {
            indices.push(cursor, cursor + 1);
          } else {
          }

          line.push(cursor);

          cursor++;
          last++;
        }
        lines.push(line);
      }
    }

    const f32attri = new THREE.Float32BufferAttribute(pts, 3);

    const edgePts: number[] = [];
    const edgeUvs: number[] = [];
    const surfaceUvs: number[] = [];
    const edgeNormals: number[] = [];
    const edgeIndices: number[] = [];

    let edgePtCursor = 0;
    const width = 30;

    lines.forEach((line) => {
      const l = line.length;
      let i = 0;

      for (; i < l; i++) {
        let start = line[i];
        let end = line[i + 1];

        if (end === undefined) {
          // go back to add the last two edge points.
          end = line[i - 1];

          const pt0 = [
            f32attri.getX(start),
            f32attri.getY(start),
            f32attri.getZ(start),
          ] as THREE.Vector3Tuple;

          const pt1 = [
            f32attri.getX(end),
            f32attri.getY(end),
            f32attri.getZ(end),
          ] as THREE.Vector3Tuple;

          const dir = [
            pt0[0] - pt1[0],
            pt0[1] - pt1[1],
            pt0[2] - pt1[2],
          ] as THREE.Vector3Tuple;

          const edge = makeCenterLineEdgePts(pt0, dir, width);
          edgePts.push(...edge);
          edgeUvs.push(
            edge[0] / meters_by_x,
            edge[1] / meters_by_y,
            edge[3] / meters_by_x,
            edge[4] / meters_by_y
          );
          surfaceUvs.push(0, 1, 1, 1);
          edgeNormals.push(0, 0, 1, 0, 0, 1);
          edgePtCursor += 2;
        } else {
          const pt0 = [
            f32attri.getX(start),
            f32attri.getY(start),
            f32attri.getZ(start),
          ] as THREE.Vector3Tuple;

          const pt1 = [
            f32attri.getX(end),
            f32attri.getY(end),
            f32attri.getZ(end),
          ] as THREE.Vector3Tuple;

          const dir = [
            pt1[0] - pt0[0],
            pt1[1] - pt0[1],
            pt1[2] - pt0[2],
          ] as THREE.Vector3Tuple;

          const edge = makeCenterLineEdgePts(pt0, dir, width);
          edgePts.push(...edge);
          edgeUvs.push(
            edge[0] / meters_by_x,
            edge[1] / meters_by_y,
            edge[3] / meters_by_x,
            edge[4] / meters_by_y
          );

          surfaceUvs.push(0, 0, 1, 0, 0, i / l, 1, i / l);
          edgeNormals.push(0, 0, 1, 0, 0, 1);

          edgeIndices.push(
            edgePtCursor,
            edgePtCursor + 1,
            edgePtCursor + 3,
            edgePtCursor + 3,
            edgePtCursor + 2,
            edgePtCursor
          );

          edgePtCursor += 2;
        }
      }
    });

    const edgeVizGeo = new THREE.BufferGeometry();
    edgeVizGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(edgePts, 3)
    );
    edgeVizGeo.setAttribute("uv", new THREE.Float32BufferAttribute(edgeUvs, 2));
    edgeVizGeo.setAttribute(
      "uv1",
      new THREE.Float32BufferAttribute(surfaceUvs, 2)
    );
    edgeVizGeo.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(edgeNormals, 3)
    );

    edgeVizGeo.setIndex(edgeIndices);

    const riverSurface = textLoader.load(
      "/quickdemo/30days-map-challenge-8-urban/river-flow.png"
    );
    riverSurface.channel = 1;
    riverSurface.minFilter = THREE.LinearFilter;
    riverSurface.magFilter = THREE.LinearFilter;

    const edgeViz = new THREE.Mesh(
      edgeVizGeo,
      new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissiveIntensity: 0.3,
        map: riverSurface,
        side: THREE.DoubleSide,
        displacementMap: demmap,
        displacementScale: elevationSpan,
        displacementBias: elevations.minElevation + 1,
      })
    );

    // edgeViz.position.set(-meters_by_x / 2, -meters_by_y / 2, 0);
    edgeViz.frustumCulled = false;
    mesh.add(edgeViz);
  }

  function buildNatrual(geojson) {
    const geodat: GeometryAttriData = {
      tileSize: { x: meters_by_x, y: meters_by_y },
      offset: 0,
      position: [],
      indices: [],
      uv: [],
      uv1: [],
      color: [],
      normal: [],
    };

    const projectFn: Projector = (lnglat) => {
      return calcXYZFromLatlng(lnglat[1], lnglat[0]) as XY;
    };

    let count = 0;
    for (const { geometry, properties } of geojson.features) {
      if (properties.natural !== "water") continue;

      if (geometry.type === "Polygon") {
        for (const polygon of geometry.coordinates) {
          makeOneNaturalArea(polygon, projectFn, geodat);
          count++;
        }
      }
    }

    console.log("natural areas count", count);

    const surface = textLoader.load(
      "/quickdemo/30days-map-challenge-8-urban/river.jpeg"
    );
    surface.channel = 0;
    surface.wrapS = THREE.MirroredRepeatWrapping;
    surface.wrapT = THREE.MirroredRepeatWrapping;
    surface.minFilter = THREE.NearestMipMapNearestFilter;
    surface.magFilter = THREE.LinearFilter;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(geodat.position, 3)
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(geodat.uv, 2));
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(geodat.normal, 3)
    );
    geometry.setIndex(geodat.indices);

    const mesh0 = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        wireframe: false,
        map: surface,
        color: 0xffffff,
        side: THREE.DoubleSide,
        displacementMap: demmap,
        displacementScale: elevationSpan,
        displacementBias: elevations.minElevation + 5,
      })
    );

    mesh.add(mesh0);
    mesh0.frustumCulled = false;
  }

  function buildBuildings(geojson) {
    const geodat: GeometryAttriData = {
      tileSize: { x: meters_by_x, y: meters_by_y },
      offset: 0,
      position: [],
      indices: [],
      uv: [],
      uv1: [],
      color: [],
      normal: [],
    };

    const getHeight = (properties) => {
      if (Object.hasOwn(properties, "height")) {
        return Number(properties.height);
      } else if (Object.hasOwn(properties, "building:levels")) {
        return Number(properties["building:levels"]) * 6;
      } else if (properties.building === "apartments") {
        return 90;
      } else if (properties.building === "commercial") {
        return 120;
      }
      return 34;
    };

    const projectFn: Projector = (lnglat) => {
      return calcXYZFromLatlng(lnglat[1], lnglat[0]) as XY;
    };

    let count = 0;
    for (const { geometry, properties } of geojson.features) {
      if (properties.building === undefined) continue;

      if (geometry.type === "Polygon") {
        const lnglats = geometry.coordinates[0];
        const h = getHeight(properties);
        count++;
        makeOneBuilding(lnglats, h, projectFn, geodat, properties);
      }
    }

    console.log("buildings count", count);

    const surface = textLoader.load(
      "/quickdemo/30days-map-challenge-8-urban/building-wall.jpeg"
    );
    surface.channel = 1;
    surface.wrapS = THREE.RepeatWrapping;
    surface.wrapT = THREE.RepeatWrapping;
    surface.minFilter = THREE.NearestMipMapNearestFilter;
    surface.magFilter = THREE.NearestFilter;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(geodat.position, 3)
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(geodat.uv, 2));
    geometry.setAttribute(
      "uv1",
      new THREE.Float32BufferAttribute(geodat.uv1, 2)
    );
    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(geodat.color, 3)
    );
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(geodat.normal, 3)
    );
    geometry.setIndex(geodat.indices);

    const mesh0 = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        wireframe: false,
        map: surface,
        color: 0xffffff,
        vertexColors: true,
        side: THREE.DoubleSide,
        displacementMap: demmap,
        displacementScale: elevationSpan,
        displacementBias: elevations.minElevation + 5,
      })
    );

    mesh.add(mesh0);
    mesh0.frustumCulled = false;
  }

  const elevations: DemElevations = await fetch(
    `http://0.0.0.0:3003/texture/datadem/${zoom}-${__ti__[0]}-${__ti__[1]}.gtiff.elevation.json`
  ).then((r) => r.json());

  const elevationSpan = elevations.maxElevation - elevations.minElevation;

  console.log("elevationSpan", elevationSpan);

  const demmap = textLoader.load(demTileUrl);
  demmap.minFilter = THREE.NearestFilter;
  demmap.magFilter = THREE.LinearFilter;

  const overlayMap = textLoader.load(overlayUrl);
  overlayMap.magFilter = THREE.LinearFilter;
  overlayMap.minFilter = THREE.LinearMipMapLinearFilter;

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  overlayMap.anisotropy = maxAnisotropy;

  // the number of segments are determined by dem map.
  const segments_by_x = 1266;
  const segments_by_y = 1164;

  CreateSky();

  const geo = new THREE.PlaneGeometry(
    meters_by_x,
    meters_by_y,
    segments_by_x,
    segments_by_y
  );

  function buildGroundGeometry(
    width: number,
    height: number,
    widthSegments: number,
    heightSegments: number,
    dobule = false
  ) {
    const geometry = new THREE.BufferGeometry();

    const vertex: number[] = [];
    const normal: number[] = [];
    const uv: number[] = [];
    const triangles: number[] = [];

    // const offsetX = -width / 2;
    // const offsetY = -height / 2;

    const offsetX = 0;
    const offsetY = 0;

    const dx = width / widthSegments;
    const dy = height / heightSegments;

    let x = 0;
    let y = 0;
    let u = 0;
    let v = 0;

    const Index = (i: number, j: number) => {
      return i * (heightSegments + 1) + j;
    };

    for (let i = 0; i <= widthSegments; i++) {
      for (let j = 0; j <= heightSegments; j++) {
        x = -offsetX + i * dx;
        y = -offsetY + j * dy;

        vertex.push(x, y, 0);
        normal.push(0, 0, 1);

        u = x / width;
        v = y / height;
        uv.push(u, v);
      }
    }

    for (let i = 0; i < widthSegments; i++) {
      for (let j = 0; j < heightSegments; j++) {
        triangles.push(
          Index(i, j),
          Index(i + 1, j),
          Index(i + 1, j + 1),
          Index(i + 1, j + 1),
          Index(i, j + 1),
          Index(i, j)
        );
      }
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertex, 3)
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(normal, 3)
    );
    geometry.setIndex(triangles);

    return geometry;
  }

  const geo2 = buildGroundGeometry(
    meters_by_x,
    meters_by_y,
    segments_by_x,
    segments_by_y
  );

  const overlayMap1 = textLoader.load(overlayUrl1);
  const overlayMap2 = textLoader.load(overlayUrl2);
  const overlayMap3 = textLoader.load(overlayUrl3);
  const overlayMap4 = textLoader.load(overlayUrl4);

  const isSplitTo4 = false;

  const mat1 = new THREE.ShaderMaterial({
    visible: true,
    uniforms: {
      ambLightColor: {
        value: __lights__.amb.color,
      },
      ambLightIntensity: {
        value: __lights__.amb.intensity,
      },
      dirLightColor: {
        value: __lights__.dir.color,
      },
      dirLightDir: {
        value: __lights__.dir.position.clone().negate(),
      },
      dirLightIntensity: {
        value: __lights__.dir.intensity,
      },
      uOverlayMap: {
        value: overlayMap,
      },
      uOverlayMap1: {
        value: overlayMap1,
      },
      uOverlayMap2: {
        value: overlayMap2,
      },
      uOverlayMap3: {
        value: overlayMap3,
      },
      uOverlayMap4: {
        value: overlayMap4,
      },
      uDem: {
        value: demmap,
      },
      uElevations: {
        value: new THREE.Vector3(
          elevations.minElevation,
          elevations.maxElevation,
          elevationSpan
        ),
      },
      uSize: {
        value: new THREE.Vector2(meters_by_x, meters_by_y),
      },
    },
    vertexShader: /**glsl */ `
            uniform sampler2D uDem;
            uniform vec2 uSize;
            uniform vec3 uElevations;

            varying vec2 vUv;
            varying vec3 vViewPosition;

            void main() {
              vec3 pos = position.xyz;
              vUv = uv;
              float h = texture2D(uDem, uv).r;
              pos.z = uElevations.x + uElevations.z * h;

              vViewPosition = pos;

              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
          `,
    fragmentShader: isSplitTo4
      ? /*glsl*/ `
            uniform sampler2D uOverlayMap;
            uniform sampler2D uOverlayMap1; // leftTop
            uniform sampler2D uOverlayMap2; // rightTop
            uniform sampler2D uOverlayMap3; // leftBottom
            uniform sampler2D uOverlayMap4; // rightBottom

            varying vec2 vUv;

            void main() {
              vec4 color;
              vec2 aUv;

              if (vUv.x <= 0.5 && vUv.y <= 0.5) {
                color = texture2D(uOverlayMap3, vUv * 2.0);
              } else if (vUv.x <= 0.5 && vUv.y > 0.5) {
                aUv.x = 2.0 * vUv.x;
                aUv.y = 2.0 * (vUv.y - 0.5);
                color = texture2D(uOverlayMap1, aUv);
              } else if (vUv.x > 0.5 && vUv.y <= 0.5) {
                aUv.x = 2.0 * (vUv.x - 0.5);
                aUv.y = 2.0 * vUv.y;
                color = texture2D(uOverlayMap4, aUv);
              } else {
                aUv.x = 2.0 * (vUv.x - 0.5);
                aUv.y = 2.0 * (vUv.y - 0.5);
                color = texture2D(uOverlayMap2, aUv);
              }

              // can modify the output here
              gl_FragColor = vec4(color.rgb, 1.0);
            }
          `
      : `
            uniform sampler2D uOverlayMap;
            varying vec2 vUv;

            uniform vec3 ambLightColor;
            uniform float ambLightIntensity;
            uniform vec3 dirLightColor;
            uniform float dirLightIntensity;
            uniform vec3 dirLightDir;

            varying vec3 vViewPosition; // Pass the modelViewPosition from Vertex

            void main() {
              vec4 color = texture2D(uOverlayMap, vUv);

              vec3 fdx = dFdx(vViewPosition);
              vec3 fdy = dFdy(vViewPosition);

              vec3 normal0 = normalize(cross(fdx, fdy));

              float diffuse = max(dot(normal0, dirLightDir), 0.0);

              vec3 lighting = ambLightColor.rgb * ambLightIntensity + (dirLightColor.rgb * diffuse) * dirLightIntensity;

              gl_FragColor = vec4(color.rgb * lighting, 1.0);
            }
          `,
  });

  const mat2 = new THREE.MeshStandardMaterial({
    map: overlayMap,
    side: THREE.DoubleSide,
    displacementMap: demmap,
    displacementScale: elevationSpan,
    displacementBias: elevations.minElevation,
    transparent: false,
    opacity: 0.4,
    color: 0xffffff,
  });

  const mesh = new THREE.Mesh(geo2, mat1);

  // mesh.rotation.x = -Math.PI / 2;

  mesh.rotateX(-Math.PI / 2);
  mesh.position.set(
    -meters_by_x / 2,
    -elevations.minElevation,
    meters_by_y / 2
  );

  // controls.target.set(meters_by_x / 2, meters_by_y / 2, 0);
  // camera.position.set(meters_by_x / 2, 1000 + meters_by_y / 2, 4000);
  camera.position.set(0, 600, 2000);
  // controls.

  // Set this BEFORE creating camera and controls
  // THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

  world.add(mesh, new THREE.AxesHelper(3000));

  await fetch(
    `http://0.0.0.0:3003/osm?bbox=${bbox}&way=building&x=${__ti__[0]}&y=${__ti__[1]}&z=${zoom}&regen=${reGen}`
  )
    .then((r) => r.json())
    .then(buildBuildings);

  await fetch(
    `http://0.0.0.0:3003/osm?bbox=${bbox}&way=highway&x=${__ti__[0]}&y=${__ti__[1]}&z=${zoom}&regen=${reGen}`
  )
    .then((r) => r.json())
    .then(buildHighways);

  await fetch(
    `http://0.0.0.0:3003/osm?bbox=${bbox}&way=waterway&x=${__ti__[0]}&y=${__ti__[1]}&z=${zoom}&regen=${reGen}`
  )
    .then((r) => r.json())
    .then(buildWaterways);

  await fetch(
    `http://0.0.0.0:3003/osm?bbox=${bbox}&way=natural&x=${__ti__[0]}&y=${__ti__[1]}&z=${zoom}&regen=${reGen}`
  )
    .then((r) => r.json())
    .then(buildNatrual);
});

const vec3Util = new THREE.Vector3();
const vec3Util1 = new THREE.Vector3();
const vec3Util2 = new THREE.Vector3();

type DemElevations = {
  minElevation: number;
  maxElevation: number;
};
type LngLat = [number, number];
type XY = [number, number, number];
type Projector = (lnglat: LngLat) => XY;
type GeometryAttriData = {
  tileSize: Readonly<{ x: number; y: number }>;
  offset: number;
  position: number[];
  indices: number[];
  normal: number[];
  color: number[];
  uv: number[];
  uv1: number[];
};

function makeOneBuilding(
  lnglats: LngLat[],
  height: number,
  project: Projector,
  geoAttriData: GeometryAttriData,
  properties
) {
  const pts = lnglats.map(project);
  const { tileSize, position, color, indices, normal, uv, uv1 } = geoAttriData;
  const max = pts.length - 1;
  const uniformColor = new THREE.Color(
    BuildingColor[properties.building] ?? 0xffffff
  );

  let offset = geoAttriData.offset;
  let cursor = 0;
  let x = 0;
  let y = 0;
  let u = 0;

  for (const pt of pts) {
    if (cursor > 0) {
      u += Math.hypot(pt[0] - x, pt[1] - y) * 0.05;
    }

    x = pt[0];
    y = pt[1];

    position.push(x, y, 0); // 0, 2
    color.push(uniformColor.r, uniformColor.g, uniformColor.b);
    uv.push(x / tileSize.x, y / tileSize.y);
    uv1.push(u, 0);
    normal.push(0, 0, 1);
    position.push(x, y, height); // 1, 3
    color.push(uniformColor.r, uniformColor.g, uniformColor.b);
    uv.push(x / tileSize.x, y / tileSize.y);
    uv1.push(u, height * 0.1);
    normal.push(0, 0, 1);

    if (cursor < max) {
      indices.push(
        offset,
        offset + 2,
        offset + 3,
        offset + 3,
        offset + 1,
        offset
      );
    }

    offset += 2;
    cursor += 1;
  }

  const vec2s = pts.map((p) => {
    return new THREE.Vector2(p[0], p[1]);
  });

  const offset0 = offset;

  for (const vec of vec2s) {
    position.push(vec.x, vec.y, height);
    uv.push(vec.x / tileSize.x, vec.y / tileSize.y);
    color.push(uniformColor.r, uniformColor.g, uniformColor.b);
    uv1.push(0.5, 0.5); // pure color.
    normal.push(0, 0, 1);
    offset += 1;
  }

  const roofs = THREE.ShapeUtils.triangulateShape(vec2s, []);

  for (const tri of roofs) {
    indices.push(offset0 + tri[0], offset0 + tri[1], offset0 + tri[2]);
  }

  geoAttriData.offset = offset;
}

function makeCenterLineEdgePts(
  pt: THREE.Vector3Tuple,
  dir: THREE.Vector3Tuple,
  width: number
) {
  const Origin = vec3Util1.set(...pt);

  const normalizedDir = vec3Util.set(...dir).normalize();

  // 2. Create the perpendicular vector (rotated 90 degrees in XY plane)
  // For a vector (x, y), the perpendicular is (-y, x)
  const perp = vec3Util2.set(-normalizedDir.y, normalizedDir.x, 0);

  // 3. Scale by half the width
  const halfWidth = width / 2;
  const offset = perp.multiplyScalar(halfWidth);

  // 4. Calculate L and R by adding/subtracting from Origin
  const L = new THREE.Vector3().addVectors(Origin, offset);
  const R = new THREE.Vector3().subVectors(Origin, offset);

  return [...L.toArray(), ...R.toArray()];
}

function makeOneNaturalArea(
  lnglats: LngLat[],
  project: Projector,
  geoAttriData: GeometryAttriData
) {
  const pts = lnglats.map(project);
  const { tileSize, position, indices, normal, uv } = geoAttriData;

  const vec2s: THREE.Vector2[] = [];

  const offset0 = geoAttriData.offset;

  let offset = offset0;
  let x = 0;
  let y = 0;

  for (const p of pts) {
    x = p[0];
    y = p[1];
    position.push(x, y, 0);
    uv.push(x / tileSize.x, y / tileSize.y);
    normal.push(0, 0, 1);

    // for polygon generating
    vec2s.push(new THREE.Vector2(p[0], p[1]));
    offset++;
  }

  const area = THREE.ShapeUtils.triangulateShape(vec2s, []);

  for (const tri of area) {
    indices.push(offset0 + tri[0], offset0 + tri[1], offset0 + tri[2]);
  }

  geoAttriData.offset = offset;
}

/**
 * Enum mapping building types to Hexadecimal numbers.
 * Format: 0xRRGGBB
 */

/**
 * Building Color Enum with lowercase keys and numeric hex values.
 */
enum BuildingColor {
  dormitory = 0xffadad,
  industrial = 0x707070,
  office = 0x5dade2,
  garage = 0x4d5656,
  commercial = 0xff8c00,
  apartments = 0xf0b27a,
  school = 0xf4d03f,
  residential = 0xabebc6,
  train_station = 0x5499c7,
  retail = 0xec7063,
  construction = 0xb7950b,
  roof = 0x34495e,
  parking = 0x2e4053,
  carport = 0x566573,
  kindergarten = 0xf7dc6f,
  ruins = 0xa93226,
  storage_tank = 0xd5d8dc,
  shed = 0x8d6e63,
  hospital = 0xffffff,
  warehouse = 0x85929e,
  temple = 0xaf7ac5,
  hotel = 0xeb984e,
}
