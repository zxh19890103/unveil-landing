import fs from "node:fs";

export const route = /^\/texture/;

export const handler = (req, res) => {
  const filepath = req.url.slice(8);
  fs.createReadStream("." + filepath).pipe(res);
};
