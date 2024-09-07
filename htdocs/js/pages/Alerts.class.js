Page.Alerts = class Alerts extends Page.Base {
	
	onInit() {
		// called once at page load
		this.default_sub = 'list';
	}
	
	onActivate(args) {
		// page activation
		if (!this.requireLogin(args)) return true;
		
		if (!args) args = {};
		if (!args.sub) args.sub = this.default_sub;
		this.args = args;
		
		app.showSidebar(true);
		
		this.loading();
		this['gosub_'+args.sub](args);
		
		return true;
	}
	
	gosub_list(args) {
		// alert history / search
		var self = this;
		var args = this.args;
		
		if (!args.offset) args.offset = 0;
		if (!args.limit) args.limit = 25;
		
		app.setWindowTitle('Alert History');
		app.setHeaderTitle( '<i class="mdi mdi-restore-alert">&nbsp;</i>Alert History' ); // or: cloud-alert-outline
		
		var html = '';
		html += '<div class="box" style="border:none;">';
		html += '<div class="box_content" style="padding:20px;">';
			
			// options
			html += '<div id="d_s_adv" class="form_grid" style="margin-bottom:25px">';
				
				// alert
				html += '<div class="form_cell">';
					html += this.getFormRow({
						label: '<i class="icon mdi mdi-bell-outline">&nbsp;</i>Alert Type:',
						content: this.getFormMenuSingle({
							id: 'fe_sa_alert',
							title: 'Select Alert',
							placeholder: 'All Alerts',
							options: [['', 'Any Alert']].concat( app.alerts ),
							value: args.alert || '',
							default_icon: 'bell-outline',
							'data-shrinkwrap': 1
						})
					});
				html += '</div>';
				
				// server
				html += '<div class="form_cell">';
					html += this.getFormRow({
						label: '<i class="icon mdi mdi-router-network">&nbsp;</i>Server:',
						content: this.getFormMenuSingle({
							id: 'fe_sa_server',
							title: 'Select Server',
							placeholder: 'All Servers',
							options: [['', 'Any Server']].concat( sort_by(Object.values(app.servers), 'hostname').map( function(server) {
								return merge_objects( { title: server.hostname }, server );
							} ) ),
							value: args.server || '',
							default_icon: 'router-network',
							'data-shrinkwrap': 1
						})
					});
				html += '</div>';
				
				// group
				html += '<div class="form_cell">';
					html += this.getFormRow({
						label: '<i class="icon mdi mdi-server-network">&nbsp;</i>Group:',
						content: this.getFormMenuSingle({
							id: 'fe_sa_group',
							title: 'Select Group',
							placeholder: 'All Groups',
							options: [['', 'Any Group']].concat( app.groups ),
							value: args.group || '',
							default_icon: 'server-network',
							'data-shrinkwrap': 1
						})
					});
				html += '</div>';
				
				// date
				html += '<div class="form_cell">';
					var date_items = [
						['', 'All Dates'],
						['now', 'This Hour'],
						['lasthour', 'Last Hour'],
						['today', 'Today'],
						['yesterday', 'Yesterday'],
						['month', 'This Month'],
						['lastmonth', 'Last Month'],
						['year', 'This Year'],
						['lastyear', 'Last Year'],
						['older', 'Older']
					];
					html += this.getFormRow({
						label: '<i class="icon mdi mdi-calendar-multiple">&nbsp;</i>Date Range:',
						content: this.getFormMenuSingle({
							id: 'fe_sa_date',
							title: 'Date Range',
							options: date_items.map( function(item) { 
								return item[0] ? { id: item[0], title: item[1], icon: 'calendar-range' } : item; 
							} ),
							value: args.date,
							'data-shrinkwrap': 1
						})
					});
				html += '</div>';
				
				// sort
				html += '<div class="form_cell">';
					var sort_items = [
						{ id: 'date_desc', title: 'Newest', icon: 'sort-descending' },
						{ id: 'date_asc', title: 'Oldest', icon: 'sort-ascending' }
					];
					html += this.getFormRow({
						label: '<i class="icon mdi mdi-sort">&nbsp;</i>Sort Results:',
						content: this.getFormMenuSingle({
							id: 'fe_sa_sort',
							title: 'Sort Results',
							options: sort_items,
							value: args.sort,
							'data-shrinkwrap': 1
						})
					});
				html += '</div>';
				
			html += '</div>'; // form_grid
		
		// buttons at bottom
		html += '<div class="box_buttons" style="padding:0">';
			html += '<div class="button primary" onMouseUp="$P().navSearch()"><i class="mdi mdi-magnify">&nbsp;</i>Search</div>';
			// html += '<div class="clear"></div>';
		html += '</div>'; // box_buttons
		
		html += '</div>'; // box_content
		html += '</div>'; // box
		
		html += '<div id="d_search_results"><div class="loading_container"><div class="loading"></div></div></div>';
		
		this.div.html( html );
		
		var sargs = this.getSearchArgs();
		
		SingleSelect.init( this.div.find('#fe_sa_alert, #fe_sa_server, #fe_sa_group, #fe_sa_date, #fe_sa_sort') );
		// $('.header_search_widget').hide();
		
		this.div.find('#fe_sa_alert, #fe_sa_server, #fe_sa_group, #fe_sa_date, #fe_sa_sort').on('change', function() {
			self.navSearch();
		});
		
		this.doSearch();
		
		return true;
	}
	
	getSearchArgs() {
		// get form values, return search args object
		var args = {};
		
		var alert = this.div.find('#fe_sa_alert').val();
		if (alert) args.alert = alert;
		
		var server = this.div.find('#fe_sa_server').val();
		if (server) args.server = server;
		
		var group = this.div.find('#fe_sa_group').val();
		if (group) args.group = group;
		
		var date = this.div.find('#fe_sa_date').val();
		if (date) args.date = date;
		
		var sort = this.div.find('#fe_sa_sort').val();
		if (sort != 'date_desc') args.sort = sort;
		
		if (!num_keys(args)) return null;
		
		return args;
	}
	
	navSearch() {
		// convert form into query and redirect
		app.clearError();
		
		var args = this.getSearchArgs();
		if (!args) {
			Nav.go( this.selfNav({}) );
			return;
		}
		
		Nav.go( this.selfNav(args) );
	}
	
	getSearchQuery(args) {
		// construct actual unbase simple query syntax
		var query = '';
		
		if (args.alert) query += ' alert:' + args.alert;
		if (args.server) query += ' server:' + args.server;
		if (args.group) query += ' groups:' + args.group;
		
		if (args.date) {
			query += ' ' + this.getDateRangeQuery('start', args.date);
		}
		
		return query.trim();
	}
	
	doSearch() {
		// actually perform the search
		var args = this.args;
		var query = this.getSearchQuery(args);
		
		// compose search query
		this.records = [];
		this.opts = {
			query: query.trim(),
			offset: args.offset || 0,
			limit: args.limit || config.items_per_page,
			compact: 1
		};
		switch (args.sort) {
			case 'date_asc':
				this.opts.sort_by = '_id'; 
				this.opts.sort_dir = 1;
			break;
			
			case 'date_desc':
				this.opts.sort_by = '_id'; 
				this.opts.sort_dir = -1;
			break;
		} // sort
		
		app.api.get( 'app/search_alerts', this.opts, this.receiveResults.bind(this) );
	}
	
	receiveResults(resp) {
		// receive search results
		var self = this;
		var $results = this.div.find('#d_search_results');
		var html = '';
		
		if (!this.active) return; // sanity
		
		this.lastSearchResp = resp;
		this.alerts = [];
		if (resp.rows) this.alerts = resp.rows;
		
		var grid_args = {
			resp: resp,
			cols: ["Alert ID", "Title", "Message", "Server", "Status", "Started", "Duration"],
			data_type: 'alert',
			offset: this.args.offset || 0,
			limit: this.args.limit,
			pagination_link: '$P().searchPaginate'
		};
		
		html += '<div class="box">';
		
		html += '<div class="box_title" style="' + (this.alerts.length ? 'padding-bottom:10px' : '') + '">';
			html += this.getSearchArgs() ? 'Search Results' : 'All Alerts';
			html += '<div class="clear"></div>';
		html += '</div>';
		
		html += '<div class="box_content table">';
		
		html += this.getPaginatedGrid( grid_args, function(item, idx) {
			return [
				'<b>' + self.getNiceAlertID(item, true) + '</b>',
				self.getNiceAlert(item.alert, false),
				item.message,
				self.getNiceServer(item.server, false),
				self.getNiceAlertStatus(item),
				self.getRelativeDateTime(item.date),
				self.getNiceAlertElapsedTime(item, true, true)
			];
		} );
		
		html += '</div>'; // box_content
		html += '</div>'; // box
		
		$results.html( html );
	}
	
	searchPaginate(offset) {
		// special hook for intercepting pagination clicks
		// FUTURE: history.replaceState to update the URI with new offset
		this.args.offset = offset;
		this.div.find('#d_search_results .box_content').addClass('loading');
		this.doSearch();
	}
	
	gosub_view(args) {
		// page activation
		if (!this.requireLogin(args)) return true;
		
		if (!args) args = {};
		this.args = args;
		
		app.showSidebar(true);
		app.setHeaderTitle( '...' );
		
		this.alert = null;
		this.def = null;
		
		this.loading();
		app.api.get( 'app/search_alerts', { query: '#id:' + args.id }, this.receive_alert.bind(this), this.fullPageError.bind(this) );
		return true;
	}
	
	receive_alert(resp) {
		// render alert details
		var html = '';
		
		// make sure page is still active (API may be slow)
		if (!this.active) return;
		
		var alert = this.alert = resp.rows.shift();
		if (!alert) return this.doFullPageError("Alert ID not found: " + this.args.id);
		
		var def = this.def = find_object( app.alerts, { id: alert.alert } );
		if (!def) def = { title: '(' + alert.alert + ')' };
		
		// var icon = '<i class="mdi mdi-' + (alert.active ? 'progress-alert' : 'alert-circle-outline') + '">&nbsp;</i>';
		
		app.setHeaderNav([
			{ icon: 'restore-alert', loc: '#Alerts?sub=list', title: 'Alert History' },
			{ icon: (alert.active ? 'progress-alert' : 'alert-circle-outline'), title: "Alert Details" }
		]);
		
		// app.setHeaderTitle( icon + 'Alert Details' );
		app.setWindowTitle( "Viewing Alert \"" + (this.def.title) + "\"" );
		
		html += '<div class="box">';
			html += '<div class="box_title">';
				html += alert.message;
				
				html += '<div class="button right danger" onMouseUp="$P().showDeleteAlertDialog()"><i class="mdi mdi-trash-can-outline">&nbsp;</i>Delete...</div>';
				// html += '<div class="button secondary right" onMouseUp="$P().do_edit_from_view()"><i class="mdi mdi-file-edit-outline">&nbsp;</i>Edit Event...</div>';
				// html += '<div class="button right" onMouseUp="$P().do_run_from_view()"><i class="mdi mdi-run-fast">&nbsp;</i>Run Now</div>';
				html += '<div class="clear"></div>';
			html += '</div>'; // title
			
			html += '<div class="box_content table">';
				html += '<div class="summary_grid">';
				
					// row 1
					html += '<div>';
						html += '<div class="info_label">Alert ID</div>';
						html += '<div class="info_value" style="font-weight:bold">' + this.getNiceAlertID(alert) + '</div>';
					html += '</div>';
					
					html += '<div>';
						html += '<div class="info_label">Alert Definition</div>';
						html += '<div class="info_value">' + this.getNiceAlert(alert.alert, true) + '</div>';
					html += '</div>';
					
					html += '<div>';
						html += '<div class="info_label">Server</div>';
						html += '<div class="info_value">' + this.getNiceServer(alert.server, true) + '</div>';
					html += '</div>';
					
					html += '<div>';
						html += '<div class="info_label">Date/Time</div>';
						html += '<div class="info_value">' + this.getRelativeDateTime( alert.date ) + '</div>';
					html += '</div>';
					
					// row 2
					html += '<div class="overflow">';
						html += '<div class="info_label">Status</div>';
						html += '<div class="info_value overflow" style="font-weight:normal;">' + this.getNiceAlertStatus(alert) + '</div>';
					html += '</div>';
					
					html += '<div>';
						html += '<div class="info_label">Expression</div>';
						html += '<div class="info_value monospace">' + encode_entities(alert.exp) + '</div>';
					html += '</div>';
					
					html += '<div>';
						html += '<div class="info_label">Groups</div>';
						html += '<div class="info_value">' + this.getNiceGroupList(alert.groups) + '</div>';
					html += '</div>';
					
					html += '<div>';
						html += '<div class="info_label">Duration</div>';
						html += '<div class="info_value">' + this.getNiceAlertElapsedTime( alert ) + '</div>';
					html += '</div>';
					
				html += '</div>'; // summary grid
			html += '</div>'; // box content
		html += '</div>'; // box
		
		// snapshots
		html += '<div class="box" id="d_va_snapshots">';
			html += '<div class="box_title">';
				html += 'Alert Snapshots';
			html += '</div>';
			html += '<div class="box_content table">';
				html += '<div class="loading_container"><div class="loading"></div></div>';
			html += '</div>'; // box_content
		html += '</div>'; // box
		
		// jobs
		html += '<div class="box" id="d_va_jobs">';
			html += '<div class="box_title">';
				html += 'Alert Jobs';
			html += '</div>';
			html += '<div class="box_content table">';
				html += '<div class="loading_container"><div class="loading"></div></div>';
			html += '</div>'; // box_content
		html += '</div>'; // box
		
		// history
		html += '<div class="box" id="d_va_history">';
			html += '<div class="box_title">';
				html += 'Alert History';
			html += '</div>';
			html += '<div class="box_content table">';
				html += '<div class="loading_container"><div class="loading"></div></div>';
			html += '</div>'; // box_content
		html += '</div>'; // box
		
		this.div.html(html);
		
		this.getAlertSnapshots();
		this.getAlertJobs();
		this.getAlertHistory();
	}
	
	getAlertSnapshots() {
		// fetch snapshots associated with alert
		var self = this;
		var alert = this.alert;
		
		var opts = {
			query: 'alerts:' + alert.id,
			offset: 0,
			limit: config.items_per_page, // no pagination, so this is just a sanity limit
			sort_by: '_id',
			sort_dir: -1,
			ttl: 1
		};
		
		app.api.get( 'app/search_snapshots', opts, function(resp) {
			self.snapshots = resp.rows || [];
			self.renderAlertSnapshots();
		});
	}
	
	renderAlertSnapshots() {
		// render details on alert snapshots
		var self = this;
		var alert = this.alert;
		
		// make sure page is still active (API may be slow)
		if (!this.active) return;
		
		if (!this.snapshots || !this.snapshots.length) {
			$('#d_va_snapshots').hide();
			return;
		}
		
		var snapshots = this.snapshots;
		var cols = ["Snapshot ID", "Source", "Server", "Uptime", "Load Avg", "Mem Avail", "Date/Time"];
		var html = '';
		
		var grid_args = {
			rows: snapshots,
			cols: cols,
			data_type: 'snapshot'
		};
		
		html += this.getBasicGrid( grid_args, function(item, idx) {
			if (!item.data) item.data = {}; // sanity
			if (!item.data.memory) item.data.memory = {}; // sanity
			
			return [
				'<b>' + self.getNiceSnapshotID(item, true) + '</b>',
				self.getNiceSnapshotSource(item),
				self.getNiceServer(item.server || alert.server, true),
				get_text_from_seconds(item.data.uptime_sec || 0, true, true),
				item.data.load.join(', '),
				get_text_from_bytes(item.data.memory.available || 0),
				self.getRelativeDateTime(item.date)
			];
		}); // grid
		
		$('#d_va_snapshots > div.box_content').html( html );
		$('#d_va_snapshots').show();
	}
	
	getAlertJobs() {
		// fetch info about all alert jobs
		var self = this;
		var alert = this.alert;
		
		if (!alert.jobs || !alert.jobs.length) {
			this.jobs = [];
			return this.renderAlertJobs();
		}
		
		app.api.post( 'app/get_jobs', { ids: alert.jobs }, function(resp) {
			self.jobs = resp.jobs || [];
			self.renderAlertJobs();
		});
	}
	
	renderAlertJobs() {
		// render alert jobs
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
		
		this.div.find('#d_va_jobs > .box_content').html( html );
	}
	
	getAlertHistory() {
		// fetch history of alert on current server
		var self = this;
		var alert = this.alert;
		if (!this.alertHistoryOffset) this.alertHistoryOffset = 0;
		
		var opts = {
			query: 'alert:' + alert.alert + ' server:' + alert.server,
			offset: this.alertHistoryOffset,
			limit: config.alt_items_per_page,
			sort_by: '_id',
			sort_dir: -1,
			ttl: 1
		};
		
		app.api.get( 'app/search_alerts', opts, this.renderAlertHistory.bind(this));
	}
	
	renderAlertHistory(resp) {
		// render alert history
		var self = this;
		var cols = ["Alert ID", "Title", "Message", "Server", "Status", "Started", "Duration"];
		var html = '';
		
		// make sure page is still active (API may be slow)
		if (!this.active) return;
		
		var grid_args = {
			resp: resp,
			cols: cols,
			offset: 0,
			limit: config.alt_items_per_page,
			sort_by: '_id',
			sort_dir: -1,
			data_type: 'alert',
			pagination_link: '$P().alertHistoryNav'
		};
		
		html += this.getPaginatedGrid( grid_args, function(item, idx) {
			return [
				'<b>' + self.getNiceAlertID(item, true) + '</b>',
				self.getNiceAlert(item.alert, true),
				item.message,
				self.getNiceServer(item.server, true),
				self.getNiceAlertStatus(item),
				self.getRelativeDateTime(item.date),
				self.getNiceAlertElapsedTime(item, true, true)
			];
		}); // grid
		
		$('#d_va_history > div.box_content').removeClass('loading').html( html );
	}
	
	alertHistoryNav(offset) {
		// intercept click on job history table pagination nav
		this.alertHistoryOffset = offset;
		this.div.find('#d_va_history > .box_content').addClass('loading');
		this.getAlertHistory();
	}
	
	showDeleteAlertDialog() {
		// delete alert invocation after user confirmation
		var self = this;
		var alert = this.alert;
		
		Dialog.confirmDanger( 'Delete Alert', "Are you sure you want to permanently delete the current alert invocation?  There is no way to undo this operation.", 'Delete', function(result) {
			if (!result) return;
			app.clearError();
			Dialog.showProgress( 1.0, "Deleting Alert..." );
			
			app.api.post( 'app/delete_alert_invocation', { id: alert.id }, function(resp) {
				Dialog.hideProgress();
				app.showMessage('success', "Alert invocation &ldquo;<b>" + alert.id + "</b>&rdquo; was deleted successfully.");
				
				if (!self.active) return; // sanity
				
				Nav.go('#Alerts?sub=list');
			} ); // api.post
		} ); // confirm
	}
	
	onDeactivate() {
		// called when page is deactivated
		this.div.html( '' );
		
		delete this.lastSearchResp;
		delete this.alerts;
		delete this.alert;
		delete this.def;
		delete this.snapshots;
		delete this.jobs;
		
		return true;
	}
	
};
