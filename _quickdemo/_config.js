export default {
  projects: [
    "_shared",
    "samrt-rc",
    "military",
    "harbor3d",
    "30days-map-challenge-shared",
    "30days-map-challenge-8-urban",
    "osm",
  ],
  importmaps: {
    imports: {
      three: "/assets/jslibs/three/three.module.js",
      "three/addons/": "https://threejs.org/examples/jsm/",
      react: "https://cdn.jsdelivr.net/npm/react@19.1.0/+esm",
      "react/jsx-runtime":
        "https://cdn.jsdelivr.net/npm/react@19.1.0/jsx-runtime/+esm",
      "react-dom": "https://cdn.jsdelivr.net/npm/react-dom@19.1.0/+esm",
      "react-dom/client":
        "https://cdn.jsdelivr.net/npm/react-dom@19.1.0/client/+esm",
      gsap: "https://cdn.skypack.dev/gsap",
    },
  },
};
