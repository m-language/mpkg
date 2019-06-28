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

## Building

* Kotlin CLI compiler, version `1.3.30` or later
* Gradle, version `4.0` or later is preferred

## TODO
- Fix bug where a lasting gradle processes are running after building m-jvm
- Dont use `kotlin` script: invokes gradle in an unsafe way
- Write usage