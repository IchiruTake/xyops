Page.ServerUtils = class ServerUtils extends Page.Base {
	
	showProcessInfo(pid) {
		// pop dialog with process details
		var self = this;
		var html = '';
		var list = this.snapshot.data.processes.list;
		var proc = find_object( list, { pid } );
		if (!proc) return; // sanity
		
		var cmd = '';
		if (proc.path) cmd += proc.path + '/';
		cmd += proc.command;
		if (proc.params) cmd += ' ' + proc.params;
		
		html += '<div class="dialog_box_content maximize" style="width:600px; max-height:75vh; overflow-x:hidden; overflow-y:auto;">';
		
		// command
		html += '<div class="summary_grid single" style="margin-top:10px; margin-bottom:20px;">';
			html += '<div>';
				html += '<div class="info_label">Command</div>';
				html += '<div class="info_value overflow" style="word-break:break-word;">' + cmd + '</div>';
			html += '</div>';
		html += '</div>';
		
		// grid
		html += '<div class="summary_grid triple">';
		
		// pid
		html += '<div>';
			html += '<div class="info_label">Process ID</div>';
			html += '<div class="info_value">' + proc.pid + '</div>';
		html += '</div>';
		
		// parent pid
		if (proc.parentPid) {
			html += '<div>';
				html += '<div class="info_label">Parent PID</div>';
				html += '<div class="info_value"><span class="link" onClick="$P().showProcessInfo(' + proc.parentPid + ')">' + proc.parentPid + '</span></div>';
			html += '</div>';
		}
		
		// user
		html += '<div>';
			html += '<div class="info_label">User</div>';
			html += '<div class="info_value">' + (proc.user || 'n/a') + '</div>';
		html += '</div>';
		
		// cpu
		html += '<div>';
			html += '<div class="info_label">CPU %</div>';
			html += '<div class="info_value">' + short_float(proc.cpu || 0) + '%</div>';
		html += '</div>';
		
		// cpuu (user)
		html += '<div>';
			html += '<div class="info_label">CPU % (User)</div>';
			html += '<div class="info_value">' + short_float(proc.cpuu || 0) + '%</div>';
		html += '</div>';
		
		// cpus (system)
		html += '<div>';
			html += '<div class="info_label">CPU % (System)</div>';
			html += '<div class="info_value">' + short_float(proc.cpus || 0) + '%</div>';
		html += '</div>';
		
		// mem (%)
		html += '<div>';
			html += '<div class="info_label">Memory %</div>';
			html += '<div class="info_value">' + short_float(proc.mem || 0) + '%</div>';
		html += '</div>';
		
		// memVsz (virtual)
		html += '<div>';
			html += '<div class="info_label">Virtual Memory</div>';
			html += '<div class="info_value">' + get_text_from_bytes(proc.memVsz || 0) + '</div>';
		html += '</div>';
		
		// memRss (resident)
		html += '<div>';
			html += '<div class="info_label">Resident Memory</div>';
			html += '<div class="info_value">' + get_text_from_bytes(proc.memRss || 0) + '</div>';
		html += '</div>';
		
		// started (age)
		html += '<div>';
			html += '<div class="info_label">Age</div>';
			html += '<div class="info_value">' + get_text_from_seconds( proc.age || 0, false, true ) + '</div>';
		html += '</div>';
		
		// state
		html += '<div>';
			html += '<div class="info_label">State</div>';
			html += '<div class="info_value">' + ucfirst(proc.state) + '</div>';
		html += '</div>';
		
		// tty
		html += '<div>';
			html += '<div class="info_label">TTY</div>';
			html += '<div class="info_value">' + (proc.tty || 'n/a') + '</div>';
		html += '</div>';
		
		// priority
		html += '<div>';
			html += '<div class="info_label">Priority</div>';
			html += '<div class="info_value">' + (proc.priority || 'n/a') + '</div>';
		html += '</div>';
		
		// nice
		html += '<div>';
			html += '<div class="info_label">Nice</div>';
			html += '<div class="info_value">' + (proc.nice || 'n/a') + '</div>';
		html += '</div>';
		
		if (proc.job) {
			// job id
			html += '<div>';
				html += '<div class="info_label">Job ID</div>';
				html += '<div class="info_value">' + this.getNiceJob(proc.job, true) + '</div>';
			html += '</div>';
			
			// disk
			html += '<div>';
				html += '<div class="info_label">Total I/O</div>';
				html += '<div class="info_value">' + get_text_from_bytes(proc.disk || 0) + '</div>';
			html += '</div>';
			
			// conns
			html += '<div>';
				html += '<div class="info_label">Net Connections</div>';
				html += '<div class="info_value">' + commify(proc.conns || 0) + '</div>';
			html += '</div>';
			
			// net
			html += '<div>';
				html += '<div class="info_label">Net Throughput</div>';
				html += '<div class="info_value">' + get_text_from_bytes(proc.net || 0) + '/sec</div>';
			html += '</div>';
		}
		
		html += '</div>'; // summary_grid
		
		// process family tree
		var rows = [ copy_object(proc) ];
		
		// add children
		var add_children = function(parent, indent) {
			find_objects(list, { parentPid: parent.pid }).forEach( function(proc) {
				rows.push( merge_objects(proc, { indent }) );
				add_children( proc, indent + 1 );
			} );
		};
		add_children( proc, 1 );
		
		// add parents
		var add_parents = function(proc) {
			var parent = find_object(list, { pid: proc.parentPid });
			if (parent) {
				rows.forEach( function(row) { row.indent = (row.indent || 0) + 1; } );
				rows.unshift( copy_object(parent) );
				add_parents(parent);
			}
		};
		add_parents( proc );
		
		if (rows.length > 1) {
			// html += '<div class="dialog_title" style="margin-top:30px; margin-bottom:10px;">Process Family</div>';
			html += '<div style="margin-top:35px;"></div>';
			
			var opts = {
				rows: rows,
				cols: ['Command', 'User', 'PID'],
				data_type: 'process',
				hide_pagination: true
			};
			html += this.getBasicGrid( opts, function(item, idx) {
				var indent_px = Math.floor( (item.indent || 0) * 16 );
				
				var cmd = '<span style="padding-left:' + Math.floor(indent_px - 16) + 'px;">';
				if (indent_px) cmd += '<i class="mdi mdi-subdirectory-arrow-right" style="color:var(--icon-color);">&nbsp;</i>';
				if (item.pid == proc.pid) cmd += '<b>';
				cmd += self.getNiceProcess(item, true);
				if (item.pid == proc.pid) cmd += '</b>';
				cmd += '</span>';
				
				return [
					cmd,
					item.user,
					item.pid
				];
			} ); // grid (procs)
		} // family
		
		html += '</div>'; // wrapper
		
		var buttons_html = "";
		// buttons_html += '<div class="button" onMouseUp="$P().copy_unit_results('+idx+')">Copy to Clipboard</div>';
		buttons_html += '<div class="button primary" onMouseUp="Dialog.confirm_click(true)">Close</div>';
		
		Dialog.showSimpleDialog('Process Details', html, buttons_html);
		
		// special mode for key capture
		Dialog.active = 'confirmation';
		Dialog.confirm_callback = function(result) { 
			if (result) Dialog.hide(); 
		};
	}
	
	getMemDetails(server) {
		// get memory details
		var self = this;
		var data = server.data;
		var html = '';
		var mem = data.memory;
		
		/* "memory": {
			"total": 8318783488,
			"free": 7249416192,
			"used": 1069367296,
			"active": 926904320,
			"available": 7391879168,
			"buffers": 335872,
			"cached": 431300608,
			"slab": 53968896,
			"buffcache": 485605376,
			"swaptotal": 10466258944,
			"swapused": 0,
			"swapfree": 10466258944,
			"writeback": 0,
			"dirty": 102400
		}, */
		
		html += '<div class="dash_donut_grid">';
			html += this.getDonutDashUnit({ value: mem.used, max: mem.total, type: 'bytes', suffix: '', label: 'Used', color: app.colors[2] });
			html += this.getDonutDashUnit({ value: mem.active, max: mem.total, type: 'bytes', suffix: '', label: 'Active', color: app.colors[3] });
			html += this.getDonutDashUnit({ value: mem.available, max: mem.total, type: 'bytes', suffix: '', label: 'Available', color: app.colors[0] });
			html += this.getDonutDashUnit({ value: mem.free, max: mem.total, type: 'bytes', suffix: '', label: 'Free', color: app.colors[1] });
			html += this.getDonutDashUnit({ value: mem.buffers, max: mem.total, type: 'bytes', suffix: '', label: 'Buffered', color: app.colors[4] });
			html += this.getDonutDashUnit({ value: mem.cached, max: mem.total, type: 'bytes', suffix: '', label: 'Cached', color: app.colors[5] });
		html += '</div>';
		
		return html;
	}
	
	getCPUDetails(server) {
		// get table of individual cpu details
		var self = this;
		var data = server.data;
		var html = '';
		var cpu_totals = data.cpu.totals;
		
		html += '<div class="dash_donut_grid">';
			html += this.getDonutDashUnit({ value: cpu_totals.user, max: 100, type: 'float', suffix: '%', label: 'User %', color: app.colors[6] });
			html += this.getDonutDashUnit({ value: cpu_totals.system, max: 100, type: 'float', suffix: '%', label: 'System %', color: app.colors[7] });
			html += this.getDonutDashUnit({ value: cpu_totals.nice, max: 100, type: 'float', suffix: '%', label: 'Nice %', color: app.colors[8] });
			html += this.getDonutDashUnit({ value: cpu_totals.iowait, max: 100, type: 'float', suffix: '%', label: 'I/O Wait %', color: app.colors[9] });
			html += this.getDonutDashUnit({ value: cpu_totals.irq, max: 100, type: 'float', suffix: '%', label: 'Hard IRQ %', color: app.colors[10] });
			html += this.getDonutDashUnit({ value: cpu_totals.softirq, max: 100, type: 'float', suffix: '%', label: 'Soft IRQ %', color: app.colors[11] });
		html += '</div>';
		
		html += '<div style="height:30px;"></div>';
		
		var cpus = (data.cpu && data.cpu.cpus) ? data.cpu.cpus : {};
		var sorted_keys = Object.keys(cpus).sort( function(a, b) {
			return parseInt( a.replace(/^cpu/, '') ) - parseInt( b.replace(/^cpu/, '') );
		} );
		var rows = sorted_keys.map( function(key) { return cpus[key]; } );
		
		var cols = ['CPU #', 'User %', 'System %', 'Nice %', 'I/O Wait %', 'Hard IRQ %', 'Soft IRQ %', 'Total %'];
		
		var grid_args = {
			rows: rows,
			cols: cols,
			data_type: 'cpu'
		};
		
		html += this.getBasicGrid( grid_args, function(item, idx) {
			return [
				'#' + Math.floor(idx + 1),
				short_float(item.user) + '%',
				short_float(item.system) + '%',
				short_float(item.nice) + '%',
				short_float(item.iowait) + '%',
				short_float(item.irq) + '%',
				short_float(item.softirq) + '%',
				self.getNiceProgressBar( (100 - item.idle) / 100, 'static', true )
			];
		}); // grid
		
		return html;
	}
	
	getMonitorGrid(server) {
		// get grid of monitor dash units, sorted
		var self = this;
		var data = server.data;
		var html = '';
		
		app.monitors.forEach( function(mon_def) {
			if (!mon_def.display) return;
			if (mon_def.groups.length && !app.includesAny(mon_def.groups, server.groups)) return;
			
			var label = mon_def.title
				.replace(/\b(Total)\b/g, '')
				.replace(/\b(Average)\b/g, 'Avg')
				.replace(/\b(Operations)\b/g, 'Ops')
				// .replace(/\b(Network)\b/g, 'Net')
				.replace(/\b(Connections)\b/g, 'Conns')
				.replace(/\b(Available)\b/g, 'Avail')
				.replace(/\b(Memory)\b/g, 'Mem')
				// .replace(/\b(Processes)\b/g, 'Procs')
				.replace(/\(.+\)/g, '')
				.replace(/\%/g, '')
				.replace(/\s+/g, ' ').trim();
			
			var value = (mon_def.delta ? data.deltas[mon_def.id] : data.monitors[mon_def.id]) || 0;
			var value_disp = self.getDashValue(value, mon_def.data_type, mon_def.suffix);
			
			html += '<div class="dash_unit_box">';
				html += '<div class="dash_unit_value">' + value_disp + '</div>';
				html += '<div class="dash_unit_label">' + label + '</div>';
			html += '</div>';
		} );
		
		return html;
	}
	
	getDashValue(value, type, suffix) {
		// format number value for dashboard units
		var value_disp = '';
		
		switch (type) {
			case 'integer': value_disp = this.getNiceDashNumber(value); break;
			case 'float': value_disp = short_float(value); break;
			case 'bytes': value_disp = get_text_from_bytes_dash(value); break;
			case 'seconds': value_disp = get_text_from_seconds_round(value, 2); break;
			case 'milliseconds': value_disp = get_text_from_ms_round(value, 2); break;
		} // switch data_type
		
		if (suffix) value_disp += suffix.replace(/^\s*\/(\w)\w+$/, '/$1');
		
		return value_disp;
	}
	
	getDonutDashUnit(opts) {
		// get donut dash unit
		// opts: { value, max, type, suffix, label, color }
		var html = '';
		var amount = opts.value / (opts.max || 1);
		var pct = amount * 100;
		var value_disp = this.getDashValue(opts.value, opts.type, opts.suffix);
		
		html += '<div class="dash_donut_container">';
			html += '<div class="dash_donut_image" style="background-image:conic-gradient( ' + opts.color + ' ' + pct + '%, var(--border-color) 0);">';
				html += '<div class="dash_donut_overlay"></div>';
				html += '<div class="dash_donut_value">' + value_disp + '</div>';
				html += '<div class="dash_donut_label">' + opts.label + '</div>';
			html += '</div>';
			// html += '<div class="dash_donut_label">' + opts.label + '</div>';
		html += '</div>';
		
		return html;
	}
	
	renderSnapshotAlerts() {
		// render details on snapshot alerts
		var self = this;
		
		// make sure page is still active (API may be slow)
		if (!this.active) return;
		
		if (!this.alerts || !this.alerts.length) {
			$('#d_vs_alerts').hide();
			return;
		}
		
		var alerts = this.alerts;
		var cols = ["Alert ID", "Title", "Message", "Server", "Status", "Started", "Duration"];
		var html = '';
		
		var grid_args = {
			rows: alerts,
			cols: cols,
			data_type: 'alert'
		};
		
		html += this.getBasicGrid( grid_args, function(item, idx) {
			return [
				'<b>' + self.getNiceAlertID(item, true) + '</b>',
				self.getNiceAlert(item.alert, true),
				item.message,
				self.getNiceServer(item.server, true),
				self.getNiceAlertStatus(item),
				self.getNiceDateTime(item.date),
				self.getNiceAlertElapsedTime(item, true, true)
			];
		}); // grid
		
		this.div.find('#d_vs_alerts > div.box_content').html( html );
		this.div.find('#d_vs_alerts').show();
	}
	
	renderSnapshotJobs() {
		// render snapshot jobs
		var self = this;
		var html = '';
		
		// make sure page is still active (API may be slow)
		if (!this.active) return;
		
		var grid_args = {
			rows: this.jobs,
			cols: ['Job ID', 'Server', 'Source', 'Started', 'Elapsed', 'Avg CPU/Mem', 'Result'],
			data_type: 'job',
			class: 'data_grid job_history_grid'
		};
		
		html += this.getBasicGrid( grid_args, function(job, idx) {
			return [
				'<b>' + self.getNiceJob(job.id, true) + '</b>',
				self.getNiceServer(job.server, true),
				self.getNiceJobSource(job),
				self.getShortDateTime( job.started ),
				self.getNiceJobElapsedTime(job, true),
				self.getNiceJobAvgCPU(job) + ' / ' + self.getNiceJobAvgMem(job),
				self.getNiceJobResult(job),
				// '<a href="#Job?id=' + job.id + '">Details</a>'
			];
		} );
		
		this.div.find('#d_vs_jobs > .box_content').html( html );
		this.div.find('#d_vs_jobs').show();
	}
	
	getProcessTable(snapshot) {
		// get initial html for sortable proc table
		var self = this;
		
		var proc_opts = {
			id: 't_snap_procs',
			item_name: 'process',
			sort_by: 'cpu',
			sort_dir: -1,
			filter: '',
			column_ids: ['command', 'user', 'pid', 'parentPid', 'cpu', 'memRss', 'age', 'state'],
			column_labels: ['Command', 'User', 'PID', 'Parent', 'CPU', 'Memory', 'Age', 'State']
		};
		
		return this.getSortableTable( snapshot.data.processes.list, proc_opts, function(proc) {
			return [
				'<b>' + self.getNiceProcess(proc, true) + '</b>',
				proc.user,
				'<span class="link" onClick="$P().showProcessInfo(' + proc.pid + ')">' + proc.pid + '</span>',
				proc.parentPid ? ('<span class="link" onClick="$P().showProcessInfo(' + proc.parentPid + ')">' + proc.parentPid + '</span>') : 'n/a',
				pct( proc.cpu, 100 ),
				get_text_from_bytes( proc.memRss ),
				get_text_from_seconds( proc.age || 0, true, true ),
				ucfirst(proc.state || 'unknown')
			];
		});
	}
	
	getConnectionTable(snapshot) {
		// get initial html for sortable conn table
		var self = this;
		
		var conn_opts = {
			id: 't_snap_conns',
			item_name: 'connection',
			sort_by: 'state',
			sort_dir: 1,
			filter: '',
			column_ids: ['state', 'type', 'local_addr', 'remote_addr', 'command', 'bytes_in', 'bytes_out'],
			column_labels: ['State', 'Protocol', 'Local Address', 'Remote Address', 'Process', 'Bytes In', 'Bytes Out']
		};
		
		return this.getSortableTable( snapshot.data.conns, conn_opts, function(conn) {
			var nice_state = conn.state.toString().split(/_/).map( function(word) { return ucfirst(word); } ).join(' ');
			var proc = conn.pid ? find_object(snapshot.data.processes.list, { pid: conn.pid }) : null;
			return [
				'<i class="mdi mdi-network-outline">&nbsp;</i>' + nice_state,
				conn.type.toUpperCase(),
				conn.local_addr,
				conn.remote_addr,
				proc ? self.getNiceProcess(proc, true) : (conn.pid || '(None)'),
				get_text_from_bytes( conn.bytes_in || 0 ),
				get_text_from_bytes( conn.bytes_out || 0 )
			];
		});
	}
	
	getInterfaceTable(snapshot) {
		// get initial html for sortable iface table
		var self = this;
		
		var iface_opts = {
			id: 't_snap_ifaces',
			item_name: 'interface',
			sort_by: 'iface',
			sort_dir: 1,
			filter: '',
			column_ids: ['iface', 'ip4', 'ip6', 'operstate', 'type', 'speed', 'rx_sec', 'tx_sec'],
			column_labels: ['Name', 'IPv4', 'IPv6', 'State', 'Type', 'Speed', 'Bytes In', 'Bytes Out']
		};
		
		return this.getSortableTable( Object.values(snapshot.data.interfaces), iface_opts, function(iface) {
			var nice_speed = 'n/a';
			if (iface.speed && (iface.speed >= 1000000)) nice_speed = Math.floor(iface.speed / 1000000) + ' Tb';
			else if (iface.speed && (iface.speed >= 1000)) nice_speed = Math.floor(iface.speed / 1000) + ' Gb';
			else if (iface.speed) nice_speed = iface_speed + ' Mb';
			
			return [
				'<i class="mdi mdi-lan">&nbsp;</i>' + iface.iface,
				iface.ip4 || 'n/a',
				iface.ip6 || 'n/a',
				ucfirst(iface.operstate || 'Unknown'),
				ucfirst(iface.type || 'Unknown'),
				nice_speed,
				get_text_from_bytes( iface.rx_sec || 0 ) + '/sec',
				get_text_from_bytes( iface.tx_sec || 0 ) + '/sec'
			];
		});
	}
	
	getMountTable(snapshot) {
		// get initial html for sortable mount table
		var self = this;
		
		var fs_opts = {
			id: 't_snap_fs',
			item_name: 'mount',
			sort_by: 'mount',
			sort_dir: 1,
			filter: '',
			column_ids: ['mount', 'type', 'fs', 'size', 'used', 'avail', 'use'],
			column_labels: ['Mount Point', 'Type', 'Device', 'Total Size', 'Used', 'Available', 'Use %']
		};
		
		return this.getSortableTable( Object.values(snapshot.data.mounts), fs_opts, function(item) {
			return [
				'<span class=""><i class="mdi mdi-harddisk">&nbsp;</i>' + item.mount + '</span>',
				item.type,
				item.fs,
				get_text_from_bytes( item.size ),
				get_text_from_bytes( item.used ),
				get_text_from_bytes( item.available ),
				self.getNiceProgressBar( item.use / 100, 'static', true )
			];
		});
	}
	
	//
	// Sortble grid stuff -- might move to base if used elsewhere...
	//
	
	getSortedTableRows(id) {
		// get sorted (and filtered!) table rows
		var opts = this.tables[id];
		var filter_re = new RegExp( escape_regexp(opts.filter) || '.*', 'i' );
		var sort_by = opts.sort_by;
		var sort_dir = opts.sort_dir;
		var sort_type = 'number';
		if (opts.rows.length && (typeof(opts.rows[0][sort_by]) == 'string')) sort_type = 'string';
		
		// apply filter
		var rows = opts.rows.filter( function(row) {
			var blob = hash_values_to_array(row).join(' ');
			return !!blob.match( filter_re );
		} );
		
		// apply custom sort
		rows.sort( function(a, b) {
			if (sort_type == 'number') {
				return( (a[sort_by] - b[sort_by]) * sort_dir );
			}
			else {
				return( a[sort_by].toString().localeCompare(b[sort_by]) * sort_dir );
			}
		});
		
		return rows;
	}
	
	updateTableRows(id, rows) {
		// replace sorted table rows, redraw
		var opts = this.tables[id];
		opts.rows = rows;
		
		var disp_rows = this.getSortedTableRows( opts.id );
		
		// redraw pagination thing
		this.div.find('#st_hinfo_' + opts.id).html(
			this.getTableHeaderInfo(id, disp_rows) 
		);
		
		// redraw rows
		this.div.find('#st_' + opts.id).html( 
			this.getTableColumnHTML( opts.id ) + 
			this.getTableContentHTML( opts.id, disp_rows ) 
		);
	}
	
	applyTableFilter(elem) {
		// key typed in table filter box, redraw
		var id = $(elem).data('id');
		var opts = this.tables[id];
		opts.filter = $(elem).val();
		
		var disp_rows = this.getSortedTableRows( opts.id );
		
		// redraw pagination thing
		this.div.find('#st_hinfo_' + opts.id).html(
			this.getTableHeaderInfo(id, disp_rows) 
		);
		
		// redraw rows
		this.div.find('#st_' + opts.id).html( 
			this.getTableColumnHTML( opts.id ) + 
			this.getTableContentHTML( opts.id, disp_rows ) 
		);
	}
	
	getTableHeaderInfo(id, disp_rows) {
		// construct HTML for sortable table header info widget
		var opts = this.tables[id];
		var rows = opts.rows;
		var html = '';
		
		if (disp_rows.length < rows.length) {
			html += commify(disp_rows.length) + ' of ' + commify(rows.length) + ' ' + pluralize(opts.item_name, rows.length) + '';
		}
		else {
			html += commify(rows.length) + ' ' + pluralize(opts.item_name, rows.length) + '';
		}
		
		var bold_idx = opts.column_ids.indexOf( opts.sort_by );
		html += ', sorted by ' + opts.column_labels[bold_idx] + '';
		html += ' <i class="mdi mdi-menu-' + ((opts.sort_dir == 1) ? 'up' : 'down') + '"></i>';
		// html += ((opts.sort_dir == 1) ? ' ascending' : ' descending');
		
		return html;
	}
	
	getTableColumnHTML(id) {
		// construct HTML for sortable table column headers (THs)
		var opts = this.tables[id];
		var html = '';
		html += '<ul class="grid_row_header">';
		
		opts.column_ids.forEach( function(col_id, idx) {
			var col_label = opts.column_labels[idx];
			var classes = ['st_col_header'];
			var icon = '';
			if (col_id == opts.sort_by) {
				classes.push('active');
				icon = ' <i class="mdi mdi-menu-' + ((opts.sort_dir == 1) ? 'up' : 'down') + '"></i>';
			}
			html += '<div class="' + classes.join(' ') + '" data-id="' + opts.id + '" data-col="' + col_id + '" onMouseUp="$P().toggleTableSort(this)">' + col_label + icon + '</div>';
		});
		
		html += '</ul>';
		return html;
	}
	
	getTableContentHTML(id, disp_rows) {
		// construct HTML for sortable table content (rows)
		var opts = this.tables[id];
		var html = '';
		var bold_idx = opts.column_ids.indexOf( opts.sort_by );
		
		for (var idx = 0, len = disp_rows.length; idx < len; idx++) {
			var row = disp_rows[idx];
			var tds = opts.callback(row, idx);
			html += '<ul class="grid_row">';
			for (var idy = 0, ley = tds.length; idy < ley; idy++) {
				html += '<div' + ((bold_idx == idy) ? ' style="font-weight:bold"' : '') + '>' + tds[idy] + '</div>';
			}
			// html += '<td>' + tds.join('</td><td>') + '</td>';
			html += '</ul>';
		} // foreach row
		
		if (!disp_rows.length) {
			html += '<ul class="grid_row_empty"><div style="grid-column-start: span ' + opts.column_ids.length + ';">';
			html += 'No '+pluralize(opts.item_name)+' found.';
			html += '</div></ul>';
		}
		
		return html;
	}
	
	toggleTableSort(elem) {
		var id = $(elem).data('id');
		var col_id = $(elem).data('col');
		var opts = this.tables[id];
		
		// swap sort dir or change sort column
		if (col_id == opts.sort_by) {
			// swap dir
			opts.sort_dir *= -1;
		}
		else {
			// same sort dir but change column
			opts.sort_by = col_id;
		}
		
		var disp_rows = this.getSortedTableRows( opts.id );
		
		// redraw pagination thing
		this.div.find('#st_hinfo_' + opts.id).html(
			this.getTableHeaderInfo(id, disp_rows) 
		);
		
		// redraw grid
		this.div.find('#st_' + opts.id).html( 
			this.getTableColumnHTML(id) + 
			this.getTableContentHTML( opts.id, disp_rows ) 
		);
	}
	
	getSortableTable(rows, opts, callback) {
		// get HTML for sortable and filterable table
		var self = this;
		var html = '';
		
		// save in page for resort / filtering
		if (!this.tables) this.tables = {};
		opts.rows = rows;
		opts.callback = callback;
		this.tables[ opts.id ] = opts;
		
		var disp_rows = this.getSortedTableRows( opts.id );
		
		if (!opts.hide_pagination) {
			// pagination
			html += '<div class="data_grid_pagination">';
			
				html += '<div style="text-align:left" id="st_hinfo_' + opts.id + '">';
					html += this.getTableHeaderInfo( opts.id, disp_rows );
				html += '</div>';
				
				html += '<div style="text-align:center">';
					html += '&nbsp;';
				html += '</div>';
				
				html += '<div style="text-align:right">';
					html += 'Page 1 of 1';
				html += '</div>';
			
			html += '</div>';
			
			html += '<div style="margin-top:5px;">';
		}
		else {
			// no pagination
			html += '<div>';
		}
		
		var tattrs = opts.attribs || {};
		if (opts.class) tattrs.class = opts.class;
		if (!tattrs.class) {
			tattrs.class = 'data_grid';
			if (opts.item_name.match(/^\w+$/)) tattrs.class += ' ' + opts.item_name + '_grid';
		}
		if (!tattrs.style) tattrs.style = '';
		tattrs.style += 'grid-template-columns: repeat(' + opts.column_ids.length + ', auto);';
		html += '<div id="st_' + opts.id + '" ' + compose_attribs(tattrs) + '>';
		
			html += this.getTableColumnHTML( opts.id );
			html += this.getTableContentHTML( opts.id, disp_rows );
		
		html += '</div>'; // scroll wrapper
		html += '</div>'; // grid
		
		return html;
	}
	
	// 
	// Date/Time stuff for historical views
	// 
	
	chooseHistoricalView() {
		// show dialog to select historical view for server
		var self = this;
		var args = this.args;
		var title = "View Historical Server Data";
		var btn = "Apply Changes";
		
		var html = '<div class="dialog_box_content maximize" style="width:400px; max-height:75vh; overflow-x:hidden; overflow-y:auto;">';
		
		if (!args.mode) {
			// default to "today" daily view, or whatever day snap was taken
			var dargs = get_date_args( this.snapshot ? this.snapshot.date : time_now() );
			args.mode = 'daily';
			args.year = dargs.year;
			args.month = dargs.mon; // this is already 1-based
			args.day = dargs.mday;
			args.limit = 1;
		}
		
		// timing mode
		html += this.getFormRow({
			id: 'd_esh_mode',
			label: 'Zoom Level:',
			content: this.getFormMenuSingle({
				id: 'fe_esh_mode',
				title: "Select Zoom Level",
				options: [ 
					{ id: 'yearly', title: "Yearly", icon: 'earth' },
					{ id: 'monthly', title: "Monthly", icon: 'calendar-month-outline' },
					{ id: 'daily', title: "Daily", icon: 'calendar-today-outline' },
					{ id: 'hourly', title: "Hourly", icon: 'clock-outline' }
				],
				value: args.mode,
				'data-shrinkwrap': 1
			}),
			caption: 'Select the desired zoom level for the timeline view.'
		});
		
		// year
		html += this.getFormRow({
			id: 'd_esh_year',
			label: 'Year:',
			content: this.getFormMenuSingle({
				id: 'fe_esh_year',
				title: 'Select Year',
				options: this.getYearOptions(),
				value: args.year || '',
				'data-shrinkwrap': 1
			})
		});
		
		// month
		html += this.getFormRow({
			id: 'd_esh_month',
			label: 'Month:',
			content: this.getFormMenuSingle({
				id: 'fe_esh_month',
				title: 'Select Month',
				options: this.getMonthOptions(),
				value: args.month || '',
				'data-shrinkwrap': 1
			})
		});
		
		// day
		html += this.getFormRow({
			id: 'd_esh_day',
			label: 'Day:',
			content: this.getFormMenuSingle({
				id: 'fe_esh_day',
				title: 'Select Day',
				options: this.getDayOptions(),
				value: args.day || '',
				'data-shrinkwrap': 1
			})
		});
		
		// hour
		html += this.getFormRow({
			id: 'd_esh_hour',
			label: 'Hour:',
			content: this.getFormMenuSingle({
				id: 'fe_esh_hour',
				title: 'Select Hour',
				options: this.getHourOptions(),
				value: args.hour || '',
				'data-shrinkwrap': 1
			})
		});
		
		// limit
		html += this.getFormRow({
			id: 'd_esh_limit',
			label: 'Limit:',
			content: this.getFormMenuSingle({
				id: 'fe_esh_limit',
				title: 'Select Limit',
				options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
				value: args.limit || '',
				'data-shrinkwrap': 1
			})
		});
		
		html += '</div>';
		Dialog.confirm( title, html, btn, function(result) {
			if (!result) return;
			app.clearError();
			
			args.mode = $('#fe_esh_mode').val();
			args.limit = parseInt( $('#fe_esh_limit').val() );
			
			switch (args.mode) {
				case 'yearly':
					args.year = parseInt( $('#fe_esh_year').val() );
					delete args.month;
					delete args.day;
					delete args.hour;
				break;
				
				case 'monthly':
					args.year = parseInt( $('#fe_esh_year').val() );
					args.month = parseInt( $('#fe_esh_month').val() );
					delete args.day;
					delete args.hour;
				break;
				
				case 'daily':
					args.year = parseInt( $('#fe_esh_year').val() );
					args.month = parseInt( $('#fe_esh_month').val() );
					args.day = parseInt( $('#fe_esh_day').val() );
					delete args.hour;
				break;
				
				case 'hourly':
					args.year = parseInt( $('#fe_esh_year').val() );
					args.month = parseInt( $('#fe_esh_month').val() );
					args.day = parseInt( $('#fe_esh_day').val() );
					args.hour = parseInt( $('#fe_esh_hour').val() );
				break;
			} // switch mode
			
			Dialog.hide();
			Nav.go( '#ServerHist' + compose_query_string(args) );
			
		}); // Dialog.confirm
		
		var change_mode = function(new_mode) {
			// $('.dialog_box_content .form_row').hide();
			// $('#d_esh_mode').show();
			
			switch (new_mode) {
				case 'yearly':
					$('#d_esh_year').show();
					$('#d_esh_month').hide();
					$('#d_esh_day').hide();
					$('#d_esh_hour').hide();
					$('#d_esh_limit > .fr_label').html( 'Number of Years:' );
				break;
				
				case 'monthly':
					$('#d_esh_year').show();
					$('#d_esh_month').show();
					$('#d_esh_day').hide();
					$('#d_esh_hour').hide();
					$('#d_esh_limit > .fr_label').html( 'Number of Months:' );
				break;
				
				case 'daily':
					$('#d_esh_year').show();
					$('#d_esh_month').show();
					$('#d_esh_day').show();
					$('#d_esh_hour').hide();
					$('#d_esh_limit > .fr_label').html( 'Number of Days:' );
				break;
				
				case 'hourly':
					$('#d_esh_year').show();
					$('#d_esh_month').show();
					$('#d_esh_day').show();
					$('#d_esh_hour').show();
					$('#d_esh_limit > .fr_label').html( 'Number of Hours:' );
				break;
			} // switch new_mode
			
			app.clearError();
			Dialog.autoResize();
		}; // change_mode
		
		$('#fe_esh_mode').on('change', function() {
			change_mode( $(this).val() );
			$('#fe_esh_limit').val(1);
		}); // type change
		
		SingleSelect.init( $('#fe_esh_mode, #fe_esh_year, #fe_esh_month, #fe_esh_day, #fe_esh_hour, #fe_esh_limit') );
		
		change_mode( args.mode );
	}
	
	getYearOptions() {
		// get locale-formatted year numbers for menu
		var start_year = yyyy( this.server.created );
		var cur_year = yyyy();
		var options = [];
		
		for (var year = start_year; year <= cur_year; year++) {
			var date = new Date( year, 5, 15, 12, 30, 30, 0 );
			var label = this.formatDate( date.getTime() / 1000, { year: 'numeric' } );
			options.push([ ''+year, label ]);
		}
		
		return options;
	}
	
	getMonthOptions() {
		// get locale-formatted month names for menu
		var cur_year = yyyy();
		var options = [];
		
		for (var month = 1; month <= 12; month++) {
			var date = new Date( cur_year, month - 1, 15, 12, 30, 30, 0 );
			// var label = this.formatDate( date.getTime() / 1000, { month: 'short' } );
			// options.push([ ''+month, label ]);
			options.push({
				id: '' + month,
				title: this.formatDate( date.getTime() / 1000, { month: 'long' } ),
				abbrev: this.formatDate( date.getTime() / 1000, { month: 'short' } )
			});
		}
		
		return options;
	}
	
	getDayOptions() {
		// get locale-formatted month days for a 31-day month
		var cur_year = yyyy();
		var options = [];
		
		var date = new Date( cur_year, 6, 1, 12, 30, 30, 0 );
		var num = 1;
		while (options.length < 31) {
			var label = this.formatDate( date.getTime() / 1000, { day: 'numeric', timeZone: false } );
			options.push([ ''+num, label ]);
			date.setTime( date.getTime() + 86400000 );
			num++;
		}
		
		return options;
	}
	
	getHourOptions() {
		// get locale-formatted hours for a full day
		var cur_year = yyyy();
		var options = [];
		
		var date = new Date( cur_year, 6, 1, 0, 30, 30, 0 );
		while (options.length < 24) {
			var label = this.formatDate( date.getTime() / 1000, { hour: 'numeric', timeZone: false } );
			options.push([ ''+options.length, label ]);
			date.setTime( date.getTime() + 3600000 );
		}
		
		return options;
	}
	
	applyMonitorFilter(elem) {
		// hide or show specific monitors based on substring match on title
		var filter = this.monitorFilter = $(elem).val();
		var re = new RegExp( escape_regexp(filter), 'i' );
		
		for (var key in this.charts) {
			var chart = this.charts[key];
			if (!chart._quick) {
				var $cont = $(chart.canvas).parent();
				if (chart.title.match(re)) $cont.show();
				else $cont.hide();
			}
		}
	}
	
};
