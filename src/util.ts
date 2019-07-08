import { existsSync } from "fs";
import url from "url";
import execa from "execa";
import path from "path";
import targz from "decompress-targz";
import { Stream } from "stream";

import { revision } from "./config";

export const timeDuration = (fn: () => void) => {
  let start = Date.now();
  fn();
  return Date.now() - start;
};

export const timeDurationAsync = async (fn: () => Promise<void>) => {
  let start = Date.now();
  await fn();
  return Date.now() - start;
};

export const pathsExist = (paths: string[]) => paths.every(existsSync);

export const repoName = repoURL => {
  let parsedURL = url.parse(repoURL);
  let urlPath = parsedURL.pathname;
  return urlPath === undefined ? undefined : path.basename(urlPath, ".git");
};

// TODO invoke git library
export const updateGitRepo = repoDir => {
  execa.shellSync("git reset --hard HEAD", { cwd: repoDir });
  execa.shellSync("git pull", { cwd: repoDir });
};

export const cloneGitRepo = (
  repo: string,
  repoDir: string,
  revision: revision = "latest"
) => {
  execa.shellSync(`git clone -n ${repo} ${repoDir}`);
  execa.shellSync(`git checkout ${revision === "latest" ? "" : revision}`, {
    cwd: repoDir
  });
};

export const decompressTargz = <T extends Buffer | Stream>(input: T): T =>
  targz(input);
