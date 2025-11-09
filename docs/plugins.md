&larr; *[Return to the main document](index.md)*

<hr/>

<!-- toc -->

# Plugins

This document describes the xyOps Plugin System.  You can extend xyOps with the inclusion of Plugins, either by writing them yourself (in any language!), or by finding one on the [Plugin Marketplace](#plugin-marketplace).



## Event Plugins

xy, type, ...job



## Monitor Plugins



## Action Plugins

Action Plugins are designed to be custom actions that take place in response to jobs starting, completing, or completing with specific result codes (e.g. success, error, warning, critical, etc.).  You can already assign a number of [built-in actions](events.md#actions) including sending an email, firing a web hook, launching another job, taking a server snapshot, and more.  But with Plugins you can write your own actions that do anything you want.  They can even be configured to accept a custom set of parameters that are configured by the user in the event.

Action Plugins run *on the master server*, as they are part of the job engine.  However, you can still write them in any language, as the communication API is JSON over STDIO.  To create an Action Plugin, navigate to the **Plugins** page, and click the **New Plugin** button.  For the Plugin type, select "Action Plugin".

### Parameters

As with most other Plugin types, you can define custom parameters for Action Plugins.  These can be text fields, text boxes, code editors, select menus or checkboxes.  The user can then fill these out when they are editing the event, and they are passed to the Plugin when the action fires.

### Input

xy, params, ...hook_args -- [JobHookData](data-structures.md#jobhookdata)



### Output

xy, code, description, details -- json optional, if omitted, raw output is logged



## Trigger Plugins

Trigger Plugins are extensions of the scheduler system, in that they can decide "when" to launch jobs.  Specifically, if an event uses a trigger plugin, it is consulted *once per minute on the minute* (the same as the scheduler itself), and the Plugin decides whether to launch each assigned job or not.  This can be used for custom timing algorithms like sunrise / sunset, or even watching a directory or S3 prefix for new files.

Trigger Plugins run *on the master server*, as they execute before a job is launched and before a server is chosen for it.  However, like the other Plugin types, they are spawned as sub-processes and can be written in virtually any language.  There is no SDK to use -- xyOps communicates with Plugins via JSON over STDIO.

To create a Trigger Plugin, navigate to the **Plugins** page, and click the **New Plugin** button.  For the Plugin type, select "Trigger Plugin".

### Parameters

As with most other Plugin types, you can define custom parameters for Trigger Plugins.  These can be text fields, text boxes, code editors, select menus or checkboxes.  The user can then fill these out when they are editing the event, and they are passed to the Plugin when deciding to run jobs for that event.

### Input

When your trigger plugin is invoked, it will be passed an array of all the events awaiting a launch decision (i.e. all the events which have added your trigger plugin to them).  A single line of JSON will be passed to your plugin process via STDIN, which looks like this (pretty-printed for display purposes):

```json
{
	"xy": 1,
	"type": "trigger",
	"items": [
		{
			"timezone": "America/Los_Angeles", 
			"now": 1757642510, 
			"dargs": {
				"year": 2022, 
				"month": 11, 
				"day": 29, 
				"rday": -3,
				"weekday": 2, 
				"hour": 22, 
				"minute": 29
			}, 
			"params": {
				"longitude": -118.2437,
				"latitude": 34.0522
			}, 
			"job": {
				"id": "emdy0mg1oum",
				"title": "Convert Video Format",
				"enabled": true,
				"username": "admin",
				"modified": 1726463348,
				"created": 1726463348,
				"category": "cat2",
				"targets": [
					"main"
				],
				"algo": "random",
				"notes": ""
			}
		}
	]
}
```

As with all xyOps STDIO communication, the JSON will always have a top-level `xy` property set to `true`.  Also present is an `items` array, which will contain an element for each event that has the plugin assigned as a trigger.  It is up to your plugin code to decide if each event should launch a job or not.  You are also provided some other information about the events:

| Property Name | Type | Description |
|---------------|------|-------------|
| `timezone` | String | The currently selected timezone for the event. |
| `now` | Number | The current time for the potential job launch in Epoch seconds.  Note that this may be in the past, if xyOps is catching up on missed events. |
| `dargs` | Object | The current date/tme for the job launch, separated out into individual numerical elements, in the event's timezone.  See below for details. |
| `params` | Object | This object will contain your plugin's own custom defined parameters, filled out by the user at the event level. |
| `job` | Object | This is a copy of the [Event](data-strictured.md#event) object that will be used to launch the job if your plugin decides it should. |

Here are descriptions of all the `dargs` date/time properties:

| Property Name | Type | Description |
|---------------|------|-------------|
| `year` | Number | The year as an integer, e.g. `2025`. |
| `month` | Number | The month number from `1` to `12`. |
| `day` | Number | The month day from `1` to `31`. |
| `rday` | Number | The reverse month day (e.g. the last day of the month will be `-1`, the second-to-last day will be `-2`, and so on). |
| `weekday` | Number | A number representing the day of the week, from `0` (Sunday) to `6` (Saturday). |
| `hour` | Number | The hour in 24-hour format (from `0` to `23`). |
| `minute` | Number | The minute number from `0` to `59`. |

The JSON will be provided to your plugin as a single line on STDIN.  You will need to read and parse the JSON to iterate over the `items` array.  Here is an example in Node.js (but you can use any language you want):

```js
const data = JSON.parse(require('fs').readFileSync(process.stdin.fd, 'utf8'));

data.items.forEach( function(item) {
	// do something with item...
} );
```

### Output

Once your plugin decides which events should launch jobs (if any), you need to communicate that information back to xyOps.  This is done by sending a JSON record out through your process STDOUT.  Similar to the document you received via STDIN, it needs to have a top-level `xy` property set to `1`, and an `items` array:

```json
{
	"xy": 1,
	"items": [ false, false, true ]
}
```

The `items` array should have the same number of elements as the initial one you received, and each element can be set to a simple Boolean as shown above.  In this case `true` means launch a job for the event, and `false` means do not.  Each item in your output array matches up with the corresponding object in the input array, via their indexes.

Now, instead of a simple Boolean, the items can also be objects containing a `launch` Boolean (indicating whether to launch a job or not).  This alternate verbose format exists so you can include additional metadata for the launched jobs.  Example:

```json
{
	"xy": 1,
	"items": [ 
		{
			"launch": false
		},
		{
			"launch": false
		},
		{
			"launch": true,
			"data": { "mykey1": "myvalue1" },
			"files": [ "/path/to/file.txt" ]
		}
	]
}
```

In fact, what you can do instead of constructing a new `items` array for the output, is to modify in place the existing `items` array you received via STDIN (i.e. just add `launch` and other properties directly to it), and then echo the modified object back out via STDOUT.  To illustrate this, here is a silly example that randomly launches jobs based on a 50% probability:

```js
// read from STDIN
const data = JSON.parse(require('fs').readFileSync(process.stdin.fd, 'utf8'));

data.items.forEach( function(item) {
	// randomly launch a job or not
	item.launch = Math.random() < 0.5;
} );

// write to STDOUT
process.stdout.write( JSON.stringify(data) + "\n" );
```

Obviously your plugin will do something more useful than this, but you get the idea.  See the following sections to learn what else you can include in the `items` array elements.

#### Data

When your trigger plugin decides to launch a job, you can optionally include arbitrary data that will be passed to it.  This is done by including a `data` object inside the item element, alongside the `launch` boolean.  Example:

```json
{
	"xy": 1,
	"items": [ 
		{
			"launch": false
		},
		{
			"launch": false
		},
		{
			"launch": true,
			"data": { 
				"mykey1": "myvalue1",
				"mykey2": "myvalue2"
			}
		}
	]
}
```

The format of the `data` property is user-defined, and it will be passed verbatim to the launched job, becoming the [input.data](data-structures.md#job-input) property inside the [Job](data-structures.md#job) object (same as if data is passed to it from a previous chained job, workflow, action, etc.).

#### Files

You can also send along files to your launched jobs.  These will be attached to the job as inputs, and automatically downloaded in each job's temp directory on the remote server.  To do this, include a `files` array alongside your `launch` property.  The files array should be populated like this:

```json
{
	"xy": 1,
	"items": [ 
		{
			"launch": false
		},
		{
			"launch": false
		},
		{
			"launch": true,
			"files": [
				{ "path": "/path/to/file.jpg", "delete": true }
			]
		}
	]
}
```

Each object in the `files` array needs to have a `path` property that points to a single file.  You can also optionally pass a `delete` property.  If this is set to `true` then xyOps will automatically delete the file after it is uploaded.

This mechanism works the same as if the files were passed to your job from a previous chained job, workflow, action, etc.

#### Delay

If you would like to delay a job launch, send back a `delay` property alongside the `launch` Boolean, set to the number of seconds you want the job to wait before running.  Example:

```json
{
	"xy": 1,
	"items": [ 
		{
			"launch": false
		},
		{
			"launch": false
		},
		{
			"launch": true,
			"delay": 30
		}
	]
}
```

Note that this mechanism works similarly to the built-in [Delay](events.md#delay) scheduler option.  Meaning, the job still "launches" but is set to a special pending state until the specified delay elapses, at which time the job becomes active and runs proper.  Also note that the delay value is computed relative to the job's original start time (i.e. the [Job.now](data-structures.md#job-now) actual on-the-minute time).

## Plugin Marketplace

TODO: this!

### Toolset

TODO: this!
