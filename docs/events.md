&larr; *[Return to the main document](index.md)*

<hr/>

<!-- toc -->

# Events



## Event Triggers

### Schedule

### Single Shot

### Interval

### Manual Run

### Magic Link

### Catch-Up

Catch-up mode is an optional feature designed to ensure that an event always runs on schedule, even when certain situations arise that may temporarily prevent its execution. This can include scenarios such as:

- Shutting down the xyOps service
- Pausing the scheduler
- Disabling the scheduler or catch-up triggers in the event
- Disabling the entire event

When catch-up mode is enabled, xyOps will execute **all** the scheduled jobs for the event, including any missed ones that should have run during the "downtime".

Internally, catch-up mode maintains a "cursor" in the xyOps database for every event, which points to a specific timestamp.  Whenever a job runs on schedule, the following occurs:

- The cursor advances to the next minute, stopping at the current time.
- In the event of a time gap, the cursor advances minute-by-minute up to the current time, to ensure that no scheduled jobs are missed.

You can manually set the cursor time by editing the catch-up trigger option for an event.  Use this to replay past events, or jump ahead to the current time.

Catch-Up mode will **not** re-run jobs that failed or were aborted.  This is by design.  If you would like failed jobs to automatically re-run, set a [Max Retry Limit](#max-retry-limit).

### Range

### Blackout

### Delay

### Precision

### Trigger Plugin

Plugins can be used to trigger job launches at custom times.  For details, see [Trigger Plugins](plugins.md#trigger-plugins).




## Job Actions

### Send Email

### Web Hook

### Channel Notification

### Bucket Action

### Suspend Job

### Action Plugin



## Resource Limits

Limits are self-imposed restrictions you can place on your events, to govern resource usage as the job runs, as well as specify options such as max number of retries, or max allowed jobs to queue up.  Limits can be defined at several different levels, including directly on events, attached as workflow nodes, inherited from categories, or inherited from your global configuration file (a.k.a "universal" limits).

In some cases when multiple limits of the same type are present for a job, only one limit will apply.  This is true for [Max Concurrent Jobs](#max-concurrent-jobs), [Max Retry Limit](#max-retry-limit), [Max Queue Limit](#max-queue-limit), and [Max File Limit](#max-file-limit).  For these limits xyOps will pick the first enabled limit it finds of the selected type, with the limits presorted in this order:

- Event defined limits *(highest priority)*
- Workflow limit nodes
- Category inherited limits
- Universal inherited limits *(lowest priority)*

For other limit types, e.g. [Max Run Time](#max-run-time), [Max Output Size](#max-output-size), [Max CPU Limit](#max-cpu-limit) and [Max Memory Limit](#max-memory-limit), when multiple limits are present, all of them are applied.  For example, you may want to emit a warning when a job uses 500MB of memory, but abort the job if the memory usage reaches 1GB.  You can achieve this by adding two separate limits, and they will both be honored.

### Max Run Time

### Max Concurrent Jobs

### Max Output Size

### Max CPU Limit

### Max Memory Limit

### Max Retry Limit

### Max Queue Limit

### Max File Limit
