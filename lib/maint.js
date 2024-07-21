// Orchestra Maintenance Layer
// Copyright (c) 2021 - 2024 Joseph Huckaby

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const cp = require("child_process");
const zlib = require('zlib');
const async = require('async');
const Path = require('path');
const Tools = require("pixl-tools");
const Request = require("pixl-request");

const glob = Tools.glob;

class Maintenance {
	
	setupMaint() {
		// setup stat tracking system
		var self = this;
		
		this.stats = {
			file: Path.join( this.config.get('log_dir'), "stats.json" ),
			currentMinute: {},
			lastMinute: {},
			currentDay: { 
				timeStart: Tools.timeNow(true),
				transactions: {},
				servers: {}
			},
			mem: 0,
			cpu: 0
		};
		
		// Note: this is during startup, so it's okay to use the fs *sync functions.
		if (fs.existsSync(this.stats.file)) try {
			var temp = JSON.parse( fs.readFileSync(this.stats.file, 'utf8') );
			this.stats.currentDay = temp.currentDay;
			if (!this.stats.currentDay.transactions) this.stats.currentDay.transactions = {};
			if (!this.stats.currentDay.servers) this.stats.currentDay.servers = {};
		} catch(e) {;}
		
		// prime this for repeated calls (delta)
		this.stats.lastCPU = process.cpuUsage();
		
		// listen for ticks and minutes for maint system
		this.server.on('tick', this.maintSecond.bind(this));
		this.server.on('minute', this.maintMinute.bind(this));
		
		this.server.on('day', function() {
			self.maintReset();
		});
	}
	
	updateDailyStat(key, delta = 1) {
		// update daily transaction stat, e.g. user_login
		if (!this.master) return;
		this.stats.currentDay.transactions[key] = (this.stats.currentDay.transactions[key] || 0) + delta;
	}
	
	updateDailyServerStat(server_id, key, delta = 1) {
		// update daily server stat, e.g. job_something
		if (!this.master) return;
		if (!this.stats.currentDay.servers) this.stats.currentDay.servers = {};
		if (!this.stats.currentDay.servers[server_id]) this.stats.currentDay.servers[server_id] = {};
		this.stats.currentDay.servers[server_id][key] = (this.stats.currentDay.servers[server_id][key] || 0) + delta;
	}
	
	maintSecond() {
		// grab real-time stats from web server and accumulate in currentMinute
		if (!this.master) return;
		var web_stats = this.web.getStats();
		var minute = this.stats.currentMinute;
		
		if (!web_stats.stats) web_stats.stats = {};
		if (!web_stats.stats.total) web_stats.stats.total = {};
		if (!web_stats.queue) web_stats.queue = {};
		
		minute.sockets = (minute.sockets || 0) + (web_stats.stats.num_sockets || 0);
		minute.requests = (minute.requests || 0) + (web_stats.stats.num_requests || 0);
		minute.bytes_in = (minute.bytes_in || 0) + (web_stats.stats.bytes_in || 0);
		minute.bytes_out = (minute.bytes_out || 0) + (web_stats.stats.bytes_out || 0);
		minute.avg_elapsed = (minute.avg_elapsed || 0) + (web_stats.stats.total.avg || 0);
		minute.running = (minute.running || 0) + (web_stats.queue.running || 0);
		minute.pending = (minute.pending || 0) + (web_stats.queue.pending || 0);
		minute.count = (minute.count || 0) + 1;
	}
	
	maintMinute() {
		// copy select values to daily
		if (!this.master) {
			// we are not master, so send basic stats to master every minute
			if (this.masterSocket) this.masterSocket.send('update', {
				stats: this.getBasicServerStats()
			});
			return;
		}
		
		var self = this;
		var minute = this.stats.currentMinute;
		var day = this.stats.currentDay;
		
		// day totals
		['requests', 'bytes_in', 'bytes_out'].forEach( function(key) {
			day[key] = (day[key] || 0) + (minute[key] || 0);
		} );
		
		// calc sec averages for performa
		for (var key in minute) {
			minute[key] = Math.floor( minute[key] / (minute.count || 1) );
		}
		
		// add current server mem/cpu
		var cpu = process.cpuUsage( this.stats.lastCPU );
		this.stats.lastCPU = cpu;
		
		this.stats.mem = process.memoryUsage.rss();
		this.stats.cpu = ((cpu.user + cpu.system) / 600000000) * 100; // percent of one core
		this.stats.load = (os.loadavg())[0];
		this.stats.started = this.server.started;
		
		// add misc other stats
		this.stats.unbase = this.unbase.getStats();
		if (this.storage.engine.cache) {
			this.stats.cache = this.storage.engine.cache.getStats();
		}
		
		// rollover minute stats into lastMinute, reset for next minute
		this.stats.lastMinute = minute;
		this.stats.currentMinute = {};
		
		// save stats to disk
		fs.writeFile( self.stats.file, JSON.stringify(self.stats), function(err) {
			if (err) self.logError('stats', "Failed to write stats file: " + self.stats.file + ": " + err);
		});
		
		// broadcast stats to all users every minute
		this.doUserBroadcastAll( 'update', { stats: this.stats } );
		
		// send peer update to all user sockets
		this.broadcastPeerUpdate();
	}
	
	maintReset() {
		// daily stat reset
		if (!this.master) return;
		this.stats.currentDay = {
			timeStart: Tools.timeNow(true),
			transactions: {},
			servers: {}
		};
	}
	
	runMaintenance() {
		// run all daily maintenance bits
		if (!this.master) return;
		async.series([
			this.runListMaintenance.bind(this)
		]);
	}
	
	runListMaintenance(callback) {
		// run nightly storage maint, then proceed to DB maint
		var self = this;
		if (this.server.shut) return process.nextTick(callback);
		
		var max_rows = this.config.get('list_row_max') || 0;
		if (!max_rows) return process.nextTick( callback );
		
		var list_paths = ['logs/activity'];
		
		async.eachSeries( list_paths, 
			function(list_path, callback) {
				// iterator function, work on single list
				self.storage.listGetInfo( list_path, function(err, info) {
					// list may not exist, skip if so
					if (err) return callback();
					
					// check list length
					if (info.length > max_rows) {
						// list has grown too long, needs a trim
						self.logDebug(5, "Nightly maint: List " + list_path + " has grown too long, trimming to max: " + max_rows, info);
						self.storage.listSplice( list_path, max_rows, info.length - max_rows, null, callback );
					}
					else {
						// no trim needed, proceed to next list
						callback();
					}
				} ); // get list info
			}, // iterator
			function(err) {
				if (err) {
					self.logError('maint', "Failed to trim lists: " + err);
				}
				
				// done with maint
				self.logDebug(4, "List maintenance complete");
				callback();
			} // complete
		); // eachSeries
	}
	
	archiveLogs() {
		// archive all logs (called once daily at midnight)
		// log_archive_storage: { enabled, key_template, expiration }
		var self = this;
		var src_spec = this.config.get('log_dir') + '/*.log';
		
		if (this.config.get('log_archive_path')) {
			// archive to filesystem (not storage)
			var dest_path = this.config.get('log_archive_path');
			this.logDebug(4, "Archiving logs: " + src_spec + " to: " + dest_path);
			
			// generate time label from previous day, so just subtracting 30 minutes to be safe
			var epoch = Tools.timeNow(true) - 1800;
			
			this.logger.archive(src_spec, dest_path, epoch, function(err) {
				if (err) self.logError('maint', "Failed to archive logs: " + err);
				else self.logDebug(4, "Log archival complete");
			});
			
			return;
		}
		
		// archive to storage (i.e. S3, etc.)
		var arch_conf = this.config.get('log_archive_storage');
		if (!arch_conf || !arch_conf.enabled) return;
		
		var exp_date = 0;
		if (arch_conf.expiration) {
			exp_date = Tools.timeNow() + Tools.getSecondsFromText( arch_conf.expiration );
		}
		
		this.logDebug(4, "Archiving logs: " + src_spec + " to: " + arch_conf.key_template, arch_conf);
		
		// generate time label from previous day, so just subtracting 30 minutes to be safe
		var epoch = Tools.timeNow(true) - 1800;
		
		// fill date/time placeholders
		var dargs = Tools.getDateArgs( epoch );
		
		glob(src_spec, {}, function (err, files) {
			if (err) return callback(err);
			
			// got files
			if (files && files.length) {
				async.eachSeries( files, function(src_file, callback) {
					// foreach file
					
					// add filename to args
					dargs.filename = Path.basename(src_file).replace(/\.\w+$/, '');
					
					// construct final storage key
					var storage_key = Tools.sub( arch_conf.key_template, dargs );
					self.logDebug(5, "Archiving log: " + src_file + " to: " + storage_key);
					
					// rename local log first
					var src_temp_file = src_file + '.' + Tools.generateShortID() + '.tmp';
					
					fs.rename(src_file, src_temp_file, function(err) {
						if (err) {
							return callback( new Error("Failed to rename: " + src_file + " to: " + src_temp_file + ": " + err) );
						}
						
						if (storage_key.match(/\.gz$/i)) {
							// gzip the log archive
							var gzip = zlib.createGzip();
							var inp = fs.createReadStream( src_temp_file );
							var outp = fs.createWriteStream( src_temp_file + '.gz' );
							
							inp.pipe(gzip).pipe(outp).on( 'finish', function() {
								// compression complete, delete first temp file in background
								fs.unlink( src_temp_file, function(err) {
									self.logError('maint', "Failed to delete temp file: " + src_temp_file + ": " + err);
								} );
								
								self.storage.putStream( storage_key, fs.createReadStream(src_temp_file + '.gz'), function(err) {
									// all done, delete gz temp file in background
									fs.unlink( src_temp_file + '.gz', function() {
										self.logError('maint', "Failed to delete temp file: " + src_temp_file + ".gz: " + err);
									} );
									
									if (err) return callback(err);
									if (exp_date) self.storage.expire( storage_key, exp_date );
									callback();
								}); // putStream
							} ); // pipes
						} // gzip
						else {
							// straight copy (no compress)
							var inp = fs.createReadStream( src_temp_file );
							
							self.storage.putStream( storage_key, inp, function(err) {
								// all done, delete temp file
								fs.unlink( src_temp_file, function(ul_err) {
									if (ul_err) self.logError('maint', "Failed to delete temp file: " + src_temp_file + ": " + ul_err);
									if (err) return callback(err);
									if (exp_date) self.storage.expire( storage_key, exp_date );
									callback();
								} );
							}); // putStream
						} // copy
					} ); // fs.rename
				}, 
				function(err) {
					if (err) self.logError('maint', "Failed to archive logs: " + err);
					else self.logDebug(4, "Log archival complete");
				}); // eachSeries
			} // got files
			else {
				self.logDebug(9, "Log Archive: No log files found matching: " + src_spec);
			}
		} ); // glob
	}
	
	dbSearchUpdate(opts) {
		// perform async background database bulk update, returning receipt to restart or abort
		// NOTE: DB records MUST have an `id` property for this to work!
		// opts: { index, query, iterator, limit?, callback? }
		var self = this;
		
		opts.id = opts.id || Tools.generateShortID('db');
		opts.offset = 0;
		opts.limit = opts.limit || 100;
		opts.sort_by = '_id';
		opts.sort_dir = 1;
		opts.done = false;
		opts.stats = {
			pages: 0,
			count: 0,
			updated: 0
		};
		
		if (!opts.index || !opts.query || !opts.iterator) {
			var err = new Error("Missing required parameters to run bulk search/update.");
			this.logError('db', err.message, opts);
			if (opts.callback) opts.callback(err);
			return;
		}
		
		this.logDebug(5, "Starting bulk search/update operation", opts);
		
		// search using chunk loop
		async.whilst(
			function() { return !opts.done; },
			function(callback) {
				// perform search for current chunk
				self.logDebug(9, "Searching chunk for bulk", opts);
				opts.stats.pages++;
				
				self.unbase.search( opts.index, opts.query, opts, function(err, data) {
					if (err) {
						// abort right away for search error
						opts.done = true;
						return callback(err);
					}
					if (!opts.offset) self.logDebug(9, "Total bulk records found: " + data.total);
					
					// process all records in chunk, in series
					async.eachSeries( data.records,
						function(record, callback) {
							// fire user iterator function
							opts.iterator( record, function(err, need_update) {
								if (err) return callback(err);
								opts.stats.count++;
								
								if (!need_update) return process.nextTick(callback);
								else opts.stats.updated++;
								
								// update record (using insert because its faster, and we have the full record)
								self.unbase.insert( opts.index, record.id, record, callback );
							} ); // iterator
						},
						function(err) {
							if (err) {
								opts.done = true;
								return callback(err);
							}
							if (opts.done) {
								// user requested abort
								self.logDebug(6, "Requested abort of bulk search/update", opts);
								return callback();
							}
							if (opts.restart) {
								// user requested we start over at the beginning
								self.logDebug(6, "Requested restart of bulk search/update", opts);
								opts.offset = 0;
								delete opts.restart;
								return callback();
							}
							if ((data.records.length < opts.limit) || (opts.offset + opts.limit >= data.total)) {
								// reached natural end of records
								opts.done = true;
								return callback();
							}
							
							// advance to next chunk
							opts.offset += opts.limit;
							callback();
						}
					); // async.eachSeries
				} ); // unbase.search
			},
			function(err) {
				if (err) {
					self.logError('db', "Error performing bulk search/update: " + err, opts);
					if (opts.callback) opts.callback(err);
					return;
				}
				
				// extremely rare race condition, restart request COULD end up here
				if (opts.restart) {
					self.logDebug(6, "Requested LATE restart of bulk search/update", opts);
					delete opts.restart;
					return self.dbSearchUpdate(opts);
				}
				
				self.logDebug(5, "Bulk search/update complete", opts);
				if (opts.callback) opts.callback();
			}
		); // async.whilst
		
		return opts;
	}
	
}; // class Maintenance

module.exports = Maintenance;
