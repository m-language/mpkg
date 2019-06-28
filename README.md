# mpkg

NOTICE: *Functionality in development, expect breaking changes daily*

A temporary dependency management solution for [m-language](https://github.com/m-language/m-language),
allowing package installation, dependency resolution, package publishing, and package specification.

## Should I use this?

This project is not intended to be the final solution for dependency management. However, it avoids
some problems associated with the full solution to be implemented later.

Because of this, it requires *you* to manually specify the packages your application uses, as opposed
to our planned solution that does not require this. Because of this, you may get user-unfriendly errors.

If you are ok with this, go on ahead with using this tool. However, be aware that a transition to a permanent solution
will be made, requiring some work on your part to get your package or application into the new system.

## Requirements

* Kotlin CLI compiler, version `1.3.30` or later
* Gradle, version `4.0` or later is preferred
* Node.js, version 10 or later

## Usage

`mpkg init`

Install most recent version of the m compiler and install standard library to project.

`mpkg build`

Build the project to `build/jvm/`; all class files will be dumped there.

`mpkg install <package>`

Install a package and make available for further usage when compiling.

## Options

`--backend <backend>`

Backend to use when compiling, defaults to `jvm`, which is the only supported backend at the moment.

## TODO
- Fix bug where a lasting gradle processes are running after building m-jvm
- Dont use `kotlin` script: invokes gradle in an unsafe way
- Write usage