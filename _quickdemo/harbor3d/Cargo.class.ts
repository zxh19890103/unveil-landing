import * as THREE from "three";

export const CargoSpec: THREE.Vector3Tuple = [0.05, 0.05, 0.1];

const loader = new THREE.TextureLoader();

const texture = loader.load("/quickdemo/harbor3d/cargo.jpg");

texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter;

export class Cargo extends THREE.Mesh {
  readonly __$interactive = true;
  readonly __$hoverStyle: InteractiveStyle = "outlined";
  readonly $$type = "cargo";

  readonly userData = {
    iso_code: "22G1",
    container_id: "TCNU1234567",
    gross_weight_kg: 28500,
    tare_weight_kg: 4500,
    cargo_description: "電子產品",
    status: "堆場存放",
  };

  readonly size: THREE.Vector3;

  constructor(color: THREE.ColorRepresentation) {
    const geometry = new THREE.BoxGeometry(...CargoSpec);

    super(
      geometry,
      new THREE.MeshPhongMaterial({
        color: cargo_container_colors[Math.floor(Math.random() * 9)].hex,
        map: texture,
        // emissive: cargo_container_colors[Math.floor(Math.random() * 9)].hex,
        // emissive: '#ffffff',
        // emissiveIntensity: 1,
        // emissiveMap: texture,
      })
    );
  }
}

const cargo_container_colors = [
  {
    name: "Safety Orange",
    hex: "#FF7F00",
  },
  {
    name: "Marine Blue",
    hex: "#005A9C",
  },
  {
    name: "Bright Red",
    hex: "#E30000",
  },
  {
    name: "Signal Green",
    hex: "#39A339",
  },
  {
    name: "Traffic Yellow",
    hex: "#FFD700",
  },
  {
    name: "Teal",
    hex: "#008080",
  },
  {
    name: "Royal Purple",
    hex: "#7851A9",
  },
  {
    name: "Charcoal Gray",
    hex: "#36454F",
  },
  {
    name: "Lime Green",
    hex: "#32CD32",
  },
];
