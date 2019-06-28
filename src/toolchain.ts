
import path from "path";
import execa from "execa";
import shelljs from "shelljs";

export interface MpkgConfiguration {
    mpkgRoot: string;
    compilerDir: string;
    mpmDir: string;
    pkgDir: string;
    backendsDir: string;
}

export const realCompilerDir = (config: MpkgConfiguration) =>
    path.join(config.mpkgRoot, config.compilerDir);

export const realMpmDir = (config: MpkgConfiguration) =>
    path.join(config.mpkgRoot, config.mpmDir);

export const realBackendsDir = (config: MpkgConfiguration) =>
    path.join(config.mpkgRoot, config.backendsDir);

export const realPkgDir = (config: MpkgConfiguration) =>
    path.join(config.mpkgRoot, config.pkgDir);

export const defaultMpkgConfiguration: MpkgConfiguration = ({
    mpkgRoot: ".mpkg",
    compilerDir: "compiler",
    mpmDir: "mpm",
    pkgDir: "pkg",
    backendsDir: "."
});

const npmInstall = (packageName: string, flags: string) => execa.shell(`npm install ${packageName} ${flags}`);

/* working with m-language/m-language source */

export const invokeGradleW = (gradlew: string, opts: string) => shelljs.exec(`${gradlew} ${opts}`);

export const bootstrapCompiler = async (config: MpkgConfiguration) => {
    // TODO bootstrap compiler 
};

export const invokeMCompiler = async (bin: string, jvmJar: string, mpm: string, args: string) =>
    await execa.shell(
        `java -classpath ${bin}${path.delimiter}${jvmJar} -Xss1g m ${args}`,
        {
            stdio: "inherit",
            env: {
                "MPM_ROOT": mpm
            }
        }
    );

export const invokeJVMCompiler = async (jvmLoc: string, mpmRoot: string, inFile: string, outFile: string) =>
    await execa.shell(
        `java -jar build/libs/m-jvm-0.1.0.jar ${inFile} ${outFile}`,
        {
            cwd: jvmLoc,
            env: {
                "MPM_ROOT": mpmRoot
            }
        }
    );

/* mpkg-related functions */

export const invokeMJvm = async (config: MpkgConfiguration, inFile: string, outFile: string) =>
    invokeJVMCompiler(
        path.join(realBackendsDir(config), "m-jvm"),
        realMpmDir(config),
        inFile,
        outFile
    );

export const invokeM = (config: MpkgConfiguration, args: string) =>
    invokeMCompiler(
        path.join(realCompilerDir(config), "bin"),
        path.join(realBackendsDir(config), "m-jvm/build/libs/m-jvm-0.1.0.jar"),
        realMpmDir(config),
        args
    );

const mpmPutPackage = (config: MpkgConfiguration, packageName: string, srcDir: string = "src") =>
    invokeM(config, `mpm-put ${path.join(realPkgDir(config), "node_modules", packageName, srcDir)}`);

/* TODO remove npmInstall */
export const installMPackage = async (config: MpkgConfiguration, packageName: string, srcDir: string = "src") => {
    await npmInstall(packageName ,`--prefix ${realPkgDir(config)} --save`)
    await mpmPutPackage(config, packageName, srcDir);
};

/* XXX This is a fallback function and needs to be removed */
export const compileMSource = (config: MpkgConfiguration, backend: string) => {
    switch(backend){
        case "jvm":         
            return execa.shellSync("kotlinc -script m.kts build", {
                cwd: realCompilerDir(config),
                stdio: "ignore",
                env: {
                    "MPM_ROOT": "./.mpm/"
                }
            });
        default:
            throw new Error(`backend ${backend} is not supported for compiler bootstrapping`);
    }

};
