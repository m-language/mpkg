#!/usr/bin/env node

import { buildTarget, initTarget, invokeTarget, execTarget } from "./targets";

import meow from "meow";
import * as config from "./config";
import path from "path";
import { existsSync, mkdirSync, fstat } from "fs";
import shelljs, { exit } from "shelljs";
import fs from "fs";

const cli = meow({
  flags: {
    backend: {
      type: "string"
    },
    packagePrefix: {
      type: "string"
    },
    outDir: {
      type: "string"
    }
  }
});

const defaultLogger = console.log;

let mpkg = () =>
  config
    .parseMpkgJson("mpkg.json")
    .catch(ifNoMpkg)
    .then(parseOptions);

function ifNoMpkg() {
  if (!existsSync("mpkg.json")) {
    console.error("No mpkg.json in project, aborting");
    exit(1);
  }
}

let command = cli.input[0];
if (command) {
  switch (command) {
    case "build":
      mpkg().then(mpkg =>
        invokeTarget(
          buildTarget(
            mpkg,
            mpkg.cliConfig.options.backend,
            "src",
            path.join(
              mpkg.cliConfig.options.outDir,
              mpkg.cliConfig.options.backend
            )
          ),
          defaultLogger
        )
      );
      break;
    case "init":
      let projName = cli.input[1];
      let targetDir = ".";
      if (projName) {
        if (existsSync(projName)) {
          throw new Error(`directory ${projName} already exists`);
        } else {
          mkdirSync(projName);
        }
        targetDir = projName;
      }
      shelljs.cd(targetDir);
      fs.writeFileSync(
        "mpkg.json",
        JSON.stringify(config.defaultMpkgConfiguration.cliConfig, null, 2)
      );
      mpkg().then(mpkg =>
        invokeTarget(
          initTarget(mpkg, mpkg.cliConfig.options.backend),
          defaultLogger
        ).finally(() => {
          shelljs.cd("..");
        })
      );

      break;
    case "exec":
      mpkg().then(mpkg =>
        invokeTarget(
          execTarget(
            mpkg,
            path.join(
              mpkg.cliConfig.options.outDir,
              mpkg.cliConfig.options.backend
            ),
            cli.input.slice(1),
            mpkg.cliConfig.options.backend
          ),
          defaultLogger
        )
      );

      break;
    default:
      throw new Error(`Unknown command ${command}`);
  }
} else {
  throw new Error(`No command provided`);
}

export function parseOptions(json: any): config.MpkgConfiguration {
  let finalOptions = Object.assign(
    {},
    config.defaults,
    json.options || {},
    cli.flags
  );
  let finalConfig = { ...json, options: finalOptions };
  return {
    // TODO this is incorrect for backendsDir
    backendsDir: ".mpkg",
    compilerDir: ".mpkg/compiler",
    mpmDir: ".mpkg/mpm",
    pkgDir: finalConfig.options.packagePrefix as string,
    cliConfig: finalConfig
  };
}
