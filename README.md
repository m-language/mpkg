# mpkg

NOTICE: *Functionality in development, expect breaking changes daily*

A temporary dependency management solution for [m-language](https://github.com/m-language/m-language),
allowing package installation, dependency resolution, package publishing, and package specification.

## Should I use this?

This project is not intended to be the final solution for M project management. However, it avoids
some problems associated with the full solution to be implemented later.

Because of this, it requires *you* to manually specify the packages your application uses, as opposed
to our planned solution that does not require this. Because of this, you may get user-unfriendly errors.

If you are ok with this, go on ahead with using this tool. However, be aware that a transition to a permanent solution
will be made, requiring some work on your part to get your package or application into the new system.

## Requirements

* Kotlin CLI compiler, version `1.3.0` or later
* Gradle, version `4.4` or later is preferred
* Node.js, version 10 or later

## Usage

mpkg should be used to build projects, but will not perform any installation of packages
or dependency resolution itself. To resolve dependencies, you must use a package manager 
like [yarn](https://github.com/yarnpkg/yarn) or [npm](https://github.com/npm/cli).

## Subcommands

`init [PROJECT]`

If `PROJECT` is provided, create a new directory called `PROJECT` and initialize
it by downloading the most recent version of the M compiler.

`build`

If the compiler has not been downloaded or is out of date, download the new compiler.
Then build the project to `<outDir>/<backend>`.

`exec ARGS...`

Execute the built project with command line arguments `ARGS`.

## Options

`--backend <backend>`

Backend to use when compiling, defaults to `jvm` or the backend specified in the configuration file.

`--packagePrefix <dir>`

Directory to look for packages in, packages are simply directories that have a `src` folder
inside containing the code for the library. This defaults to `node_modules`.

`--outDir <dir>`

Output directory for compiled code.

## Configuration

mpkg can be configured with a `mpkg.json` file at the top level of your project,
supporting the following options (currently):

```JS
{
    // Commit SHA for specific version of the M compiler    
    "compilerVersion": "...",
    // Option configuration (same as command line)
    "options": {
        "backend": "...",
        "packagePrefix": "...",
        "outDir": "..."
    },
    // Configuration for the different backends
    "backends": {
        "jvm": {
            // SHA referencing a specific version of the backend
            "version": "..."
        }
    },
    // The packages in `packagePrefix` to use when compiling
    "packages": {
        ...
    }
}
``` 

## TODO
- Fix bug where a lasting gradle processes are running after building m-jvm on failure, causing errors when rebuilding
- Dont use `kotlin` script: invokes gradle in an unsafe way
