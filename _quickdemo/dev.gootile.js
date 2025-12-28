import https from "node:https";
import fs from "node:fs";
import sharp from "sharp";

export const route = /^\/gtile/;

export const handler = (req, res) => {
  // /z/x/y
  const pathname = req.url.slice(6);

  const [, z, x, y, styled] = pathname.split("/");

  const dirpath = `./data-gtiles/${z}/${x}`;
  const originalFilepath = `./data-gtiles/${z}/${x}/${y}.jpeg`;
  const styledFilepath = `./data-gtiles/${z}/${x}/${y}.styled.png`;

  // if (fs.existsSync(originalFilepath)) {
  //   fs.createReadStream(originalFilepath).pipe(res);
  //   return;
  // }

  if (fs.existsSync(originalFilepath)) {
    simplifyImage(originalFilepath, styledFilepath).then(
      (after) => {
        fs.createReadStream(styledFilepath).pipe(res);
      },
      (err) => {
        console.log(err);
        fs.createReadStream(originalFilepath).pipe(res);
      }
    );
    return;
  }

  if (!fs.existsSync(dirpath)) {
    fs.mkdirSync(dirpath, { recursive: true });
  }

  // download origin file
  https
    .request(
      {
        host: "mt1.google.com",
        protocol: "https:",
        path: `/vt/lyrs=s&x=${x}&y=${y}&z=${z}&scale=4&hl=en`,
        headers: {
          origin: "https://google.com",
          referer: "https://google.com",
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        },
      },
      (incomming) => {
        const originalFile = fs.createWriteStream(originalFilepath);
        console.log(
          "[google tile] downloading, is to be saved to: ",
          originalFilepath
        );
        // const styled = fs.createWriteStream(styledFilepath);

        incomming
          .pipe(originalFile)
          .on("error", logErr)
          .on("finish", () => {
            simplifyImage(originalFilepath, styledFilepath);
            fs.createReadStream(originalFilepath).pipe(res);
            console.log("[google tile] finish downloaded", originalFilepath);
          });
      }
    )
    .on("error", logErr)
    .end();
};

const logErr = (err_) => {
  console.log(err_);
};

async function simplifyImage(inputPath, outputPath) {
  const input = sharp(inputPath);

  const { width, height } = await input.metadata();

  // 1. Create a "Building Mask"
  // Buildings in satellite tiles are usually high-luminance (bright)
  // or neutral grey. We isolate these areas.
  const buildingMask0 = await input.clone().greyscale().threshold(100); // Adjust this: higher captures only white roofs, lower captures more grey
  // .png({})
  // .toFile(outputPath);
  // .toBuffer();

  const buildingMask1 = await input
    .clone()
    .greyscale()
    .threshold(200) // Adjust this: higher captures only white roofs, lower captures more grey
    .toBuffer();

  const buildingMask = await buildingMask0
    .composite([
      {
        input: buildingMask1,
        blend: "add",
      },
    ])
    .toBuffer();

  // 2. Create a "Ground" color layer
  // We create a solid tile of a "close color" (e.g., forest green or dirt brown)
  const replacementColor = "#B4A578"; // { r: 70, g: 90, b: 60 }; // Dark olive/grass green
  const groundBase = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: replacementColor,
    },
  })
    .joinChannel(buildingMask)
    .png()
    .toBuffer();

  // 3. Composite: Only show the "Ground" where the "Building Mask" is active
  await input
    .composite([
      {
        input: groundBase,
        blend: "over",
      },
    ])
    .modulate({
      brightness: 1.2, // Increase brightness by 20%
      saturation: 1.5,
    })
    .toFile(outputPath);

  console.log("[simplifyImage] yes!", outputPath);
}
