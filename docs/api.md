# Overview

This section details the xyOps REST API and API Key system.  All API calls expect JSON as input (unless they are simple HTTP GETs), and will return JSON as output.  The main API endpoint is:

```
https://SERVER/api/app/NAME/v1
```

Replace `NAME` with the specific API function you are calling (see below for list).  All requests should be HTTP GET or HTTP POST as the API dictates, and should be directed at your xyOps primary server.  Example URL:

```
http://sample.west.xyops.io/api/app/search_jobs/v1
```

## API Keys

API Keys allow you to register external applications or services to use the REST API.  These can be thought of as special user accounts specifically for applications.  Each API key can be granted a specific set of privileges.

To create an API Key, you must first be an administrator level user.  Login to the xyOps UI, proceed to the **API Keys** tab, and click the "Add API Key..." button.  Fill out the form and click the "Create Key" button at the bottom of the page.

API Keys are randomly generated alphanumeric strings, and are 24 characters in length by default.  They **are** case sensitive.  Example:

```
muJm8T6QSzqQzuO6MvbOdtlB
```

You must include a valid API Key with every API request.  There are three ways to do this: include a `X-API-Key` HTTP request header, an `api_key` query string parameter, or an `api_key` JSON property.

Here is a raw HTTP request showing all three methods of passing the API Key (only one of these is required):

```
GET /api/app/search_jobs/v1?api_key=muJm8T6QSzqQzuO6MvbOdtlB HTTP/1.1
Host: sample.west.xyops.io
X-API-Key: muJm8T6QSzqQzuO6MvbOdtlB
Content-Type: application/json

{"query": "*", "offset": 0, "limit": 50, "api_key": "muJm8T6QSzqQzuO6MvbOdtlB"}
```

## Standard Response Format

Regardless of the specific API call you requested, all responses will be in JSON format, and include at the very least a `code` property.  This will be set to `0` upon success, or any other value if an error occurred.  In the event of an error, a `description` property will also be included, containing the error message itself.  Individual API calls may include additional properties, but these two are standard fare in all cases.  Example successful response:

```json
{
	"code": 0
}
```

Example error response:

```json
{
	"code": "session", 
	"description": "No Session ID or API Key could be found"
}
```

# API Reference

## Alerts

See [Monitoring](monitoring.md) for details on the xyOps monitoring and alert system.

### get_alerts

```
GET /api/app/get_alerts/v1
```

This fetches all the current alert definitions.  No input parameters are defined.  No specific privilege is required, besides a valid user session or API Key.  Example response:

```json
{
	"code": 0,
	"rows": [
		{
			"id": "load_avg_high",
			"title": "High CPU Load",
			"expression": "monitors.load_avg >= (cpu.cores + 1)",
			"message": "CPU load average is too high: {{float(monitors.load_avg)}} ({{cpu.cores}} CPU cores)",
			"groups": [],
			"email": "",
			"web_hook": "",
			"monitor_id": "load_avg",
			"enabled": true,
			"samples": 1,
			"notes": "",
			"username": "admin",
			"modified": 1434125333,
			"created": 1434125333
		},
		...
	]
}
```

In addition to the [Standard Response Format](#standard-response-format), this API will also include a `rows` array containing information about every alert definition.

See [Alert](data-structures.md#alert) for details on the properties on each alert.

### get_alert

```
GET /api/app/get_alert/v1
```

This fetches a single alert definition given its ID. No specific privilege is required, besides a valid user session or API Key.  Both a HTTP GET with query string parameters and a HTTP POST with JSON are allowed.  The input parameters are as follows:

| Property Name | Type | Description |
|---------------|------|-------------|
| `id` | String | **(Required)** The alphanumeric ID of the alert to fetch. |

Here is an example request:

```json
{
	"id": "load_avg_high"
}
```

And an example response:

```json
{
	"code": 0,
	"alert": {
		"id": "load_avg_high",
		"title": "High CPU Load",
		"expression": "monitors.load_avg >= (cpu.cores + 1)",
		"message": "CPU load average is too high: {{float(monitors.load_avg)}} ({{cpu.cores}} CPU cores)",
		"groups": [],
		"email": "",
		"web_hook": "",
		"monitor_id": "load_avg",
		"enabled": true,
		"samples": 1,
		"notes": "",
		"username": "admin",
		"modified": 1434125333,
		"created": 1434125333
	}
}
```

In addition to the [Standard Response Format](#standard-response-format), this API will also include an `alert` object containing information about the requested alert.

See [Alert](data-structures.md#alert) for details on the alert properties.

### create_alert

```
POST /api/app/create_alert/v1
```

This creates a new alert definition.  The [create_alerts](privileges.md#create_alerts) privilege is required, as well as a valid user session or API Key.   The request must be sent as an HTTP POST with a JSON body.  See [Alert](data-structures.md#alert) for details on the input properties.  The `id`, `username`, `created` and `modified` properties may be omitted, as they are automatically generated.  Here is an example request:

```json
{
	"title": "High CPU Load",
	"expression": "monitors.load_avg >= (cpu.cores + 1)",
	"message": "CPU load average is too high: {{float(monitors.load_avg)}} ({{cpu.cores}} CPU cores)",
	"groups": [],
	"email": "",
	"web_hook": "",
	"monitor_id": "load_avg",
	"enabled": true,
	"samples": 1,
	"notes": ""
}
```

And an example response:

```json
{
	"code": 0,
	"alert": {...}
}
```

In addition to the [Standard Response Format](#standard-response-format), this API will also include an `alert` object containing the alert that was just created (including all the auto-generated properties).

See [Alert](data-structures.md#alert) for details on the alert properties.

### update_alert

```
POST /api/app/update_alert/v1
```

This updates an existing alert definition, specified by its ID.  The [edit_alerts](privileges.md#edit_alerts) privilege is required, as well as a valid user session or API Key.  The request must be sent as an HTTP POST with a JSON body.  See [Alert](data-structures.md#alert) for details on the input properties.  The request is "shallow-merged" into the existing alert, so you can provide a sparse set of properties to update.  Here is an example request:

```json
{
	"id": "load_avg_high",
	"title": "High CPU Load",
	"expression": "monitors.load_avg >= (cpu.cores + 1)"
}
```

And an example response:

```json
{
	"code": 0
}
```

The above example would update the `title` and `expression` of the alert with ID `load_avg_high`.  The other properties in the alert will not be touched (except for `modified` which is always updated, and some other internal properties).

### test_alert

```
POST /api/app/test_alert/v1
```

This tests an alert configuration, specifically the `expression` and `message` properties, against a specified server.  It tests both the syntax of the properties by pre-compiling them, and it also evaluates them against the specified server data, so you can see if the alert would fire given current conditions.  The [edit_alerts](privileges.md#edit_alerts) privilege is required, as well as a valid user session or API Key.  The request must be sent as an HTTP POST with a JSON body.  The input parameters are as follows:

| Property Name | Type | Description |
|---------------|------|-------------|
| `server` | String | **(Required)** The alphanumeric ID of the server to test the expression and message on. |
| `expression` | String | **(Required)** The alert expression to test. |
| `message` | String | **(Required)** The alert message to test. |

Here is an example request:

```json
{
	"server": "s12345abcde",
	"expression": "monitors.load_avg >= (cpu.cores + 1)",
	"message": "CPU load average is too high: {{float(monitors.load_avg)}} ({{cpu.cores}} CPU cores)"
}

And an example response:

```json
{
	"code": 0,
	"result": false,
	"message": "CPU load average is too high: 2.5 (2 CPU cores)"
}
```

In addition to the [Standard Response Format](#standard-response-format), this API will also include a `result` boolean indicating whether the alert would fire given the current server data, and a `message` string containing the evaluated message.

### delete_alert

```
POST /api/app/delete_alert/v1
```

This deletes an alert definition, specified by its ID. The [delete_alerts](privileges.md#delete_alerts) privilege is required, as well as a valid user session or API Key. The request must be sent as an HTTP POST with a JSON body. The input parameters are as follows:

| Property Name | Type | Description |
|---------------|------|-------------|
| `id` | String | **(Required)** The alphanumeric ID of the alert to delete. |

Here is an example request:

```json
{
	"id": "load_avg_high"
}
```

And an example response:

```json
{
	"code": 0
}
```

Deletions are permanent and cannot be undone.

## Buckets

A storage bucket is a logical container for storing files, for use in events and workflows. Buckets can hold an arbitrary number of files, and JSON data.

### get_buckets

```
GET /api/app/get_buckets/v1
```

This fetches all the current storage bucket defintions (sans actual data and files).  No input parameters are defined.  No specific privilege is required, besides a valid user session or API Key.  Example response:

```json
{
	"code": 0,
	"rows": [
		{
			"id": "bme4wi6pg35",
			"title": "The Void",
			"enabled": true,
			"icon": "",
			"notes": "",
			"username": "admin",
			"modified": 1754783050,
			"created": 1754783023,
			"revision": 2
		},
		...
	]
}
```

In addition to the [Standard Response Format](#standard-response-format), this API will also include an `rows` array containing information about every bucket definition.

See [Bucket](data-structures.md#bucket) for details on the properties on each bucket.

### get_bucket

```
GET /api/app/get_bucket/v1
```

This retrieves the definition of a specific storage bucket, including its data and file list.  No specific privilege is required, besides a valid user session or API Key.  Here are the input parameters:

| Property Name | Type | Description |
|---------------|------|-------------|
| `id` | String | **(Required)** The alphanumeric ID of the bucket to retrieve. |

And here is an example response:

```json
{
	"code": 0,
	"bucket": {
		"id": "bme4wi6pg35",
		"title": "The Void",
		"enabled": true,
		"icon": "",
		"notes": "",
		"username": "admin",
		"modified": 1754783050,
		"created": 1754783023,
		"revision": 2
	},
	"data": {
		"foo": "Hello this is a bucket"
	},
	"files": [
		{
			"id": "fme4wijr73h",
			"date": 1754783040,
			"filename": "test.png",
			"path": "files/bucket/bme4wi6pg35/bdY8zZ9nKynfFUb4xH6fA/test.png",
			"size": 92615,
			"username": "admin"
		}
	]
}
```

See [Bucket](data-structures.md#bucket) for details on the properties in the `bucket` object.  The `data` object will be populated with the bucket data, which is all user-defined.  The `files` array is a list of all the files in the bucket, if any.  To download a file, use the `path` property, prepended with the app's base URL (and a slash).

### create_bucket

```
POST /api/app/create_bucket/v1
```

This creates a new storage bucket.  The [create_buckets](privileges.md#create_buckets) privilege is required, as well as a valid user session or API Key.   The request must be sent as an HTTP POST with a JSON body.  See [Bucket](data-structures.md#bucket) for details on the input properties.  The `id`, `username`, `created` and `modified` properties may be omitted, as they are automatically generated.  Here is an example request:

```json
{
	"title": "The Void",
	"enabled": true,
	"icon": "",
	"notes": "",
	"data": {
		"foo": "Hello this is a bucket"
	}
}
```

And an example response:

```json
{
	"code": 0,
	"bucket": {...}
}
```

In addition to the [Standard Response Format](#standard-response-format), this API will also include a `bucket` object containing the bucket that was just created (including all the auto-generated properties).

As you can see in the above example, you can specify the user-defined bucket data along with the creation of the bucket itself.  Bucket files, however, need to be uploaded separately (see [upload_bucket_files](#upload_bucket_files)).

See [Bucket](data-structures.md#bucket) for details on the bucket properties.

### update_bucket

```
POST /api/app/update_bucket/v1
```

This updates an existing storage bucket, specified by its ID.  The [edit_buckets](privileges.md#edit_buckets) privilege is required, as well as a valid user session or API Key.  The request must be sent as an HTTP POST with a JSON body.  See [Bucket](data-structures.md#bucket) for details on the input properties.  The request is "shallow-merged" into the existing bucket, so you can provide a sparse set of properties to update.  Here is an example request:

```json
{
	"id": "bme4wi6pg35",
	"title": "The Void",
	"data": {
		"foo": "Hello this is a bucket"
	}
}
```

And an example response:

```json
{
	"code": 0
}
```

The above example would update the `title` and `data` of the bucket with ID `bme4wi6pg35`.  The other properties in the bucket will not be touched (except for `modified` which is always updated, and some other internal properties).

### delete_bucket

```
POST /api/app/delete_bucket/v1
```

This deletes a storage bucket, including all data and files, specified by its ID. The [delete_buckets](privileges.md#delete_buckets) privilege is required, as well as a valid user session or API Key. The request must be sent as an HTTP POST with a JSON body. The input parameters are as follows:

| Property Name | Type | Description |
|---------------|------|-------------|
| `id` | String | **(Required)** The alphanumeric ID of the bucket to delete. |

Here is an example request:

```json
{
	"id": "bme4wi6pg35"
}
```

And an example response:

```json
{
	"code": 0
}
```

Deletions are permanent and cannot be undone.

### upload_bucket_files

```
POST /api/app/upload_bucket_files/v1
```

This API allows you to upload files into a storage bucket.  Unlike most of the other APIs, this one handles files, so it requires a `multipart/form-data` style request.  The parameters should be actual HTTP POST parameters, rather than JSON keys.  The [edit_buckets](privileges.md#edit_buckets) privilege is required, as well as a valid user session or API Key.  The input parameters are as follows:

| Property Name | Type | Description |
|---------------|------|-------------|
| `bucket` | String | **(Required)** The alphanumeric ID of the bucket to upload files to. |

The file properties are automatically set based on the user files themselves, including the filename, file size, etc.  The `bucket` parameter is used to specify the target bucket for the upload.

Note that bucket files are automatically added or replaced based on their normalized filenames.  Normalization involves converting anything other than alphanumerics, dashes and periods to underscores, and converting the filename to lowercase.

### delete_bucket_file

```
POST /api/app/delete_bucket_file/v1
```

This API deletes a file from a storage bucket. The [edit_buckets](privileges.md#edit_buckets) privilege is required, as well as a valid user session or API Key. The request must be sent as an HTTP POST with a JSON body. The input parameters are as follows:

| Property Name | Type | Description |
|---------------|------|-------------|
| `id` | String | **(Required)** The alphanumeric ID of the bucket to delete the file from. |
| `filename` | String | **(Required)** The normalized filename of the file to delete. |
	
Here is an example request:

```json
{
	"id": "bme4wi6pg35",
	"filename": "test.png"
}
```

And an example response:

```json
{
	"code": 0
}
```

Deletions are permanent and cannot be undone.

## Categories

### get_categories

### get_category

### create_category

### update_category

### delete_category

### multi_update_category



## Channels

### get_channels

### get_channel

### create_channel

### update_channel

### delete_channel



## Events

### get_events

### get_event

### get_event_history

### create_event

### update_event

### delete_event

### run_event



## Files

### upload_files

### upload_job_file

### delete_job_file

### upload_job_input_files

### file



## Groups

### get_groups

### get_group

### create_group

### update_group

### delete_group

### multi_update_group

### watch_group

### create_group_snapshot



## Jobs

### get_active_jobs

### get_active_job_summary

### get_workflow_job_summary

### get_job

### get_jobs

### get_job_log

### view_job_log

### download_job_log

### tail_live_job_log

### update_job

### job_toggle_notify_me

### manage_job_tags

### manage_job_comments

### abort_job

### delete_job

### flush_event_queue



## Monitors

### get_monitors

### get_monitor

### create_monitor

### update_monitor

### test_monitor

### delete_monitor

### multi_update_monitor

### get_quickmon_data

### get_latest_monitor_data

### get_historical_monitor_data



## Plugins

### get_plugins

### get_plugin

### create_plugin

### update_plugin

### delete_plugin



## Roles

### get_roles

### get_role

### create_role

### update_role

### delete_role



## Search

### search_jobs

### search_servers

### get_server_summaries

### search_alerts

### search_snapshots

### search_activity

### search_revision_history

### search_stat_history



## Secrets

### get_secret

### get_secrets

### decrypt_secret

### create_secret

### update_secret

### delete_secret



## Servers

### get_active_servers

### get_active_server

### get_server

### update_server

### delete_server

### watch_server

### create_snapshot



## Tags

### get_tags

### get_tag

### create_tag

### update_tag

### delete_tag



## Tickets

### get_ticket

### get_tickets

### search_tickets

### create_ticket

### update_ticket

### add_ticket_change

### update_ticket_change

### delete_ticket_file

### delete_ticket



## Users

### create_user

### update_user

### delete_user

### get_user_activity

### user_settings

### check_user_exists

### logout_all

### upload_avatar

### admin_upload_avatar

### delete_avatar

### admin_delete_avatar

### avatar



## Web Hooks

### get_web_hooks

### get_web_hook

### create_web_hook

### update_web_hook

### delete_web_hook

### test_web_hook



## Administrative

### get_servers

### get_master_state

### update_master_state

### test_internal_job

### bulk_search_delete_jobs

### bulk_search_delete

### admin_run_maintenance

### admin_run_optimization

### admin_reset_daily_stats

### get_transfer_token

### admin_stats

### admin_import_data

### admin_export_data

### admin_delete_data

### get_api_keys

```
GET /api/app/get_api_keys/v1
```

This retrieves a list of all registered API Keys.  

### get_api_key

### create_api_key

### update_api_key

### delete_api_key
