import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import sharp from "sharp";
import { exec } from "node:child_process";

export const route = /^\/dem/;

/**
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse<http.IncomingMessage>} res
 */
export const handler = (req, res) => {
  const query = new URLSearchParams("?" + req.url.split("?")[1]);

  const bbox = query.get("bbox").split(",");
  console.log("bbox", bbox);

  const tX = query.get("x");
  const tY = query.get("y");
  const tZ = query.get("z");
  const regen = query.get("regen");

  console.log("xyz", tX, tY, tZ);

  const savetoPicture = `./datadem/${tZ}-${tX}-${tY}.png`;

  if (regen !== "true" && fs.existsSync(savetoPicture)) {
    // fs.createReadStream(savetoPicture).pipe(res);
    res.write("exits", "utf8");
    res.end();
    return;
  }

  const savetoGtiff = `./datadem/${tZ}-${tX}-${tY}.gtiff`;

  if (fs.existsSync(savetoGtiff)) {
    convertsion_gdal_translate(savetoGtiff, savetoPicture, () => {
      res.write("converted!", "utf8");
    });
    return;
  }

  const url = `https://portal.opentopography.org/API/globaldem?demtype=SRTMGL1&south=${bbox[0]}&north=${bbox[2]}&west=${bbox[1]}&east=${bbox[3]}&outputFormat=GTiff&API_Key=17f93d71fccb58e27e4cc8983c502fc3`;

  console.log("url", url);

  const client = https
    .get(
      url,
      {
        headers: {
          accept: "*/*",
        },
      },
      (incoming) => {
        console.log("[dem] incoming...");
        const file = fs.createWriteStream(savetoGtiff, "binary");

        incoming
          .pipe(file)
          .on("finish", async () => {
            console.log("saved as gtiff", savetoGtiff);

            convertsion_gdal_translate(savetoGtiff, savetoPicture, () => {
              res.write("done!", "utf8");
              res.end();
            });
          })
          .on("error", logErr);
      }
    )
    .on("error", logErr);

  client.end();
};

async function conversion(savetoGtiff, savetoPicture, callback) {
  const { channels } = await sharp(savetoGtiff).stats();

  const minElevation = channels[0].min;
  const maxElevation = channels[0].max;

  // 1179 3352
  const range = maxElevation - minElevation;
  const mulfiplier = 255 / range;
  const offset = -(minElevation * mulfiplier);

  console.log("minElevation, maxElevation", minElevation, maxElevation);

  sharp(savetoGtiff)
    .grayscale()
    .toColorspace("b-w")
    .linear(mulfiplier, offset)
    .normalise()
    .png({
      palette: false,
    })
    .toFile(savetoPicture, (err_, info) => {
      if (err_) logErr(err_);
      console.log("saved as picture", savetoPicture);
      callback?.(savetoPicture);
    })
    .on("error", logErr);
}

async function convertsion_gdal_translate(
  savetoGtiff,
  savetoPicture,
  callback
) {
  const execFile =
    "/Applications/QGIS-LTR.app/Contents/MacOS/bin/gdal_translate";

  const { channels } = await sharp(savetoGtiff).stats();

  const minElevation = channels[0].min;
  const maxElevation = channels[0].max;

  fs.writeFileSync(
    savetoGtiff + ".elevation.json",
    JSON.stringify({
      minElevation,
      maxElevation,
    }),
    "utf-8"
  );

  console.log("write elevation file.");

  console.log("minElevation, maxElevation", minElevation, maxElevation);

  // gdal_translate -ot Byte -of PNG -scale 0 10 0 255 /Users/xhzhang1911/WorkSpace/unveil-landing/_quickdemo/datadem/16-50746-28071.gtiff /var/abc.png

  exec(
    `"${execFile}" -ot Byte -of PNG -scale ${minElevation} ${maxElevation} 0 255 ${savetoGtiff} ${savetoPicture}`,
    (err, stdout, stderr) => {
      if (err) {
        logErr(err, "dal err");
        return;
      }

      if (stderr) {
        logErr(stderr, "dal stderr");
        return;
      }

      console.log(`GDAL stdout: ${stdout}`);
      console.log("Conversion finished!", savetoPicture);

      callback(savetoPicture);
    }
  );
}

const logErr = (err_, label) => {
  console.log(`>>>>>>>>>${label}`);
  console.log(err_);
  console.log(`<<<<<<<<${label}`);
};
