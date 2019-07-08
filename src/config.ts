import fs from "fs";
import { promisify } from "util";

export type commit = string;
export type revision = commit | "latest";

export interface Configuration {
  compilerVersion: revision;
  options: Options;
  backends: BackendConfig;
  packages: string[];
}

export interface Options {
  packagePrefix: string;
  outDir: string;
  backend: string;
}

export type BackendConfig = { [backend: string]: { version: revision } };

export async function parseMpkgJson(file: string): Promise<Configuration> {
  return promisify(fs.readFile)(file)
    .then(buff => JSON.parse(buff.toString()))
    .then(json => {
      // None of these type assertions do anything except appease the
      // compiler; im too lazy to check for each and every property
      let options = json.options as Options;
      let backends = json.backends as BackendConfig;
      let compilerVersion = json.compilerVersion as revision;
      let packages = json.packages as string[];
      return {
        compilerVersion,
        options,
        backends,
        packages
      };
    });
}

export const defaults: Options = {
  packagePrefix: "node_modules",
  outDir: "build",
  backend: "jvm"
};

export interface MpkgConfiguration {
  compilerDir: string;
  mpmDir: string;
  pkgDir: string;
  backendsDir: string;
  cliConfig: Configuration;
}

export const defaultMpkgConfiguration: MpkgConfiguration = {
  compilerDir: "compiler",
  mpmDir: "mpm",
  pkgDir: "pkg",
  backendsDir: ".",
  cliConfig: {
    backends: {
      jvm: {
        version: "latest"
      }
    },
    compilerVersion: "latest",
    options: defaults,
    packages: []
  }
};
