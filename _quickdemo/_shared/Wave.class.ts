import * as THREE from "three";

// ShaderMaterial
const waterMaterial = new THREE.ShaderMaterial({
  vertexShader: `
uniform float uTime;
uniform vec3 uSize;

varying float vRadius;

void main() {
  vec3 pos = position;
  float maxR = length(uSize);
  vRadius = length(pos.xy) / maxR;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
  `,
  fragmentShader: `
    varying float vRadius;
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, vRadius);
    }
  `,
  uniforms: {
    uTime: { value: 0.0 },
    uSize: { value: null },
  },
  transparent: true,
  side: THREE.DoubleSide,
  wireframe: false, // 可開啟觀察結構
});

export const createWave = (obj: THREE.Object3D) => {
  const box = new THREE.Box3().setFromObject(obj);
  // 水面尺寸與細分度
  const size = new THREE.Vector3();
  box.getSize(size);
  console.log(size);
  const waterGeometry = new THREE.PlaneGeometry(size.x, size.y, 128, 128);
  waterMaterial.uniforms.uSize.value = size;
  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  return water;
};
