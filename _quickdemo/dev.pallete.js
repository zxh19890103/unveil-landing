import extractPalette from "get-rgba-palette";
import sharp from "sharp";

export const route = /^\/palette/;

export const handler = (req, res) => {};

async function getPalette(tilePath) {
  // 1. Pre-process the tile to remove "messy" details
  const { data, info } = await sharp(tilePath)
    .resize(100, 100, { fit: "inside" }) // Downsample to average colors
    .blur(2) // Further reduce noise
    .raw()
    .toBuffer({ resolveWithObject: true });

  // 2. Extract the dominant colors (K-Means clustering)
  // We ask for 5 colors: Field Yellow, Mountain Green, Rock Gray, Water Blue, etc.
  const palette = extractPalette(data, 8);

  return palette.map((rgb) => `rgb(${rgb.join(",")})`);
}

getPalette("./data-gtiles/12/3338/1777.jpeg").then((colors) => {
  console.log("colors: ", colors);
});
