import https from "node:https";
import fs from "node:fs";
import sharp from "sharp";

export const route = /^\/gtile/;

export const handler = (req, res) => {
  // /z/x/y
  const pathname = req.url.slice(6);

  const [, z, x, y] = pathname.split("/");

  const dirpath = `./data-gtiles/${z}/${x}`;
  const filepath = `./data-gtiles/${z}/${x}/${y}.jpeg`;
  const styledFilepath = `./data-gtiles/${z}/${x}/${y}.styled.jpeg`;

  if (fs.existsSync(styledFilepath)) {
    fs.createReadStream(styledFilepath).pipe(res);
    return;
  }

  if (!fs.existsSync(dirpath)) {
    fs.mkdirSync(dirpath, { recursive: true });
  }

  if (fs.existsSync(filepath)) {
    processTile(filepath);
    return;
  }

  // download origin file
  const gurl = `https://mt1.google.com/vt/lyrs=s&x=${x}&y=${y}&z=${z}&scale=4&hl=en`;
  https
    .get(gurl, (incomming) => {
      console.log("download google tile, is to be saved to: ", filepath);
      const styled = fs.createWriteStream(styledFilepath);
      incomming
        .pipe(styled)
        .on("error", logErr)
        .on("finish", () => {
          processTile(filepath);
          console.log("finish tile downloaded");
        });
    })
    .on("error", logErr)
    .end();
};

const logErr = (err_) => {
  console.log(err_);
};

const processTile = (originFile) => {};
