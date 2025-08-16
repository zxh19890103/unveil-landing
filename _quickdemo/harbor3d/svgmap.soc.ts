import * as THREE from "three";
import { __lights__, whenReady } from "@/_shared/SoCFramework.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";

whenReady((world) => {
  const loader = new SVGLoader();
  loader.load("/quickdemo/harbor3d/map.svg", (data) => {
    const group = new THREE.Group();

    group.scale.setScalar(0.01);

    const { paths } = data;

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      // Get the points from the path
      const points = path.currentPath.getPoints();

      // Create a BufferGeometry and set its attributes
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      // Define a material for the line
      const material = new THREE.LineBasicMaterial({
        color: path.color,
        linewidth: 1, // Note: linewidth is not supported in most browsers
      });

      // Create the line and add it to the group
      const line = new THREE.Line(geometry, material);
      group.add(line);
    }

    const box = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3();
    console.log(box.getSize(size));

    world.add(group);
  });
});
