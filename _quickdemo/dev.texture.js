import fs from "node:fs";

export const route = /^\/texture/;

export const handler = (req, res) => {
  const filepath = "." + req.url.slice(8);
  console.log("want to access file: " + filepath);
  if (fs.existsSync(filepath)) {
    console.log("file found:" + filepath);
    fs.createReadStream(filepath).pipe(res);
  } else {
    console.log("file 404:" + filepath);
    res.write("404", "utf8");
    res.end();
  }
};
