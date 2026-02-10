# Plugin Marketplace

## Overview

xyOps has an integrated Plugin Marketplace, so you can expand the app's feature set by leveraging Plugins published both by PixlCore (the makers of xyOps), as well as the developer community.  To visit the marketplace, click the "**Marketplace**" link in the sidebar.

This document explains how to create and publish your own xyOps Plugins.  Marketplace Plugins are essentially cloud-hosted code libraries that self-download and self-execute, along with metadata to populate the marketplace listing, and define Plugin parameters for configuration.

The marketplace doesn't actually "host" Plugins -- it merely provides a search mechanism to discover them.  The Plugins themselves are hosted on package repositories like NPM, PyPI or GitHub, and the marketplace links to them.

> [!NOTE]
> For marketplace v1, your source code repository must be hosted on GitHub.  We will expand to support other hosts like GitLab and BitBucket in the future.

## Requirements

To publish your xyOps Plugin to the marketplace, it must:

- Be free to use
	- The Plugin may need to access a 3rd party paid service, which is fine.
	- By "free" we mean that the Plugin itself doesn't cost any money to install (our marketplace has no "buy" button).
- Be hosted publicly on GitHub.
	- We will expand to support other hosts in the future.
- Be able to execute using a self-contained download + launch combo command.
	- Examples of these include [npx](https://docs.npmjs.com/cli/commands/npx), [uvx](https://docs.astral.sh/uv/guides/tools/), [go run](https://pkg.go.dev/cmd/go#hdr-Compile_and_run_Go_program), and [docker run](https://docs.docker.com/reference/cli/docker/container/run/).
	- The command must download a specific tagged version or commit hash of the Plugin.
- Be fully open source using an [OSI-approved license](https://opensource.org/licenses).
	- All Plugin dependencies must also adhere to this requirement.
- Declare any user data or metrics collection.
	- If the Plugin collects user data for any reason, this must be declared in the [README](#readme).
	- An exception is when 3rd party services collect their own data, outside of the author's control.
- Be fully legal to use.
	- The Plugin must not violate any laws or terms of service, directly or indirectly.
- Be family friendly.
	- No adult content, bad language, etc.

PixlCore reserves the right to reject any Plugin submission it deems inappropriate for the marketplace.

## Launch Command

Your Plugin will need to be able to self-download and self-launch using a combo shell command.  These commands typically download software into a temporary cached directory, install all dependencies, and launch your Plugin all in one fell swoop.  Examples of these commands include:

- [npx](https://docs.npmjs.com/cli/commands/npx) - If your Plugin is written in Node.js, this is the perfect command to use.
- [uvx](https://docs.astral.sh/uv/guides/tools/) - If your Plugin is written in Python, then `uvx` is definitely the tool for you.
- [go run](https://pkg.go.dev/cmd/go#hdr-Compile_and_run_Go_program) - If your Plugin is written in Go, use `go run` which can download and run your Plugin using one command.
- [docker run](https://docs.docker.com/reference/cli/docker/container/run/) - If your Plugin ships as a docker container on a public container registry, then use `docker run`.

### npx

Here is an example command using `npx`.  The `-y` flag skips the user prompt.

```sh
npx -y @myorg/xyplug-example@1.0.0
```

This would download, install and run version `1.0.0` of the `xyplug-example` module from the `myorg` NPM org.

Your module does not actually need to be published to the NPM package registry.  It can simply live on GitHub, GitLab, or BitBucket, and have a version tag.  Example (GitHub):

```sh
npx -y github:myorg/xyplug-example#v1.0.0
```

This variant uses `npx` with a GitHub repo link, and an inline version tag (`#v1.0.0`).  Note that in this case the user would also need the `git` CLI, as that is how NPX resolves these types of package links.  So you would need to list `git` as an additional Plugin requirement (see [Plugin Requirements](#requirements)).

To learn more about how to package up your Node.js project for NPX, and to see a live working demo, check out [xyplug-sample-npx](https://github.com/pixlcore/xyplug-sample-npx) on GitHub.

### uvx

Here is an example command using `uvx`:

```sh
uvx git+https://github.com/myorg/xyplug-example@v1.0.0
```

To learn more about how to package up your Python project for UVX, and to see a live working demo, check out [xyplug-sample-uvx](https://github.com/pixlcore/xyplug-sample-uvx) on GitHub.

### go run

Here is an example command using `go run`:

```sh
go run github.com/myorg/xyplug-example@v1.0.0
```

To learn more about how to package up your Go project for `go run`, and to see a live working demo, check out [xyplug-sample-go](https://github.com/pixlcore/xyplug-sample-go) on GitHub.

### docker run

Here is an example using `docker run`:

```sh
docker run --rm -i REGISTRY/OWNER/IMAGE:TAG
```

Here is an example of a fictional image on the GitHub Container Registry:

```sh
docker run --rm -i ghcr.io/myorg/xyplug-example:1.0.0
```

The `--rm` switch makes the container ephemeral, and the `-i` switch enables STDIN to pass into the entrypoint inside the container.

## Export Plugin Data

On the Plugin Edit screen, xyOps provides a "**Export...**" button.  Click this to download your Plugin in [xyOps Portable Data](xypdf.md) format.  Here is an example export:

```json
{
	"type": "xypdf",
	"version": "1.0",
	"xyops": "0.9.0",
	"description": "xyOps Portable Data",
	"items": [
		{
			"type": "plugin",
			"data": {
				"id": "pmb6q7bh3hy",
				"title": "Upload S3 File",
				"type": "event",
				"enabled": true,
				"command": "npx -y github:myorg/xyplug-upload-s3-file#v1.0.0",
				"script": "",
				"icon": "aws",
				"notes": "Upload a local file to an S3 bucket.",
				"params": [
					{
						"id": "region",
						"title": "Region ID",
						"type": "text",
						"required": true
					},
					{
						"id": "bucket",
						"title": "Bucket Name",
						"type": "text",
						"required": true
					},
					{
						"id": "localPath",
						"title": "Local Path",
						"type": "text",
						"value": ""
					},
					{
						"id": "remotePath",
						"title": "Remote Path",
						"type": "text",
						"value": ""
					}
				]
			}
		}
	]
}
```

Commit this file to your Plugin's source code repository.  It must live at the root level and be named `xyops.json`.

## README

Make sure your Plugin has a detailed `README.md` file at the root level of your code repository.  It should be in [Markdown](https://daringfireball.net/projects/markdown/syntax) format, specifically [GitHub-Flavored Markdown](https://github.github.com/gfm/).  This file will serve as your product details page when users click on your Plugin from the marketplace search results.  Your README should have the following:

- A detailed English description of what your Plugin does.
	- Non-English locales will be introduced soon.
- A list of the CLI requirements needed to install the Plugin.
	- e.g. `npx`, `git`, `uvx`, `go`, and/or `docker`.
- A list of all environment variables required by your Plugin.
	- e.g. API keys, auth tokens, secrets, etc.
- Declare any user data or metrics collection.
- Usage examples (nice-to-have).

## Logo

Your Plugin should have a logo image, for displaying in the marketplace search results.  It should be:

- 1:1 aspect ratio (square)
- Alpha transparent and light/dark friendly
- At least 128x128px
- PNG format
- Named `logo.png`
- Stored at the root level of your repo

## License

Make sure your Plugin has a `LICENSE.md` (or `LICENSE`) file at the root level of your code repository.

Note that it must be an [OSI-approved license](https://spdx.org/licenses/) to be eligible for inclusion in the marketplace.

## Files

In summary, the following files are required to live at the root level of your git repo:

```
README.md
LICENSE.md
xyops.json
logo.png
```

(The license can alternatively be named `LICENSE` or `COPYING`, with or without an extension.)

## Tags

Make sure you tag your repo for each release.  The git tag name should be the version number, typically with a leading `v` character, followed by a 3-part number.  Examples:

```
v1.0.0
v1.0.1
v2.0.0
```

Using [semver](https://semver.org/) style versioning is recommended, but not required.

## Examples

See the following repositories which are good example Plugins to use as references:

- [pixlcore/xyplug-bluesky](https://github.com/pixlcore/xyplug-bluesky)
- [pixlcore/xyplug-stagehand](https://github.com/pixlcore/xyplug-stagehand)

## Marketplace Submission

When you are ready to publish your Plugin, head on over to the marketplace's GitHub repository:

https://github.com/pixlcore/xyops-marketplace

Make a pull request, and add your Plugin metadata to the `marketplace.json` file, specifically as a new object at the end of the `rows` array.  It should be formatted like this:

```json
{
	"id": "pixlcore/xyplug-stagehand",
	"title": "Stagehand",
	"author": "PixlCore",
	"description": "An AI-powered browser automation framework for xyOps.  Drive a headless browser with simple English instructions, take actions, extract data, capture network requests, and even record a video of the whole session.",
	"versions": ["v1.0.9", "v1.0.8", "v1.0.7"],
	"type": "plugin",
	"plugin_type": "event",
	"license": "MIT",
	"tags": ["Stagehand", "Playwright"],
	"requires": [ "docker" ],
	"created": "2026-01-01",
	"modified": "2026-01-02"
}
```

Here are descriptions of the properties:

| Property Name | Type | Description |
|---------------|------|-------------|
| `id` | String | The ID of your Plugin, which should be your GitHub Org and your repo ID, joined with a slash. |
| `title` | String | A title for your Plugin.  Displayed in bold in the marketplace. |
| `author` | String | The author of the Plugin (company or individual). |
| `description` | String | A short description of your Plugin.  Displayed under the title in the marketplace. |
| `versions` | Array | A sorted array of strings containing all the available versions (git tags) of your Plugin.  The latest release should be listed first. |
| `type` | String | What type of item you are publishing.  Set this to `plugin` for v1 (will be expanded in the future). |
| `plugin_type` | String | If submitting a plugin, this specifies the plugin type.  Should be one of: `event`, `action`, `monitor` or `scheduler`.  You can find this value inside your Plugin's export data. |
| `license` | String | The [SPDX Identifier](https://spdx.org/licenses/) for the open-source license your Plugin uses (must be OSI-approved). |
| `tags` | Array | An array of keyword strings, used for searching. |
| `requires` | Array | List the CLI requirements to launch your Plugin, e.g. `npx`, `uvx`, `go run` and/or `docker`. |
| `created` | String | Date of first publication, in YYYY-MM-DD format. |
| `modified` | String | Date of latest version, in YYYY-MM-DD format. |

Note that all Plugin submissions are human-reviewed.  Please be prepared to wait several days before your Plugin is approved.  If your Plugin is denied, a xyOps team member will explain why, and help you to resubmit with the necessary changes to get approved.

## Self Distribution

You are free to distribute your Plugins outside the xyOps Marketplace.  To do so, simply [export](#export-plugin-data) your Plugin following the instructions above, and host your [xyOps Portable Data](xypdf.md) file on your own website, or share it as you would any digital file.  Anyone running xyOps with the proper account privileges (namely [create_plugins](privileges.md#create_plugins) and [edit_plugins](privileges.md#edit_plugins), or [admin](privileges.md#admin)) can import your Plugin.

It is recommended that you either:

- Configure your web server to include a `Content-Disposition: attachment` header, so browsers download the file when clicked, or...
- Gzip-compress the file first, and host the `.json.gz` version.

To import a self-distributed Plugin into xyOps, the user simply has to navigate to the Plugin List by clicking the "**Plugins**" link in the sidebar, and then click the "**Import File...**" button, or drag & drop the downloaded file onto the browser window.  They will then be prompted to import the Plugin, at which point it can immediately be used in events and workflows.

Note that it is up to the user to install the necessary prerequisites such as `npx`, `uvx`, etc.  These do come preinstalled on the official xyOps Docker container, so if the user installed xyOps via Docker, no additional software should need to be installed.
