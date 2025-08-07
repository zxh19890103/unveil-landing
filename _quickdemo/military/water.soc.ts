import * as THREE from "three";
import { Water } from "three/addons/objects/Water.js";
import { Sky } from "three/addons/objects/Sky.js";

import {
  __lights__,
  animationLoop,
  whenReady,
} from "@/_shared/SoCFramework.js";
import { ModelObj } from "@/_shared/ModelObj.class.js";
import { quickdemoAssets } from "@/_shared/assets-map.js";

whenReady((scene) => {
  // scene.add(new THREE.AxesHelper(20000));

  const warship = new ModelObj(
    quickdemoAssets.quickdemo_military_data_nanuchka_class_corvette_glb,
    "war",
    0xfe9108,
    {
      scaleFactor: 0.003,
      rotation: [0, 0, 0],
    }
  );

  warship.position.set(0, 0, 0);

  scene.add(warship);

  // Water geometry: 需要足夠大的平面和足夠的分段來顯示波浪細節
  const waterGeometry = new THREE.PlaneGeometry(10000, 10000, 128, 128);

  // Water material: 設置水面的屬性
  const water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load(
      "https://threejs.org/examples/textures/waternormals.jpg",
      function (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // 設置紋理重複
      }
    ),
    sunDirection: new THREE.Vector3(), // 太陽光方向，會在animate中更新
    sunColor: 0xffffff,
    waterColor: 0x001e0f, // 深綠藍色水體
    distortionScale: 1.7, // 扭曲程度
    fog: true, // 我們可以自己控制霧效，這裡暫時關閉
  });

  water.rotation.x = -Math.PI / 2; // 將平面旋轉到XY平面上
  scene.add(water);

  const sky = new Sky();
  const phi = THREE.MathUtils.degToRad(90);
  const theta = THREE.MathUtils.degToRad(90);
  const sunPosition = new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
  sky.material.uniforms.sunPosition.value = sunPosition;
  sky.scale.setScalar(45000);
  scene.add(sky);

  // --- Add a simple skybox (optional, but good for reflections) ---
  // 為了讓水面有東西可以反射，我們加一個簡單的立方體天空盒
  // const skyGeometry = new THREE.BoxGeometry(10000, 10000, 10000);
  // const skyMaterial = new THREE.MeshBasicMaterial({
  //   color: 0xf7ceeb, // 和背景色一致
  //   side: THREE.BackSide, // 讓材質渲染在立方體內部
  // });
  // const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  // scene.add(sky);

  animationLoop((delta, elapsed) => {
    // 更新水面的時間
    water.material.uniforms["time"].value = elapsed;
    // 更新水面的太陽光方向 (與DirectionalLight同步)
    const sunDirection = __lights__.dir.position.clone().normalize();
    water.material.uniforms["sunDirection"].value.copy(sunDirection);

    warship.position.x += 0.001;
    warship.rotation.x = 0.03 * Math.sin(elapsed);
  });
});
