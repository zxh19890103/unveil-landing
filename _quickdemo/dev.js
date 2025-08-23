import http from "http";
import path from "path";
import ts from "typescript";
import fs from "node:fs";
import chokidar from "chokidar";
import { Transform } from "node:stream";
import config from "./_config.js";

const PORT = 3003;
const allowedOrigin = "*";

const IMPORTMAP = {
  imports: Object.keys(config.importmaps.imports),
};

const ROOT_DIR = path.resolve("./");
const TSCONFIG_PATH = path.resolve("./tsconfig.json");
const WATCHED_FOLDERS = config.projects;

// Load tsconfig.json compiler options
function loadTsConfig(tsconfigPath) {
  const configFileText = ts.sys.readFile(tsconfigPath);
  if (!configFileText) throw new Error(`Cannot read ${tsconfigPath}`);

  const result = ts.parseConfigFileTextToJson(tsconfigPath, configFileText);
  if (result.error) {
    throw new Error(`Error parsing tsconfig.json: ${result.error.messageText}`);
  }

  const configParseResult = ts.parseJsonConfigFileContent(
    result.config,
    ts.sys,
    path.dirname(tsconfigPath)
  );

  if (configParseResult.errors.length) {
    throw new Error(
      "Errors parsing tsconfig.json:\n" +
        configParseResult.errors.map((e) => e.messageText).join("\n")
    );
  }

  return configParseResult.options;
}

const compilerOptions = loadTsConfig(TSCONFIG_PATH);

// Custom TS transformer to rewrite import paths
function importRewriteTransformer(rewriteFn) {
  return (context) => {
    const visitor = (node) => {
      if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        const oldPath = node.moduleSpecifier.text;
        const newPath = rewriteFn(oldPath);
        if (newPath !== oldPath) {
          return ts.factory.updateImportDeclaration(
            node,
            // node.decorators,
            node.modifiers,
            node.importClause,
            ts.factory.createStringLiteral(newPath),
            node.assertClause
          );
        }
      }
      return ts.visitEachChild(node, visitor, context);
    };
    return (node) => ts.visitNode(node, visitor);
  };
}

// Compile TS file with transformer, return JS code string
async function compileTsFile(filePath, rewriteFn) {
  const program = ts.createProgram([filePath], compilerOptions);
  const sourceFile = program.getSourceFile(filePath);
  if (!sourceFile) throw new Error(`File not found: ${filePath}`);

  let outputText = "";
  let outputMap = "";

  // Custom writeFile to capture emitted files in memory
  const writeFile = (fileName, data) => {
    if (fileName.endsWith(".js")) {
      outputText = data;
    }

    if (fileName.endsWith(".js.map")) {
      outputMap = data;
    }
  };

  const transformers = {
    before: [importRewriteTransformer(rewriteFn)],
  };

  program.emit(sourceFile, writeFile, undefined, false, transformers);

  return [outputText, outputMap];
}

// cahce

function wrapStream({ prefix = "", suffix = "" }) {
  let ended = false;

  return new Transform({
    transform(chunk, encoding, callback) {
      if (!ended) {
        this.push(prefix); // write once at start
        ended = true;
      }
      this.push(chunk);
      callback();
    },
    flush(callback) {
      this.push(suffix); // write once at end
      callback();
    },
  });
}

const moduleCache = new Map();

// Watch TypeScript files in the 'src' folder
const watcher = chokidar.watch(
  WATCHED_FOLDERS.map((folder) => {
    return `./${folder}/**/*.{ts,tsx}`;
  }),
  {
    ignored: /node_modules/,
    persistent: true,
    ignoreInitial: true,
  }
);

const onSourceChanged = (_path) => {
  const filepath = path.join(ROOT_DIR, _path);
  if (moduleCache.has(filepath)) {
    moduleCache.delete(filepath);
  }

  notifySseReqClients("reload");
  console.log("source file changed", _path);
};

watcher
  // .on("add", () => {})
  .on("change", onSourceChanged)
  .on("unlink", onSourceChanged);

function getUnpackFile(folder, pkgname, exportDefault) {
  const folderpath = path.join(ROOT_DIR, folder);
  const modulepath = path.join(folderpath, "node_modules", pkgname);
  const pkgjsonpath = path.join(modulepath, `package.json`);
  const json = JSON.parse(fs.readFileSync(pkgjsonpath, { encoding: "utf8" }));
  const unpkgfile = path.join(modulepath, json.unpkg);
  return fs.createReadStream(unpkgfile, { encoding: "utf-8" });
}

const sseReqClients = new Set();

const notifySseReqClients = (type) => {
  sseReqClients.forEach((res) => {
    res.write(`event: ${type}\ndata: hello\n\n`);
  });
};

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.url === "/events-client") {
    res.setHeader("Content-Type", "application/javascript");
    res.end(
      `
      const end = "http://" + location.hostname + ":" + ${PORT} + "/events";
      const __evtSource__ = new EventSource(end);
      __evtSource__.addEventListener("reload", () => {
        window.location.reload();
      });
      `
    );
    return;
  }

  if (req.url === "/events") {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    sseReqClients.add(res);

    req.on("close", () => {
      res.end();
      sseReqClients.delete(res);
    });
    return;
  }

  try {
    if (/\$npm/.test(req.url)) {
      // $npm/three-geojson-geometry
      const [, folder, pkg] = /^\/(.+)\$npm\/(.+)$/.exec(req.url);
      const js = getUnpackFile(folder, pkg);
      res.setHeader("Content-Type", "application/javascript");
      js.pipe(
        wrapStream({
          prefix:
            "// hahah \nimport * as THREE from \"three\"; \n globalThis['THREE'] = THREE;\n",
          suffix: "\n \n export default globalThis['GeoJsonGeometry'];",
        })
      ).pipe(res);
    } else {
      if (!req.url.endsWith(".js")) {
        res.statusCode = 404;
        res.end("Only .js files are served");
        return;
      }

      // Resolve and sanitize path
      let filePath = path.join(ROOT_DIR, req.url);
      if (!filePath.startsWith(ROOT_DIR)) {
        res.statusCode = 403;
        res.end("Forbidden");
        return;
      }

      filePath = filePath.replace(/\.js$/, ".ts");
      if (!fs.existsSync(filePath)) {
        filePath = filePath.replace(/\.ts$/, ".tsx");
      }

      // console.log("ts file", filePath);
      if (moduleCache.has(filePath)) {
        res.setHeader("Content-Type", "application/javascript");
        res.end(moduleCache.get(filePath));
        return;
      }

      // Compile with import rewrite
      const [jsCode, _] = await compileTsFile(filePath, (importPath) => {
        const isLike3rdPartyPkg =
          !importPath.startsWith(".") &&
          !importPath.startsWith("/") &&
          !importPath.startsWith("@");

        if (isLike3rdPartyPkg) {
          if (
            IMPORTMAP.imports.some((name) => {
              if (name.endsWith("/")) {
                return importPath.startsWith(name);
              } else {
                return importPath === name;
              }
            })
          )
            return importPath;

          // Leave node_modules or absolute imports untouched
          return "./$npm/" + importPath;
        }

        // Add ".js" extension if missing
        if (!importPath.endsWith(".js")) {
          return importPath + ".js";
        }
        return importPath;
      });

      res.setHeader("Content-Type", "application/javascript");
      moduleCache.set(filePath, jsCode);
      res.end(jsCode);
    }
  } catch (e) {
    res.statusCode = 500;
    res.end("Internal Server Error:\n" + e.message);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`TS server running at http://localhost:${PORT}`);
});
