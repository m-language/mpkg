import * as toolchain from "./toolchain";
import {
    MpkgConfiguration,
    realBackendsDir,
    realCompilerDir
} from "./toolchain";

import {
    timeDurationAsync,
    updateGitRepo,
    repoName,
    pathsExist,
    decompressTargz
} from "./util";

import fs from "fs";
import path from 'path';

import chalk from "chalk";
import execa from "execa";
import request = require("request");
import { Stream } from "stream";

export type Logger = (...info: any[]) => void;
export type TargetAction = (logger: Logger) => void;
export type TargetResult = void | Promise<void>;

export interface BuildTargetInterface {
    name: string
    requiredTargets: BuildTarget[]
    satisfied(): boolean
    target(logger: Logger): TargetResult;
};

export abstract class BuildTarget implements BuildTargetInterface {
    abstract name: string;
    abstract requiredTargets: BuildTarget[];
    abstract satisfied(): boolean;
    abstract target(logger: Logger): void;

    static create(name: string, requiredTasks: BuildTarget[], satisfied: () => boolean, target: TargetAction): BuildTargetInterface {
        return {
            name: name,
            requiredTargets: requiredTasks,
            satisfied: satisfied,
            target: target
        };
    }
}

export const targetLogger = (name: string) => (logger: Logger) => (...info: any[]) => logger(`${chalk.blue(`[${name}]`)} `, ...info);

export const invokeTarget = async (target: BuildTarget, logger: Logger) => {
    if(target.satisfied()) return;
    for(let depTarget of target.requiredTargets){
        await invokeTarget(depTarget, logger);
    }
    return await target.target(logger); 
};

export const virtualTarget = (name: string, targets: BuildTarget[]) => BuildTarget.create(
    name,
    targets,
    () => targets.every(target => target.satisfied()),
    _ => {}
);

export class GitRepoTarget extends BuildTarget {
    name: string;
    into: string;
    url: string;
    update: boolean;
    repoName: string;
    requiredTargets = [];
    
    constructor(url: string, into: string, update=true){
        super();
        const repo = repoName(url);
        if(repo === undefined){
            throw new Error(`Unable to parse ${url} as repository`);
        }
        this.repoName = repo;
        this.name = `git-${repo}`;
        this.into = into;
        this.update = update;
        this.url = url;
    }

    satisfied(): boolean {
        return pathsExist([path.join(this.into, ".git")]);
    }

    async target(logger: Logger) {
        if(fs.existsSync(path.join(this.into, ".git/"))){
            logger(`${chalk.yellow(this.into)} already exists`)
            if(this.update){
                logger(`updating repository ${chalk.yellow(this.repoName)}`);
                updateGitRepo(this.into);
            }
        }else{
            logger(`cloning ${chalk.yellow(this.repoName)} into ${chalk.yellow(this.into)}`)
            await execa.shell(`git clone ${this.url} ${this.into}`)
        }    
    }
}

/*
export const githubRepoDownloadTarget = (repoUrl: string, branch: string, into: string) => BuildTarget.create(
    "github",
    [],
    () => false,
    logger => {
        logger(`downloading ${repoName(repoUrl)}`);
        let tarballStream = request(path.join(repoUrl, branch, "tarball"));
        let decompress = decompressTargz(tarballStream);
        if(decompress instanceof Stream) {
            let fileStream = decompress.pipe(fs.createWriteStream(into));
            let resultPromise = new Promise((resolve, reject) => {
                fileStream.on("end", () => resolve(fileStream));
                fileStream.on("error", reject);
            });
            return resultPromise;
        } else {
            return Promise.reject("The input was incorrect");
        }
    }
);
*/

export const installMTarget = (config: MpkgConfiguration, backend: string) => BuildTarget.create(
    "install-compiler",
    [
        new GitRepoTarget("https://github.com/m-language/m-language", path.join(realCompilerDir(config))),
        new GitRepoTarget(`https://github.com/m-language/m-${backend}`, path.join(realBackendsDir(config), `m-${backend}`))
    ],
    () => pathsExist([
        realCompilerDir(config),
        path.join(realBackendsDir(config), `m-${backend}`)
    ]),
    _ => toolchain.compileMSource(config, backend)
);

export const packageInstallTarget = (config: MpkgConfiguration, backend: string, packageName: string, srcDir: string) => BuildTarget.create(
    "pkg-install",
    [installMTarget(config, backend)],
    () => false,
    async logger => { 
        logger(`installing package ${chalk.magenta(packageName)}`)
        await toolchain.installMPackage(config, packageName, srcDir);
    }
);

export const initTarget = (config: MpkgConfiguration, backend: string) =>
    virtualTarget(
        "init",
        [
            installMTarget(config, backend),
            packageInstallTarget(config, backend, "m-std", ".")
        ]
    );

export const buildTarget = (config: MpkgConfiguration, backend: string, input: string, output: string) => BuildTarget.create(
    "build",
    [installMTarget(config, backend)],
    () => false,
    async logger => {
        logger(`compiling ${chalk.yellow(input)} to ${chalk.yellow(output)} with backend ${chalk.red(backend)}`);
        let buildTime = await timeDurationAsync(async () => {
            await toolchain.invokeM(config, `compile ${backend} ${input} ${output}`);
        });
        logger(`build successful in ${chalk.green((buildTime / 1000) + 's')}`);
    }
);