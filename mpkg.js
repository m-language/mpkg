#!/usr/bin/env node
'use strict';

const targets = require("./targets");
const meow = require('meow');

const buildTarget = targets.buildTarget;
const installTarget = targets.packageInstallTarget;
const initTarget = targets.initTarget;

const cli = meow({
    flags: {}
});

const mRoot = "./.mpkg/";

const usage = `
Usage: ${process.argv[1]} SUBCOMMMAND ARGUMENTS [OPTIONS]

SUBCOMMAND
    init                Download + Install compiler and standard library
    build               Build the project with the m compiler
    install PACKAGE     Install m package PACKAGE
`;

const subcommands = {
    "build": buildTarget(mRoot, "jvm", "src", "build/jvm"),
    "install": installTarget(mRoot, cli.input[1]),
    "init": initTarget(mRoot)
    //"uninstall": uninstallTarget(mRoot, cli.input[1])
};

targets.invokeTarget(subcommands[cli.input[0]]);