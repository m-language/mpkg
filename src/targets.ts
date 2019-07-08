import * as toolchain from "./toolchain";
import { MpkgConfiguration } from "./config";

import {
  timeDurationAsync,
  updateGitRepo,
  repoName,
  pathsExist,
  cloneGitRepo
} from "./util";
import { revision } from "./config";

import fs, { rmdir, rmdirSync, mkdirSync, existsSync } from "fs";
import path from "path";

import chalk from "chalk";
import execa from "execa";
import rimraf from "rimraf";

export type Logger = (...info: any[]) => void;
export type TargetAction = (logger: Logger) => TargetResult;
export type TargetResult = void | Promise<void>;

export interface BuildTargetInterface {
  name: string;
  requiredTargets: BuildTarget[];
  satisfied(): boolean;
  target(logger: Logger): TargetResult;
}

export abstract class BuildTarget implements BuildTargetInterface {
  abstract name: string;
  abstract requiredTargets: BuildTarget[];
  abstract satisfied(): boolean;
  abstract target(logger: Logger): void;

  static create(
    name: string,
    requiredTasks: BuildTarget[],
    satisfied: () => boolean,
    target: TargetAction
  ): BuildTargetInterface {
    return {
      name: name,
      requiredTargets: requiredTasks,
      satisfied: satisfied,
      target: target
    };
  }
}

export const targetLogger = (name: string) => (logger: Logger) => (
  ...info: any[]
) => logger(`${chalk.blue(`[${name}]`)} `, ...info);

export const invokeTarget = async (target: BuildTarget, logger: Logger) => {
  if (target.satisfied()) return;
  for (let depTarget of target.requiredTargets) {
    await invokeTarget(depTarget, logger);
  }
  return await target.target(logger);
};

export const virtualTarget = (name: string, targets: BuildTarget[]) =>
  BuildTarget.create(
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
  revision: revision;
  requiredTargets = [];

  constructor(url: string, into: string, revision: revision, update = true) {
    super();
    const repo = repoName(url);
    if (repo === undefined) {
      throw new Error(`Unable to parse ${url} as repository`);
    }
    this.repoName = repo;
    this.name = `git-${repo}`;
    this.into = into;
    this.update = update;
    this.url = url;
    this.revision = revision;
  }

  satisfied(): boolean {
    return pathsExist([path.join(this.into, ".git")]);
  }

  async target(logger: Logger) {
    if (fs.existsSync(path.join(this.into, ".git/"))) {
      logger(`${chalk.yellow(this.into)} already exists`);
      if (this.update) {
        logger(`updating repository ${chalk.yellow(this.repoName)}`);
        updateGitRepo(this.into);
      }
    } else {
      logger(
        `cloning ${chalk.yellow(this.repoName)} into ${chalk.yellow(this.into)}`
      );
      cloneGitRepo(this.url, this.into, this.revision);
    }
  }
}

export const installMTarget = (config: MpkgConfiguration, backend: string) =>
  BuildTarget.create(
    "install-compiler",
    [
      new GitRepoTarget(
        "https://github.com/m-language/m-language",
        path.join(config.compilerDir),
        config.cliConfig.compilerVersion
      ),
      new GitRepoTarget(
        `https://github.com/m-language/m-${backend}`,
        path.join(config.backendsDir, `m-${backend}`),
        config.cliConfig.backends[backend].version
      )
    ],
    () =>
      pathsExist([
        config.compilerDir,
        path.join(config.backendsDir, `m-${backend}`)
      ]),
    _ => {
      toolchain.compileMSource(config, backend);
    }
  );

export const initTarget = (config: MpkgConfiguration, backend: string) =>
  virtualTarget("init", [installMTarget(config, backend)]);

export const buildTarget = (
  config: MpkgConfiguration,
  backend: string,
  input: string,
  output: string
) =>
  BuildTarget.create(
    "build",
    [installMTarget(config, backend)],
    () => false,
    async logger => {
      logger(`building mpm from packages`);
      if(existsSync(config.mpmDir)){
        rimraf.sync(config.mpmDir);
      }
      mkdirSync(config.mpmDir);

      logger("adding", chalk.yellow("standard library"));
      await toolchain.mpmPut(config, path.join(config.compilerDir, "std"));

      await Promise.all(
        (config.cliConfig.packages || []).map(el => toolchain.mpmPutPackage(config, el))
      ).catch(_ => logger(`building mpm ${chalk.red("failed")}`));
      logger(
        `compiling ${chalk.yellow(input)} to ${chalk.yellow(
          output
        )} with backend ${chalk.magenta(backend)}`
      );
      await timeDurationAsync(async () => {
        await toolchain.invokeM(
          config,
          `compile ${backend} ${input} ${output}`
        );
      })
        .then(buildTime =>
          logger(
            `build ${chalk.green("successful")} in ${chalk.blue(
              buildTime / 1000 + "s"
            )}`
          )
        )
        .catch(_ => logger(`build ${chalk.red("failed")}`));
    }
  );

export const execTarget = (
  config: MpkgConfiguration,
  outDir: string,
  args: string[],
  backend: string
) =>
  BuildTarget.create(
    "exec",
    [],
    () => false,
    async _ => {
      switch (backend) {
        case "jvm":
          await execa.shell(
            `java -cp ${path.join(
              config.backendsDir,
              `m-${backend}`,
              "/build/libs/m-jvm-0.1.0.jar"
            )}${path.delimiter}${outDir} main ${args.join(
              " "
            )}`,
            {
              stdio: "inherit"
            }
          );
          return;
        default:
          throw new Error(`invalid backend ${chalk.magenta(backend)}`);
      }
    }
  );
