
const process = require('process');
const path = require('path');
const os = require('os');
const fs = require('fs');
// External libs
const execa = require('execa');

const npmInstall = (packageName, flags) => execa.shellSync(`npm install ${packageName} ${flags}`);

/* misc utilities */

const compileMSource = mRoot => {
    execa.shellSync("kotlinc -script m.kts build", {
        cwd: path.join(mRoot, "compiler"),
        stdio: "ignore",
        env: {
            "MPM_ROOT": "./.mpm/"
        }
    });
};

const invokeM = (mRoot, mpmRoot, args) => {
    execa.shellSync(
        `java -classpath ${path.join(mRoot, "compiler/bin")}${path.delimiter}${path.join(mRoot, "m-jvm/build/libs/m-jvm-0.1.0.jar")} -Xss1g m ${args}`,
        {
            stdio: "inherit",
            env: {
                "MPM_ROOT": mpmRoot
            }
        }
    );
};

const mpmPutPackage = (mRoot, packageName, srcDir="src") =>
    invokeM(mRoot, path.join(mRoot, "mpm"), `mpm-put ${path.join(mRoot, "pkgs", "node_modules", packageName, srcDir)}`);

const installMPackage = (mRoot, packageName, srcDir="src") => {
    npmInstall(packageName ,`--prefix ${path.join(mRoot, "pkgs")} --save`);
    mpmPutPackage(mRoot, packageName, srcDir);
};

module.exports = {
    compileM: compileMSource,
    invokeM: invokeM,
    installMPackage: installMPackage
};