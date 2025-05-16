Page.PageUtils = class PageUtils extends Page.Base {

	goRevisionHistory(opts) {
		// jump intp revision history view for parent page
		var self = this;
		this.revHistOpts = opts;
		
		var args = this.args;
		if (!args.offset) args.offset = 0;
		if (!args.limit) args.limit = 25;
		
		var date_items = config.ui.date_range_menu_items;
		
		var html = '';
		html += '<div class="box" style="border:none;">';
		html += '<div class="box_content" style="padding:20px;">';
			
			// options
			html += '<div class="form_grid four" style="margin-bottom:0px">';
				
				// item menu
				html += '<div class="form_cell">';
					html += this.getFormRow({
						label: opts.itemMenu.label,
						content: this.getFormMenuSingle({
							id: 'fe_rh_id',
							title: opts.itemMenu.title,
							options: opts.itemMenu.options,
							value: args.id || '',
							default_icon: opts.itemMenu.default_icon,
							'data-shrinkwrap': 1
						})
					});
				html += '</div>';
				
				// user
				html += '<div class="form_cell">';
					html += this.getFormRow({
						label: '<i class="icon mdi mdi-account">&nbsp;</i>User:',
						content: this.getFormMenuSingle({
							id: 'fe_rh_username',
							title: 'Select User',
							options: [['', 'Any User']].concat( app.users.map( function(user) {
								return { id: user.username, title: user.full_name, icon: user.icon || '' };
							} ) ),
							value: args.username || '',
							default_icon: 'account',
							'data-shrinkwrap': 1
						})
					});
				html += '</div>';
				
				// date
				html += '<div class="form_cell">';
					html += this.getFormRow({
						label: '<i class="icon mdi mdi-calendar-multiple">&nbsp;</i>Date Range:',
						content: this.getFormMenuSingle({
							id: 'fe_rh_date',
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
						{ id: 'date_desc', title: 'Newest on Top', icon: 'sort-descending' },
						{ id: 'date_asc', title: 'Oldest on Top', icon: 'sort-ascending' }
					];
					html += this.getFormRow({
						label: '<i class="icon mdi mdi-sort">&nbsp;</i>Sort Results:',
						content: this.getFormMenuSingle({
							id: 'fe_rh_sort',
							title: 'Sort Results',
							options: sort_items,
							value: args.sort,
							'data-shrinkwrap': 1
						})
					});
				html += '</div>';
				
			html += '</div>'; // form_grid
		
		html += '</div>'; // box_content
		html += '</div>'; // box
		
		// revision history
		html += '<div class="box" id="d_rh_revisions">';
			html += '<div class="box_title">';
				html += 'Revision History';
			html += '</div>';
			html += '<div class="box_content table">';
				html += '<div class="loading_container"><div class="loading"></div></div>';
			html += '</div>'; // box_content
		html += '</div>'; // box
		
		this.div.html( html );
		
		// MultiSelect.init( this.div.find('#fe_s_tags') );
		SingleSelect.init( this.div.find('#fe_rh_id, #fe_rh_username, #fe_rh_date, #fe_rh_sort') );
		// $('.header_search_widget').hide();
		
		this.div.find('#fe_rh_id, #fe_rh_username, #fe_rh_date, #fe_rh_sort').on('change', function() {
			self.revHistNavSearch();
		});
		
		this.fetchRevHistory();
	}
	
	getRevHistSearchArgs() {
		// get form values, return search args object
		var self = this;
		var args = {};
		
		['id', 'username', 'date'].forEach( function(key) {
			var value = self.div.find('#fe_rh_' + key).val();
			if (value) args[key] = value;
		} );
		
		var sort = this.div.find('#fe_rh_sort').val();
		if (sort != 'date_desc') args.sort = sort;
		
		if (!num_keys(args)) return null;
		
		return args;
	}
	
	revHistNavSearch() {
		// convert form into query and redirect
		app.clearError();
		
		var args = this.getRevHistSearchArgs();
		if (!args) {
			Nav.go( this.selfNav({ sub: 'history' }) );
			return;
		}
		
		args.sub = 'history';
		Nav.go( this.selfNav(args) );
	}
	
	getRevHistSearchQuery(args) {
		// construct actual unbase simple query syntax
		var self = this;
		var query = '';
		var keywords = [];
		
		if (args.id) keywords.push( args.id );
		if (args.username) keywords.push( args.username.replace(/\W/g, '_') );
		if (keywords.length) query += ' keywords:' + keywords.join('&'); // AND
		
		if (args.date) {
			query += ' ' + this.getDateRangeQuery('date', args.date);
		}
		
		return query.trim();
	}
	
	fetchRevHistory() {
		// actually perform the search
		var args = this.args;
		var query = this.getRevHistSearchQuery(args);
		
		// compose search query
		var sopts = {
			type: this.revHistOpts.activityType,
			query: query,
			offset: args.offset || 0,
			limit: config.items_per_page + 1 // for diff'ing across pages
		};
		
		switch (args.sort) {
			case 'date_asc':
				sopts.sort_by = '_id'; 
				sopts.sort_dir = 1;
			break;
			
			case 'date_desc':
				sopts.sort_by = '_id'; 
				sopts.sort_dir = -1;
			break;
		} // sort
		
		app.api.get( 'app/search_revision_history', sopts, this.receiveRevHistory.bind(this) );
	}
	
	receiveRevHistory(resp) {
		// show revision history and add links to detail diff dialogs
		var self = this;
		var args = this.args;
		var $cont = this.div.find('#d_rh_revisions');
		var html = '';
		
		if (!this.active) return; // sanity
		
		// massage results for diff'ing across pages
		// revisions always contains a shallow copy (which may have limit+1 items)
		// resp.rows will be chopped to exactly limit, for display
		this.revisions = [...resp.rows];
		if (resp.rows.length > config.alt_items_per_page) resp.rows.pop();
		
		var grid_args = {
			resp: resp,
			cols: ['Revision', 'Description', 'User', 'Date/Time', 'Actions'],
			data_type: 'item',
			offset: args.offset || 0,
			limit: config.items_per_page,
			class: 'data_grid event_revision_grid',
			pagination_link: '$P().revHistNav'
		};
		
		html += this.getPaginatedGrid( grid_args, function(item, idx) {
			// figure out icon first
			if (!item.action) item.action = 'unknown';
			
			var item_type = '';
			for (var key in config.ui.activity_types) {
				var regexp = new RegExp(key);
				if (item.action.match(regexp)) {
					item_type = config.ui.activity_types[key];
					break;
				}
			}
			item._type = item_type;
			
			// compose nice description
			var desc = item.description;
			var actions = [];
			var click = '';
			var nice_rev = 'n/a';
			
			// description template
			var template = config.ui.activity_descriptions[item.action];
			if (template) desc = substitute(template, item, false);
			else if (!desc) desc = '(No description provided)';
			item._desc = desc;
			
			var obj = item[ self.revHistOpts.itemKey ] || null;
			
			if (obj) {
				click = `$P().showRevHistActionReport(${idx})`;
				actions.push(`<span class="link" onClick="${click}"><b>Details...</b></span>`);
			}
			
			if (click) {
				desc = `<span class="link" onClick="${click}">${desc}</span>`;
				if (obj.revision) {
					nice_rev = `<span class="link" onClick="${click}"><i class="mdi mdi-file-compare">&nbsp;</i><b>${obj.revision}</b></span>`;
				}
			}
			
			return [
				nice_rev,
				'<i class="mdi mdi-' + item_type.icon + '">&nbsp;</i>' + desc + '',
				'' + self.getNiceUser(item.username, true) + '',
				'' + self.getRelativeDateTime( item.epoch ) + '',
				'' + actions.join(' | ') + ''
			];
		}); // getPaginatedGrid
		
		$cont.find('> .box_content').html( html );
	}
	
	revHistNav(offset) {
		// paginate through revision history
		this.args.offset = offset;
		this.div.find('#d_rh_revisions > .box_content').addClass('loading');
		this.fetchRevHistory();
	}
	
	showRevHistActionReport(idx) {
		// pop dialog for any action
		var item = this.revisions[idx];
		var template = config.ui.activity_descriptions[item.action];
		
		var obj_key = this.revHistOpts.itemKey;
		var obj = item[ obj_key ];
		var all_objs = app[ this.revHistOpts.activityType ];
		var is_cur_rev = false;
		
		if (all_objs) {
			var latest_obj = find_object( all_objs, { id: obj.id } );
			if (latest_obj && (latest_obj.revision === obj.revision)) is_cur_rev = true;
		}
		
		// massage a title out of description template (ugh)
		var title = template.replace(/\:\s+.+$/, '').replace(/\s+\(.+$/, '');
		var btn = '<div class="button danger" onClick="$P().prepRevHistRollback(' + idx + ')"><i class="mdi mdi-undo-variant">&nbsp;</i>Rollback...</div>';
		if (is_cur_rev) btn = '&nbsp;';
		var md = '';
		
		// summary
		md += "### Summary\n\n";
		md += '- **Description:** <i class="mdi mdi-' + item._type.icon + '">&nbsp;</i>' + item._desc + "\n";
		md += '- **Date/Time:** ' + this.getRelativeDateTime(item.epoch) + "\n";
		md += '- **User:** ' + this.getNiceUser(item.username, true) + "\n";
		md += '- **Revision:** <i class="mdi mdi-file-compare">&nbsp;</i>' + (obj.revision || 'n/a') + (is_cur_rev ? ' (Current)' : '') + "\n";
		
		// find prev rev for diff'ing
		var prev_rev = this.revisions.find( function(rev) {
			return rev[obj_key] && rev[obj_key].id && (rev[obj_key].id === obj.id) && rev[obj_key].revision && (rev[obj_key].revision === obj.revision - 1);
		} );
		
		if (prev_rev) {
			// include diff in markdown
			var old_obj = copy_object( prev_rev[obj_key] );
			delete old_obj.revision;
			delete old_obj.modified;
			delete old_obj.sort_order;
			
			var new_obj = copy_object( obj );
			delete new_obj.revision;
			delete new_obj.modified;
			delete new_obj.sort_order;
			
			var diff_html = this.getDiffHTML( old_obj, new_obj );
			md += "\n### Diff to Previous\n\n";
			md += '<div class="diff_content">' + diff_html + '</div>' + "\n";
		}
		
		// the thing itself
		md += "\n### " + toTitleCase(obj_key.replace(/_/g, ' ')) + " JSON\n\n";
		md += '```json' + "\n";
		md += JSON.stringify( obj, null, "\t" ) + "\n";
		md += '```' + "\n";
		
		this.viewMarkdownAuto( title, md, btn );
	}
	
	prepRevHistRollback(idx) {
		// prep a rollback to specified revision
		var item = this.revisions[idx];
		var obj_key = this.revHistOpts.itemKey;
		var obj = item[ obj_key ];
		Dialog.hide();
		
		this.rollbackData = obj;
		Nav.go( this.revHistOpts.editPageID + '?sub=edit&id=' + obj.id + '&rollback=1');
	}
	
	cleanupRevHistory() {
		// call on page deactivate
		delete this.revisions;
		delete this.revHistOpts;
	}
	
	showExportOptions(opts) {
		// show dialog with export and api tool options
		var self = this;
		var title = 'Export ' + opts.name;
		var html = '';
		
		this._temp_export = opts;
		
		var md = '';
		md += `Please select how you would like to export the ${opts.name}'s JSON data.` + "\n";
		md += "\n```json\n" + JSON.stringify(opts.data, null, "\t") + "\n```\n";
		
		html += '<div class="code_viewer">';
		html += '<div class="markdown-body">';
		
		html += marked(md, config.ui.marked_config);
		
		html += '</div>'; // markdown-body
		html += '</div>'; // code_viewer
		
		var buttons_html = "";
		buttons_html += '<div class="button mobile_collapse" onClick="Dialog.hide()"><i class="mdi mdi-close-circle-outline">&nbsp;</i><span>Cancel</span></div>';
		buttons_html += '<div class="button mobile_collapse" onClick="$P().copyExportToClipboard()"><i class="mdi mdi-clipboard-text-outline">&nbsp;</i><span>Copy to Clipboard</span></div>';
		buttons_html += '<div class="button secondary mobile_collapse" onClick="$P().copyExportToAPITool()"><i class="mdi mdi-send">&nbsp;</i><span>Copy to API Tool...</span></div>';
		buttons_html += '<div class="button primary" onClick="Dialog.confirm_click(true)"><i class="mdi mdi-cloud-download-outline">&nbsp;</i>Download File</div>';
		
		Dialog.showSimpleDialog(title, html, buttons_html);
		
		// special mode for key capture
		Dialog.active = 'confirmation';
		Dialog.confirm_callback = function(result) { 
			if (result) self.copyExportToFile();
		};
		Dialog.onHide = function() {
			delete self._temp_export;
		};
		
		this.highlightCodeBlocks('#dialog .markdown-body');
	}
	
	copyExportToClipboard() {
		// copy export data as pretty-printed JSON to the clipboard
		var opts = this._temp_export;
		var payload = JSON.stringify(opts.data, null, "\t") + "\n";
		copyToClipboard(payload);
		app.showMessage('info', `The ${opts.name} JSON was copied to your clipboard.`);
	}
	
	copyExportToAPITool() {
		// copy the export data over to the API tool
		var opts = this._temp_export;
		// TODO: this
		Dialog.hide();
		Nav.go('APITool?import=1');
	}
	
	copyExportToFile() {
		// download export as file (which can then be re-uploaded to create/replace)
		var opts = this._temp_export;
		var json = {
			description: "Orchestra Portable Data Object",
			version: "1.0",
			type: opts.dataType,
			data: opts.data
		};
		var payload = JSON.stringify(json, null, "\t") + "\n";
		var filename = 'orchestra-' + opts.dataType + '-' + opts.data.id + '.json';
		var blob = new Blob([payload], { type: "application/json" });
		var url = URL.createObjectURL(blob);
		
		// create temp link element
		var a = document.createElement("a");
		a.href = url;
		a.download = filename;
		
		// click it, the remove it
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		
		// cleanup
		URL.revokeObjectURL(url);
		Dialog.hide();
	}
	
	doFileImportPrompt() {
		// show file selection dialog
		var self = this;
		var $file = $('#fe_file_import');
		if ($file.length) $file.remove();
		$file = $('<input type="file" id="fe_file_import" accept=".json" style="display:none">').appendTo('body');
		
		$file.on('change', function() {
			if (this.files && this.files.length) self.doPrepImportFile( this.files[0] );
			$file.remove();
		});
		
		$file[0].click();
	}
	
	getChartSizeSelector(pref_key = 'chart_size') {
		// get chart title widget menu selector
		return '<div class="box_title_widget" style="overflow:visible; min-width:100px; max-width:200px; font-size:13px;">' + this.getFormMenuSingle({
			class: 'sel_chart_size',
			title: 'Select chart size',
			options: [
				{ id: 'small', title: 'Small', icon: 'view-module-outline' },
				{ id: 'medium', title: 'Medium', icon: 'view-grid-outline' },
				{ id: 'large', title: 'Large', icon: 'view-agenda-outline' }
			],
			value: app.getPref(pref_key) || 'medium',
			onChange: '$P().applyChartSize(this)',
			'data-shrinkwrap': 1,
			'data-compact': 1,
			'data-prefkey': pref_key
		}) + '</div>';
	}
	
	applyChartSize(elem) {
		// set new chart size
		var $elem = $(elem);
		var size = $elem.val();
		var pref_key = $elem.data('prefkey');
		$elem.closest('div.box').find('div.chart_grid_horiz').removeClass(['small', 'medium', 'large']).addClass(size);
		ChartManager.charts.forEach( function(chart) { chart.dirty = true; } );
		ChartManager.check();
		app.setPref(pref_key, size);
	}
	
};
