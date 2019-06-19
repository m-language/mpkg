import {existsSync} from "fs";
import url from "url";
import execa from "execa";
import path from "path";
import targz from "decompress-targz";
import { Stream } from "stream";

export const timeDuration = fn => {
    let start = Date.now()
    fn();
    return Date.now() - start;
};

export const timeDurationAsync = async (fn: () => Promise<void>) => {
    let start = Date.now()
    await fn();
    return Date.now() - start;
};

export const pathsExist = (paths: string[]) => paths.every(existsSync);

export const repoName = repoURL => {
    let parsedURL = url.parse(repoURL);
    let urlPath = parsedURL.pathname;
    return urlPath === undefined ? undefined : path.basename(urlPath, ".git");
};

export const updateGitRepo = repoDir => {
    execa.shellSync("git reset --hard HEAD", { cwd: repoDir });
    execa.shellSync("git pull", { cwd: repoDir });
};

export const decompressTargz = (input: Buffer | Stream): Buffer | Stream => 
    targz(input);

