Some plugins for xbar to provide some useful information about [Vercel](https://vercel.com/) in your Mac status bar. You'll need installed:
* [xbar](https://github.com/matryer/xbar)
* [node.js](https://nodejs.org/en/) preferably installed with [homebrew](https://brew.sh/)
* [npm](https://npmjs.com) this is used by the install script, although other managers will work, if you want to avoid the install script.
* An [API token](https://vercel.com/account/tokens) for Vercel

### What is it?



### Installing

`node install.js`

Should do all the work for you. This will:
* confirm xbar is installed
* confirm npm is installed
* install packages through npm
* create symlinks for the xbar plugins
* make the bash scripts executable
* create an .env file

### Configuring

Configuration is done through environment variables. However because xbar could be started so many different ways, it can also be configured through an .env file and I recommend this approach.

Environment variables:
* `VERCEL_TOKEN`: the token to authenticate requests with, get yours at [Vercel](https://vercel.com)
* `VERCEL_ICON`: either `light` or `dark` the icon to show in the menu bar. It's really hard to detect in xbar which one to show so pick the one that works best for you.