import sharp from "sharp";

async function processTileVectorStyle(inputPath, outputPath) {
  try {
    const metadata = await sharp(inputPath).metadata();

    // 1. Define how much simplification you want.
    // A factor of 4 or 8 will turn small details into clean blocks.
    const simplifyFactor = 4;
    const smallWidth = Math.floor(metadata.width / simplifyFactor);
    const smallHeight = Math.floor(metadata.height / simplifyFactor);

    await sharp(inputPath)
      // 2. Shrink it using 'mitchell' or 'lanczos' to average the colors
      .resize(smallWidth, smallHeight, { kernel: sharp.kernel.mitchell })

      // 3. Boost saturation significantly so the shader has "strong" colors to work with
      .modulate({ saturation: 2.0, brightness: 1.1 })

      // 4. Scale it BACK to original size using NEAREST neighbor.
      // This creates the "pixel art" / sharp blocky look.
      .resize(metadata.width, metadata.height, { kernel: sharp.kernel.nearest })

      // 5. Sharpen the result to ensure the "cute" blocks have crisp borders
      .sharpen({ sigma: 1.5, m1: 2.0 })

      .toFile(outputPath);

    console.log("Sharp stylized tile created!");
  } catch (err) {
    console.error(err);
  }
}

async function processToCleanPalette(inputPath, outputPath) {
  try {
    const metadata = await sharp(inputPath).metadata();

    // How much to simplify (4 = medium blocks, 8 = large blocks)
    const factor = 4;

    await sharp(inputPath)
      // 1. Shrink to merge messy satellite pixels into single tones
      .resize(Math.floor(metadata.width / factor), null, { kernel: "lanczos3" })

      // 2. Boost vibrance for the "cute" look
      .modulate({ saturation: 4.0, brightness: 0.4 })

      // 3. SCALE BACK UP with 'nearest' to keep edges razor sharp
      .resize(metadata.width, metadata.height, { kernel: "nearest" })

      // 4. COLOR REDUCTION: Force the image into a limited palette
      // 'colors: 8' ensures the image only has a few distinct shades.
      .png({
        palette: true,
        colors: 8,
        quality: 100,
      })
      .toFile(outputPath);

    console.log("Clean, Sharp, and Color-Reduced!");
  } catch (err) {
    console.error(err);
  }
}

async function processCleanOutlines(inputPath, outputPath) {
  try {
    const metadata = await sharp(inputPath).metadata();

    // 1. CREATE THE COLOR LAYER (The "Fill")
    const colorLayer = await sharp(inputPath)
      .median(5)
      .modulate({ saturation: 2.0, brightness: 1.2 })
      .resize(metadata.width, metadata.height)
      .toBuffer();

    // 2. CREATE THE OUTLINE LAYER (The "Stroke")
    const outlineLayer = await sharp(inputPath)
      .greyscale()
      .blur(2) // CRITICAL: Blur the photo so the edge detector ignores noise
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
      })
      // Increase this number if it's too black.
      // 40-80 usually captures only main building/road edges.
      .threshold(50)
      .negate() // Black lines on white background
      .linear(1, 0.5) // Optional: Lightens the black to a dark grey for a "softer" look
      .toBuffer();

    // 3. COMBINE
    await sharp(colorLayer)
      .composite([
        {
          input: outlineLayer,
          blend: "multiply",
        },
      ])
      .png()
      .toFile(outputPath);

    console.log("Success: Clean tile with sharp outlines!");
  } catch (err) {
    console.error(err);
  }
}

async function extractTilePalette(inputPath, jsonOutputPath) {
  try {
    // 2. Extract a full palette by shrinking and quantizing
    // We shrink to 64x64 to 'average out' noise like cars/shadows
    const metadata = await sharp(inputPath)
      .resize(64, 64)
      .median(3)
      .png({ palette: true, colors: 8, dither: 0 })
      .metadata();

    console.log(`Success! Saved palette to ${jsonOutputPath}`);
  } catch (err) {
    console.error("Error extracting colors:", err);
  }
}

// Helper to convert RGB to Hex for your Three.js uniforms
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

extractTilePalette("tile_yunnan.jpg", "palette.json");

// processCleanIllustration(
//   "./data-gtiles/googletile.jpeg",
//   "./data-gtiles/googletile.cute_3d_tile.4.png"
// );
