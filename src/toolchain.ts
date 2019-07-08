import path from "path";
import execa from "execa";
import shelljs from "shelljs";

import { MpkgConfiguration } from "./config";

/* working with m-language/m-language source */

export const invokeGradleW = (gradlew: string, opts: string) =>
  shelljs.exec(`${gradlew} ${opts}`);

export const invokeMCompiler = async (
  bin: string,
  jvmJar: string,
  mpm: string,
  args: string
) =>
  await execa.shell(
    `java -classpath ${bin}${path.delimiter}${jvmJar} -Xss1g m ${args}`,
    {
      stdio: "inherit",
      env: {
        MPM_ROOT: mpm
      }
    }
  );

export const invokeJVMCompiler = async (
  jvmLoc: string,
  mpmRoot: string,
  inFile: string,
  outFile: string
) =>
  await execa.shell(
    `java -jar build/libs/m-jvm-0.1.0.jar ${inFile} ${outFile}`,
    {
      cwd: jvmLoc,
      env: {
        MPM_ROOT: mpmRoot
      }
    }
  );

/* mpkg-related functions */

export const invokeMJvm = async (
  config: MpkgConfiguration,
  inFile: string,
  outFile: string
) =>
  invokeJVMCompiler(
    path.join(config.backendsDir, "m-jvm"),
    config.mpmDir,
    inFile,
    outFile
  );

export const invokeM = (config: MpkgConfiguration, args: string) =>
  invokeMCompiler(
    path.join(config.compilerDir, "bin"),
    path.join(config.backendsDir, "m-jvm/build/libs/m-jvm-0.1.0.jar"),
    config.mpmDir,
    args
  );

export const mpmPut = (config: MpkgConfiguration, dir: string) =>
  invokeM(config, `mpm-put ${dir}`);

export const mpmPutPackage = (
  config: MpkgConfiguration,
  packageName: string,
  srcDir: string = "src"
) => mpmPut(config, path.join(config.pkgDir, packageName, srcDir));

/* XXX This is a fallback function and needs to be removed */
export const compileMSource = (config: MpkgConfiguration, backend: string) => {
  switch (backend) {
    case "jvm":
      return execa.shellSync("kotlinc -script m.kts build", {
        cwd: config.compilerDir,
        stdio: "inherit",
        env: {
          MPM_ROOT: "./.mpm/"
        }
      });
    default:
      throw new Error(
        `backend ${backend} is not supported for compiler bootstrapping`
      );
  }
};
