
const toolchain = require('./toolchain');
const util = require("./util");

const url = require("url");
const fs = require("fs");
const path = require('path');
const chalk = require('chalk');
const execa = require('execa');

const logForTarget = (name, str) =>  console.log(`${chalk.blue(`[${name}]`)} ${str}`);

const pathsExist = paths => paths.every(fs.existsSync);

const repoName = repoURL => {
    let parsedURL = url.parse(repoURL);
    let urlPath = parsedURL.pathname;
    return path.basename(urlPath, ".git");
};

const updateGitRepo = repoDir => {
    execa.shellSync("git reset --hard HEAD", { cwd: repoDir });
    execa.shellSync("git pull", { cwd: repoDir });
};

const gitRepoTarget = (url, into, update=true) => {
    const repo = repoName(url);
    const targetName = `git-${repo}`;
    return {
        name: targetName,
        requiredTasks: [],
        satisfied: () => fs.existsSync(path.join(into, ".git")),
        target: () => {
            if(fs.existsSync(path.join(into, ".git/"))){
                logForTarget(targetName, `${chalk.yellow(into)} already exists`)
                if(update){
                    logForTarget(targetName, `updating repository ${chalk.yellow(repo)}`);
                    updateGitRepo(into);
                }
            }else{
                logForTarget(targetName, `cloning ${chalk.yellow(repo)} into ${chalk.yellow(into)}`)
                execa.shellSync(`git clone ${url} ${into}`)
            }
        }
    };
};

const installMTarget = mRoot => ({
    name: "install-compiler",
    requiredTasks: [
        gitRepoTarget("https://github.com/m-language/m-language", path.join(mRoot, "compiler")),
        gitRepoTarget("https://github.com/m-language/m-jvm", path.join(mRoot, "m-jvm"))
    ],
    satisfied: () => pathsExist([
        path.join(mRoot, "compiler"),
        path.join(mRoot, "m-jvm")
    ]),
    target: () => toolchain.compileM(mRoot)
});

const invokeTarget = target => {
    if(target.satisfied()) return;
    target.requiredTasks.forEach(depTarget => {
        invokeTarget(depTarget);
    });
    return target.target(); 
};

const packageInstallTarget = (mRoot, package, srcDir="src") => ({
    name: "pkg-install",
    requiredTasks: [installMTarget(mRoot)],
    satisfied: () => false,
    target: () => { 
        logForTarget("pkg-install", `installing package ${chalk.magenta(package)}`)
        toolchain.installMPackage(mRoot, package, srcDir);
    }
});

const initTarget = mRoot => ({
    name: "init",
    requiredTasks: [installMTarget(mRoot), packageInstallTarget(mRoot, "m-std", ".")],
    satisfied: () => false,
    target: () => {}
});

module.exports = {
    installMTarget: installMTarget,
    invokeTarget: invokeTarget,
    gitRepoTarget: gitRepoTarget,
    packageInstallTarget: packageInstallTarget,
    initTarget: initTarget,
    buildTarget: (mRoot, backend, input, output) => ({
        name: "build",
        requiredTasks: [installMTarget(mRoot)],
        satisfied: () => false,
        target: () => {
            logForTarget("build", `compiling ${chalk.yellow(input)} to ${chalk.yellow(output)} with backend ${chalk.red(backend)}`);
            let buildTime = util.timeDuration(() => toolchain.invokeM(mRoot, path.join(mRoot, "mpm"), `compile ${backend} ${input} ${output}`));
            logForTarget("build", `build successful in ${chalk.green((buildTime / 1000) + 's')}`);
        }
    }),

}