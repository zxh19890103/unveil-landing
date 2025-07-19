// generate-assets.ts
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseDir = path.join(__dirname, "../");

// CONFIGURABLE:
const INPUT_DIR = path.join(baseDir, "./quickdemo"); // Change as needed
const OUTPUT_FILE = path.join(__dirname, "./_shared/assets-map.ts"); // Output TS file

const SUPPORTED_EXT = [
  ".txt",
  ".json",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".glb",
];

async function traverse(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await traverse(fullPath, baseDir)));
    } else if (SUPPORTED_EXT.includes(path.extname(entry.name).toLowerCase())) {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
      const key = relativePath.replace(/\W+/g, "_").replace(/^_+|_+$/g, "");
      files.push({ key, relativePath });
    }
  }

  return files;
}

function generateExportCode(files) {
  const lines = [
    "// Auto-generated. Do not edit manually.",
    "export const quickdemoAssets = {",
    ...files.map(
      (f) =>
        `  ${JSON.stringify(f.key)}: ${JSON.stringify("/" + f.relativePath)},`
    ),
    "} as const;",
  ];
  return lines.join("\n");
}

async function main() {
  const files = await traverse(INPUT_DIR);
  const code = generateExportCode(files);
  await fs.writeFile(OUTPUT_FILE, code, "utf-8");
  console.log(`Generated: ${OUTPUT_FILE} with ${files.length} entries.`);
}

main().catch(console.error);
