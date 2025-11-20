# Monitors

Monitors track a single numeric server metric over time. Each monitor points to one value in the live server data, casts it to a specific data type (integer, float, bytes, seconds, or milliseconds), and xyOps stores the samples in a time‑series database. Monitors power the per‑server and per‑group graphs, and they can be used to trigger alerts.

- A monitor evaluates its expression once per minute on each matching server.
- Results are stored and graphed at multiple resolutions (hourly, daily, monthly, yearly).
- Alerts can reference monitor values and their computed deltas when needed.
- Several stock monitors ship with xyOps, and you can define your own.

See also:

- Data model: [Monitor](data.md#monitor) and [ServerMonitorData](data.md#servermonitordata)
- Plugins: [Monitor Plugins](plugins.md#monitor-plugins)
- Alerts: [Alerts](alerts.md)


## How It Works

Every minute each satellite sends a fresh [ServerMonitorData](data.md#servermonitordata) snapshot to the master. For every monitor whose group scope matches the server:

1. xyOps evaluates the monitor’s source expression against the current server monitor data sample.
2. The value is type‑cast using the monitor’s data type and optional match regex.
3. If the monitor is configured as a delta monitor, its rate is computed from the previous absolute value (and optionally divided by elapsed seconds).
4. The value is inserted into the server’s time‑series for all resolutions.

Notes:

- Monitor expressions run against the live ServerMonitorData context only. They do not depend on other monitors.
- Alerts evaluate immediately after monitors are computed, and can reference both absolute monitor values and computed deltas.
- Group scoping allows a monitor to run only on specific server groups. Leave groups blank to apply to all.


## Creating and Editing Monitors

Go to Admin → Monitors.

- **Title**: Display name for the graph.
- **Display**: Toggle to show/hide graph in the UI without deleting it.
- **Icon**: Optional Material Design Icon displayed next to the title.
- **Server Groups**: Restrict evaluation to specific groups (optional).
- **Data Expression**: An expression that extracts or computes a single numeric value from ServerMonitorData. See [Expressions](#expressions).
- **Data Match**: Optional regular expression to extract a number from a string value. See [Data Match](#data-match).
- **Data Type**: Controls parsing and display (integer, float, bytes, seconds, milliseconds).
- **Delta Features**: For counter‑style sources, compute a delta and optionally divide by elapsed time to get a rate per second; also supports a zero‑minimum clamp.
- **Min Vert Range**: Set a minimum Y‑axis range (e.g., 100 for percentages).
- **Data Suffix**: Optional unit shown in labels (e.g. %, /sec, ms).

Tips:

- Use the “Test…” button to evaluate your expression on a live server before saving.
- Click the search icon to open the Server Data Explorer and browse live ServerMonitorData paths.
- You can import/export monitors as JSON (see the stock examples below).


## Monitoring Data Flow

- **Sampling cadence**: Once per minute per server.
- **Storage**: Samples are down‑sampled into four systems: hourly, daily, monthly, yearly.
- **Deltas**: For counter‑style metrics (e.g., OS network bytes, disk bytes read/written), enable “Calc as Delta” and “Divide by Time” to graph rates per second.
- **Alert context**: After monitors are computed, xyOps evaluates alert triggers against the same data.


## Expressions

Monitor expressions are evaluated in [xyOps Expression Syntax](xyexp.md), using the current [ServerMonitorData](data.md#servermonitordata) object as context.  This uses JavaScript‑style syntax with dot paths, array indexing, arithmetic and boolean operators.

Examples:

- Basic metric: `cpu.currentLoad` (CPU usage as a float percentage)
- Array index: `load[0]` (1‑minute load average)
- Object path: `stats.network.conns` (current active connections)
- Math/composition: `100 - memory.available / memory.total * 100` (memory used %)
- Guarded math: `stats && stats.network ? stats.network.rx_bytes : 0` (coalesce missing to 0)

Guidelines:

- Expressions must resolve to a single numeric value before final casting.
- The evaluation context is the [ServerMonitorData](data.md#servermonitordata) for the current minute. Do not reference `monitors.*` or `deltas.*` in monitor expressions.
- For complex or custom metrics, consider a [Monitor Plugin](plugins.md#monitor-plugins) that can emit data into `commands`, and extract a number via expression (and optionally `data_match`).

## Data Match

If your expression yields a string and the number is embedded within it, set `Data Match` to a regular expression to extract exactly one numeric value. If the regex includes a capture group, the first group is used; otherwise the entire match is used.

Example (default “Open Files” monitor):

- Expression: `commands.open_files`
- Data Match: `(\d+)`
- Result: Extracts the first integer from a string like `"1056\t0\t9223372036854775807"`.


## Delta Monitors

Some data sources are absolute counters that only ever increase, such as OS network byte totals or disk I/O byte counters. For these:

- **Calc as Delta**: Stores the change since the previous minute instead of the absolute counter.
- **Divide by Time**: Divides the delta by elapsed seconds between samples to produce a per‑second rate.
- **Zero Minimum**: Clamp negative spikes to a specific minimum (commonly `0`) to avoid dips after reboots or counter resets.

Alerts can also reference delta values via the `deltas` object. See [Alert Expressions](alerts.md#alert-expressions).


## Default Monitors

xyOps ships with a set of standard monitors. Here is what each tracks:

- **Load Average**: `load[0]` — 1‑minute load average (float).
- **CPU Usage**: `cpu.currentLoad` — CPU usage percentage (float), suffix `%`, min range `100`.
- **Memory in Use**: `memory.used` — Total memory in use (bytes).
- **Memory Available**: `memory.available` — Available memory (bytes).
- **Network Connections**: `stats.network.conns` — Active socket connections (integer).
- **Disk Usage**: `mounts.root.use` — Root filesystem usage percentage (float), suffix `%`, min range `100`.
- **Disk Read**: `stats.fs.rx` — Disk bytes read, as a delta divided by time (bytes/sec). Enable: Calc as Delta, Divide by Time, Zero Minimum.
- **Disk Write**: `stats.fs.wx` — Disk bytes written, as a delta divided by time (bytes/sec). Enable: Calc as Delta, Divide by Time, Zero Minimum.
- **Disk I/O**: `stats.io.tIO` — Total disk I/O ops per second (integer). Enable: Calc as Delta, Divide by Time, Zero Minimum.
- **I/O Wait**: `cpu.totals.iowait` — CPU I/O wait percentage (float, Linux only), suffix `%`, min range `100`.
- **Open Files**: `commands.open_files` with `Data Match` `(\d+)` — Number of open files (integer, Linux only).
- **Network In**: `stats.network.rx_bytes` — Network bytes in per second (bytes/sec). Enable: Calc as Delta, Divide by Time, Zero Minimum.
- **Network Out**: `stats.network.tx_bytes` — Network bytes out per second (bytes/sec). Enable: Calc as Delta, Divide by Time, Zero Minimum.
- **Processes**: `processes.all` — Total number of processes (integer).
- **Active Jobs**: `jobs` — Number of active xyOps jobs on the server (integer).

Use these as templates for your own monitors, or create more from scratch. You can also import/export monitors as JSON files.


## QuickMon

QuickMon (Quick Monitors) are lightweight, predefined real‑time monitors sampled every second on each server. They are meant for “right now” visibility and short‑term trend lines on server and group pages.

- **Presets**: CPU load/usage, memory used/available, disk read/write bytes/sec, network in/out bytes/sec.
- **Retention**: The last 60 seconds per server is stored in memory.
- **Display**: Real‑time graphs and gauges on Server and Group pages. New samples stream live via websockets.
- **Snapshots**: The most recent 60‑second series is embedded into all server and group snapshots.
- **Config**: Definitions live in `config.json` under [quick_monitors](config.md#quick_monitors). Each preset includes `id`, `source` path (from the per‑second agent data), `type` (integer/float/bytes), and optional delta/time options mirroring monitor behavior.

QuickMon complements minute‑level monitors: use QuickMon for immediate visibility, and standard monitors for historical analysis and alerting.


## Examples and Recipes

- **Track Specific Process Memory**
  - Expression: `processes.list[.command == 'ffmpeg'].memRss` *(exact name match)*
  - Expression: `find( processes.list, 'command', 'ffmpeg' ).memRss` *(substring match)*
  - Type: `bytes`
- **Memory Used %**
  - Expression: `100 - memory.available / memory.total * 100`
  - Type: `float`, Suffix: `%`, Min Vert Range: `100`.
- **Root Free Space (in GB)**
  - Expression: `(mounts.root.available) / (1024 * 1024 * 1024)`
  - Type: `float`, Suffix: `GB`.
- **TCP LISTEN Sockets**
  - Expression: `count( conns[.state == 'LISTEN'] )`
  - Or alternatively: `stats.network.states.listen`
  - Type: `integer`.

If your expression returns a string (e.g., a custom command output), use “Data Match” to extract the number. For advanced metrics, write a [Monitor Plugin](plugins.md#monitor-plugins) that emits structured data, then point a monitor expression at it.
