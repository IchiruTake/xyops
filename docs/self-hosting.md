# Self-Hosting

This guide covers self-hosting xyOps on your own infrastructure.  However, please note that for live production installs, it is dangerous to go alone.  While we provide all necessary documentation here, we strongly recommend our [Enterprise Plan](https://xyops.io/enterprise). This gives you access to our white-glove onboarding service, where our team will guide you through every step, validate your configuration, and ensure your integration is both secure and reliable.  This also gets you priority ticket support, and live chat support from a xyOps engineer.

# Quick-Start

To start quickly and just get xyOps up and running to test it out, you can use the following Docker command:

```sh
docker run --init -v xy-data:/opt/xyops/data -p 5522:5522 -p 5523:5523 --name "xyops01" --hostname "xyops01" -e XYOPS_secret_key="MY_SECRET_KEY" -e TZ="America/Los_Angeles" ghcr.io/pixlcore/xyops:latest
```

Then hit http://localhost:5522/ in your browser for HTTP, or https://localhost:5523/ for HTTPS (note that this will have a self-signed cert -- see [TLS](#tls) below).  A default administrator account will be created with username `admin` and password `admin`.  This will create a Docker volume (`xy-data`) to persist the xyOps database, which by default is a hybrid of a SQLite DB and the filesystem itself for file storage.

Note that in order to add worker servers so you can actually run jobs, the container needs to be *addressable on your network* by its hostname.  Typically this is done by adding the hostname to your local DNS, or using a `/etc/hosts` file.  Alternatively, you can add worker servers as a Docker containers on the same network.  To do this, we need a few extra commands:

```sh
# First create the bridge network
docker network create xy-net

# Next, start xyOps in the newly created network
docker run --init -v xy-data:/opt/xyops/data --network=xy-net -p 5522:5522 -p 5523:5523 --name "xyops01" --hostname "xyops01" -e XYOPS_secret_key="MY_SECRET_KEY" -e TZ="America/Los_Angeles" ghcr.io/pixlcore/xyops:latest

# And finally, start up a worker, preconfigured to connect to the master container
docker run --init --network=xy-net --name "worker01" --hostname "worker01" -e XYOPS_masters="xyops01" -e XYOPS_secret_key="MY_SECRET_KEY" -e TZ="America/Los_Angeles" ghcr.io/pixlcore/xysat:latest
```

A few things to note here:

- This method of connecting a worker and master server uses a shared secret key.  The two keys **must match exactly**.
- The worker container doesn't need the storage volume mounted, nor does it need any ports exposed.
- You can spin up as many workers as you want -- just change the `--name` and `--hostname` of each one so they are unique.
- In this case xyOps will have a self-signed cert for TLS, which the worker will accept by default.  See [TLS](#tls) for more details.
- Change the `TZ` environment variable to your local timezone, for proper midnight log rotation and daily stat resets.

As an aside, when you add worker servers via the UI, secret keys are not used (nor are they *ever* sent over the wire).  Instead, a special cryptographic token is used to authenticate new worker servers.  You can also add batches of servers in bulk via API Keys.  See [Adding Servers](usage.md#adding-servers) for more details.

## Configuration

The xyOps main configuration file is located at `/opt/xyops/conf/config.json`.  Grab our [sample file](https://github.com/pixlcore/xyops/sample_conf/config.json) to use as a starting point for building yours.  You can bind a local file to this path on your Docker container by adding this to your Docker run command:

```
-v /local/path/to/config.json:/opt/xyops/conf/config.json
```

See the [Configuration Guide](configuration.md) for full details on how to customize this file.

# Manual Install

This section covers manually installing xyOps on a server (outside of Docker).

Please note that xyOps currently only works on POSIX-compliant operating systems, which basically means Unix/Linux and macOS.  You'll also need to have [Node.js](https://nodejs.org/en/download/) pre-installed on your server.  Please note that we **strongly suggest that you install the LTS version of Node.js**.  While xyOps should work on the "current" release channel, LTS is more stable and more widely tested.  See [Node.js Releases](https://nodejs.org/en/about/releases/) for details.

xyOps also requires NPM to be preinstalled.  Now, this is typically bundled with and automatically installed with Node.js, but if you install Node.js by hand, you may have to install NPM yourself.

Once you have Node.js and NPM installed, type this as root:

```sh
curl -s https://raw.githubusercontent.com/pixlcore/xyops/main/bin/install.js | node
```

This will install the latest stable release of xyOps and all of its dependencies under: `/opt/xyops/`

If you'd rather install it manually (or install as a non-root user), here are the raw commands:

```sh
mkdir -p /opt/xyops && cd /opt/xyops
curl -L https://github.com/pixlcore/xyops/archive/v1.0.0.tar.gz | tar zxvf - --strip-components 1
npm install
node bin/build.js dist
```

Replace `v1.0.0` with the desired xyOps version from the [official release list](https://github.com/pixlcore/xyops/releases), or `main` for the head revision (unstable).

## Command Line

Here are all the xyOps services available to you on the command line.  Most of these are accessed via the following shell script:

```
/opt/xyops/bin/control.sh [COMMAND]
```

Here are all the accepted commands:

| Command | Description |
|---------|-------------|
| `start` | Starts xyOps in daemon mode. See below. |
| `stop` | Stops the xyOps daemon and waits for exit. See below. |
| `restart` | Calls `stop`, then `start`, in sequence. See below.  |
| `status` | Checks whether xyOps is currently running. See below.  |
| `admin` | Creates new emergency admin account (specify user / pass). See [Recover Admin Access](#recover-admin-access). |
| `upgrade` | Upgrades xyOps to the latest stable (or specify version). See [Upgrading](#upgrading). |
| `version` | Outputs the current xyOps package version and exits. |
| `help` | Displays a list of available commands. |

### Starting and Stopping

To start the service, use the `start` command:

```
/opt/xyops/bin/control.sh start
```

And to stop it, the `stop` command:

```
/opt/xyops/bin/control.sh stop
```

You can also issue a quick stop + start with the `restart` command:

```
/opt/xyops/bin/control.sh restart
```

The `status` command will tell you if the service is running or not:

```
/opt/xyops/bin/control.sh status
```

## Start at Boot

To have xyOps automatically start on boot, run this command to add it to [systemd](https://en.wikipedia.org/wiki/Systemd) (or [launchd](https://en.wikipedia.org/wiki/Launchd) on macOS):

```sh
cd /opt/xyops
sudo npm run boot
```

## Upgrading

To upgrade xyOps that was manually installed, you can use the built-in `upgrade` command:

```
/opt/xyops/bin/control.sh upgrade
```

This will upgrade the app and all dependencies to the latest stable release, if a new one is available.  It will not affect your data storage, users, or configuration settings.  All those will be preserved and imported to the new version.  For multi-server clusters, you'll need to repeat this command on each master server.

Alternately, you can specify the exact version you want to upgrade (or downgrade) to:

```
/opt/xyops/bin/control.sh upgrade 1.0.4
```

If you upgrade to the `HEAD` version, this will grab the very latest from GitHub.  Note that this is primarily for developers or beta-testers, and is likely going to contain bugs.  Use at your own risk:

```
/opt/xyops/bin/control.sh upgrade HEAD
```

## Recover Admin Access

Lost access to your admin account?  You can create a new temporary administrator account on the command-line.  Just execute this command on your primary server:

```
/opt/xyops/bin/control.sh admin USERNAME PASSWORD
```

Replace `USERNAME` with the desired username, and `PASSWORD` with the desired password for the new account.  Note that the new user will not show up in the main list of users in the UI.  But you will be able to login using the provided credentials.  This is more of an emergency operation, just to allow you to get back into the system.  *This is not a good way to create permanent users*.  Once you are logged back in, you should consider creating another account from the UI, then deleting the emergency admin account.

Note that this trick does **not** work with [SSO](sso.md).  It only applies to setups that use the built-in user management system.

## Uninstall

To uninstall xyOps, simply stop the service and delete the `/opt/xyops` directory.

```sh
cd /opt/xyops
bin/control.sh stop
npm run unboot # deregister as system startup service
rm -rf /opt/xyops
cd -
```

# Environment Variables

xyOps supports a special environment variable syntax, which can specify command-line options as well as override any configuration settings.  The variable name syntax is `XYOPS_key` where `key` is one of several command-line options (see table below) or a JSON configuration property path.  These can come in handy for automating installations, and using container systems.  

For overriding configuration properties by environment variable, you can specify any top-level JSON key from `config.json`, or a *path* to a nested property using double-underscore (`__`) as a path separator.  For boolean properties, you can use `true` or `false` strings, and xyOps will convert them.  Here is an example of some of the possibilities available:

| Variable | Sample Value | Description |
|----------|--------------|-------------|
| `XYOPS_foreground` | `true` | Run xyOps in the foreground (no background daemon fork). |
| `XYOPS_echo` | `true` | Echo the event log to the console (STDOUT), use in conjunction with `XYOPS_foreground`. |
| `XYOPS_color` | `true` | Echo the event log with color-coded columns, use in conjunction with `XYOPS_echo`. |
| `XYOPS_base_app_url` | `http://xyops.yourcompany.com` | Override the [base_app_url](configuration.md#base_app_url) configuration property. |
| `XYOPS_email_from` | `xyops@yourcompany.com` | Override the [email_from](configuration.md#email_from) configuration property. |
| `XYOPS_secret_key` | `CorrectHorseBatteryStaple` | Override the [secret_key](configuration.md#secret_key) configuration property. |
| `XYOPS_WebServer__port` | `80` | Override the `port` property *inside* the [WebServer](configuration.md#webserver) object. |
| `XYOPS_WebServer__https_port` | `443` | Override the `https_port` property *inside* the [WebServer](configuration.md#webserver) object. |
| `XYOPS_Storage__Filesystem__base_dir` | `/data/xyops` | Override the `base_dir` property *inside* the [Filesystem](configuration.md#filesystem) object *inside* the [Storage](configuration.md#storage) object. |

Almost every [configuration property](configuration.md) can be overridden using this environment variable syntax.  The only exceptions are things like arrays, e.g. [log_columns](configuration.md#log_columns).

# Daily Backups

Here is how you can generate daily backups of all the xyOps data, regardless of your backend storage engine.  First, create an [API Key](api.md#api-keys) and grant it full administrator privileges (this is required to use the [admin_export_data](api.md#admin_export_data) API).  You can then request a full backup using a [curl](https://curl.se/) command like this:

```sh
curl -X POST "https://xyops.yourcompany.com/api/app/admin_export_data" \
	-H "X-API-Key: YOUR_API_KEY_HERE" -H "Content-Type: application/json" \
	-d '{"lists":"all","indexes":"all","extras":"all"}' -O
```

This will save the backup as a `.txt.gz` file in the current directory named using this filename pattern:

```
xyops-data-export-YYYY-MM-DD-UNIQUEID.txt.gz
```

Please note that this example will export **everything**, and can take quite a while and produce a very large file depending on your xyOps database size.  To limit what exactly gets included in the backup, consult the [admin_export_data](api.md#admin_export_data) API docs.

# TLS



sso guide links here (no longer?  yes, it still does -- talk about how to configure HTTPS with real certs, satellite reject unauthorized flag, etc.)

let's encrypt!  make sure your instructions still work!



# Multi-Master with Nginx



# Satellite

**xyOps Satellite (xySat)** is a companion to the [xyOps](https://xyops.io) workflow automation and server monitoring platform.  It is both a job runner, and a data collector for server monitoring and alerting.  xySat is designed to be installed on *all* of your servers, so it is lean and mean, and has zero dependencies.



## Overriding The Connect URL

sso guide links here




# Air-Gapped Mode



```json
"airgap": {
	"enabled": false,
	"outbound_whitelist": ["127.0.0.1", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "::1/128", "fd00::/8", "169.254.0.0/16", "fe80::/10"],
	"outbound_blacklist": []
}
```

These rules automatically propagate to all connected worker servers, and affect things like the [HTTP Plugin](plugins.md#http-plugin).

TODO: Talk about satellite, and the local filesystem package thing.  We need to create an air-gapped package for enterprise customers.
