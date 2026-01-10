#!/bin/bash

# Start xyOps inside a container
# Append common PATHs
# Delete old PID file, and use exec to replace current process
# Support NODE_MAX_MEMORY

# add some common path locations
export PATH=$PATH:/usr/bin:/bin:/usr/local/bin:/usr/sbin:/sbin:/usr/local/sbin:$HOME/.local/bin

# home directory
HOMEDIR="$(dirname "$(cd -- "$(dirname "$0")" && (pwd -P 2>/dev/null || pwd))")"
cd $HOMEDIR

# bootstrap config on first run
if [ ! -f /opt/xyops/conf/config.json ]; then
	echo "Initializing config directory..."
	mkdir -p /opt/xyops/conf
	cp -a /opt/xyops/sample_conf/. /opt/xyops/conf/
fi

# the path to xyops entrypoint, including options
BINARY="node --max-old-space-size=${NODE_MAX_MEMORY:-4096} $HOMEDIR/lib/main.js --foreground"

# the path to the PID file
PIDFILE=$HOMEDIR/logs/xyops.pid

# delete old pid file
rm -f $PIDFILE

# start xyops, replace current process
exec $BINARY
