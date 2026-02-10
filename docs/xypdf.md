# xyOps Portable Data Format

## Overview

This document describes the **xyOps Portable Data Format** (XYPDF) v1.0, which is a method of storage for data objects in xyOps.  It enables users to export, store, transfer, and import objects to and from xyOps installations.  Export and import functions are facilitated from the xyOps UI.

- **Title**: xyOps Portable Data Format
- **ID**: XYPDF
- **Version**: 1.1
- **Date**: February 10, 2025
- **Authors**: Joseph Huckaby (PixlCore)

XYPDF is a [JSON](https://en.wikipedia.org/wiki/JSON) formatted text file with a specific layout.  The file can be plain text (with a `.json` file extension), or [Gzip](https://en.wikipedia.org/wiki/Gzip)-compressed (with a `.json.gz` file extension).  The JSON itself may be compacted or pretty-printed.

## User Interface

xyOps allows the user to "export" objects of various types in the UI.  When this occurs, the selected data structure is serialized and placed in a XYPDF wrapper, making it portable and reusable.  The file is then downloaded to the user's local machine.  The same file can then be "imported" back to xyOps via file upload, either replacing existing objects with the same IDs, or creating new objects as needed.

## Format

The top-level JSON properties in the XYPDF file are defined as follows:

| Property Name | Type | Description |
|---------------|------|-------------|
| `type` | String | File format identifier, should be set to `xypdf`. |
| `version` | String | File format version, should be set to `1.0` |
| `xyops` | String | Minimum supported xyOps version in semver format, e.g. `1.0.0`. Added in XYPDF v1.1. |
| `description` | String | Optional human-readable description of file, will be `xyOps Portable Data` if present. |
| `items` | Array | An array of sub-objects that define each item in the file.  See below for more. |

Each item the `items` array will be an object with the following properties:

| Property Name | Type | Description |
|---------------|------|-------------|
| `type` | String | Data type identifier, e.g. `plugin`. See below for full list. |
| `data` | Object | The actual contents of the object (format varies -- see below). |

## Object Types

The following object types can be exported from xyOps and included in XYPDF files:

| Data Structure | Type ID | Notes |
|----------------|---------|-------|
| [Alert](data.md#alert) | `alert` | - |
| [APIKey](data.md#apikey) | `api_key` | - |
| [Bucket](data.md#bucket) | `bucket` | Only includes bucket metadata, not actual files or data. |
| [Category](data.md#category) | `category` | - |
| [Channel](data.md#channel) | `channel` | - |
| [Event](data.md#event) | `event` | Workflows are part of this group, as they are just events with extra properties. |
| [Group](data.md#group) | `group` | - |
| [Monitor](data.md#monitor) | `monitor` | - |
| [Plugin](data.md#plugin) | `plugin` | - |
| [Role](data.md#role) | `role` | - |
| [Tag](data.md#tag) | `tag` | - |
| [WebHook](data.md#webhook) | `web_hook` | - |

## Examples

Here is an example XYPDF file containing one item, in pretty-printed plain text format:

```json
{
	"type": "xypdf",
	"version": "1.0",
	"xyops": "1.0.0",
	"description": "xyOps Portable Data",
	"items": [
		{
			"type": "web_hook",
			"data": {
				"id": "wmb6q7bh3hy",
				"title": "Discord",
				"enabled": true,
				"url": "https://discord.com/api/webhooks/123456789/abcdefghi",
				"method": "POST",
				"headers": [
					{
						"name": "Content-Type",
						"value": "application/json"
					},
					{
						"name": "User-Agent",
						"value": "xyOps/WebHook"
					}
				],
				"body": "{\n\t\"text\": \"{{text}}\",\n\t\"content\": \"{{text}}\",\n\t\"message\": \"{{text}}\"\n}",
				"timeout": 30,
				"retries": 0,
				"follow": false,
				"ssl_cert_bypass": false,
				"max_per_day": 0,
				"notes": "Posts to company Discord #general channel.",
				"icon": "chat-processing-outline",
				"username": "admin",
				"modified": 1761764935,
				"created": 1761764525,
				"revision": 3
			}
		}
	]
}
```

When exporting workflows, the XYPDF files may contain multiple items, for dependent Events and/or Plugins.

## Security

Importing XYPDF files that were downloaded from untrusted sources can be very dangerous, as they may contain malicious code.  To guard against this, xyOps will not process any uploaded XYPDF file without first prompting the user with a popup dialog, and displaying the **entire** file's contents, pretty-printed.  The user is instructed to inspect the file before confirming the import.

Also, if any object in an imported XYPDF file will **replace existing data** the user is warned and must confirm this action.

## References

- [JSON](https://en.wikipedia.org/wiki/JSON)
- [Gzip](https://en.wikipedia.org/wiki/Gzip)
