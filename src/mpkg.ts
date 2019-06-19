#!/usr/bin/env node

import {
    buildTarget,
    packageInstallTarget,
    initTarget,
    invokeTarget
} from "./targets";

import meow from "meow";
import { defaultMpkgConfiguration } from "./toolchain";

const usage = `
Usage: ${process.argv[1]} SUBCOMMMAND ARGUMENTS [OPTIONS]

SUBCOMMAND
    init                Download + Install compiler and standard library
    build               Build the project with the m compiler
    install PACKAGE     Install m package PACKAGE
`;

const cli = meow(usage, {
    flags: {
        backend: {
            type: "string",
            default: "jvm"
        }
    }
});

const backend = cli.flags.backend;
const config = defaultMpkgConfiguration;

const subcommands = {
    "build": buildTarget(config, backend, "src", `build/${backend}`),
    "install": packageInstallTarget(config, backend, cli.input[1], "src"),
    "init": initTarget(config, backend)
};

invokeTarget(subcommands[cli.input[0]], console.log);