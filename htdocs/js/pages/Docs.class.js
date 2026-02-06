// Documentation Viewer Page

// Copyright (c) 2019 - 2026 PixlCore LLC
// Released under the BSD 3-Clause License.
// See the LICENSE.md file in this repository.

Page.Docs = class Docs extends Page.PageUtils {
	
	onInit() {
		// called once at page load
		var self = this;
	}
	
	onActivate(args) {
		// page activation
		if (!this.requireLogin(args)) return true;
		
		if (!args) args = {};
		if (!args.sub) args.sub = 'index';
		this.args = args;
		
		app.setWindowTitle('Documentation');
		app.setHeaderTitle( '<i class="mdi mdi-file-document-multiple-outline">&nbsp;</i>' + config.name + ' Documentation' );
		app.showSidebar(true);
		
		// Calling page: Docs: {"sub":"hosting/key-rotation"}
		var [ doc, anchor ] = args.sub.split(/\//);
		args.doc = doc;
		args.anchor = anchor || '';
		
		this.scrollCache = {};
		
		this.div.html( '' );
		this.loading();
		
		app.api.get( 'app/get_doc', args, this.receive_doc.bind(this), this.fullPageError.bind(this) );
		
		return true;
	}
	
	receive_doc(resp) {
		// receive raw markdown from server, render it client-side
		var args = this.args;
		var text = resp.text;
		var html = '';
		
		// grab title from first level-1 header
		var re_first_header = /^\#\s+([^\n]+)\n/;
		text.match(re_first_header);
		var title = RegExp.$1 || 'No Title';
		text = text.replace(re_first_header, '').trim();
		
		// header nav
		if (args.doc == 'index') {
			app.setWindowTitle('Documentation');
			app.setHeaderTitle( '<i class="mdi mdi-file-document-multiple-outline">&nbsp;</i>' + config.name + ' Documentation' );
			app.highlightTab( 'Docs' );
		}
		else if (args.doc == 'support') {
			app.setWindowTitle('Support');
			app.setHeaderTitle( '<i class="mdi mdi-lifebuoy">&nbsp;</i>' + config.name + ' Support' );
			app.highlightTab( 'Support' );
		}
		else {
			app.setWindowTitle( title + ' | Documentation' );
			app.setHeaderNav([
				{ icon: 'file-document-multiple-outline', loc: '#Docs', title: 'Docs' },
				{ icon: 'file-document-outline', loc: '#Docs/' + args.doc, title: title }
			]);
			app.highlightTab( 'Docs' );
		}
		
		// table of contents
		var toc = this.getTableOfContents(text);
		if (toc) text = `## Table of Contents\n\n` + toc + `\n` + text;
		
		html += '<div class="box">';
		
		html += '<div class="box_title doc">';
			html += title;
			html += '<div class="box_title_widget" style="overflow:visible"><i class="mdi mdi-magnify" onClick="$(\'#fe_doc_search\').focus()">&nbsp;</i><input type="text" id="fe_doc_search" placeholder="Search docs..."/></div>';
			html += '<div class="clear"></div>';
			if (!['index', 'support'].includes(args.doc)) {
				html += '<div class="box_subtitle"><a href="#Docs">&laquo; Back to Document Index</a></div>';
			}
		html += '</div>';
		
		html += '<div class="box_content">';
		html += '<div class="markdown-body doc-body" style="margin-top:0px; margin-bottom:15px;">';
		
		html += marked.parse(text, config.ui.marked_config);
		
		html += '<p class="article_fin"><i class="mdi mdi-console-line"></i></p>';
		
		html += '</div>'; // markdown-body
		html += '</div>'; // box_content
		html += '</div>'; // box
		
		this.div.html(html);
		
		window.scrollTo(0, this.scrollCache[ args.doc + '/' + args.anchor ] || 0);
		
		this.expandInlineImages();
		this.highlightCodeBlocks();
		this.fixDocumentLinks();
		this.setupHeaderLinks();
		this.wrapTables();
		
		setTimeout( function() {
			$('#fe_doc_search').keypress( function(event) {
				if (event.keyCode == '13') { // enter key
					event.preventDefault();
					var query = $('#fe_doc_search').val().trim();
					if (query.match(/\S/)) Nav.go('Docs/search/' + encodeURIComponent( query ));
				}
			} );
		}, 1 );
	}
	
	gosub(sub) {
		// go to sub-anchor (article section link), MIGHT be different doc tho
		var args = this.args;
		var [ doc, anchor ] = sub.split(/\//);
		if (!doc) doc = 'index';
		if (!anchor) anchor = '';
		
		this.scrollCache[ args.doc + '/' + args.anchor ] = this.lastScrollY;
		
		if (doc != args.doc) {
			// switch doc
			args.doc = doc;
			args.anchor = anchor;
			this.div.html( '' );
			this.loading();
			
			app.api.get( 'app/get_doc', args, this.receive_doc.bind(this), this.fullPageError.bind(this) );
			return;
		}
		
		// scroll to anchor on current page
		if (anchor) {
			if (args.doc == 'search') {
				args.anchor = anchor;
				this.div.html( '' );
				this.loading();
				app.api.get( 'app/get_doc', args, this.receive_doc.bind(this), this.fullPageError.bind(this) );
				return;
			}
			
			var $elem = this.div.find('div.markdown-body').find('#' + anchor);
			if ($elem.length) {
				$elem[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
				args.anchor = anchor;
			}
		}
		else window.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
	}
	
	getTableOfContents(text) {
		// scan doc for headings
		if (['index', 'support'].includes(this.args.doc)) return '';
		var chapters = [];
		var min_indent = 99;
		var in_code_block = false;
		
		text.split(/\n/).forEach( function(line) {
			if (line.match(/^\`\`\`/)) in_code_block = !in_code_block;
			
			if (!in_code_block && line.match(/^(\#+)\s+(.+)$/)) {
				var hashes = RegExp.$1;
				var title = RegExp.$2;
				var id = title.trim().replace(/\W+/g, '-').toLowerCase();
				var indent = hashes.length;
				if (indent < min_indent) min_indent = indent;
				chapters.push({ id, title, indent });
			}
		} );
		
		if (chapters.length < 4) return '';
		
		var toc = '';
		chapters.forEach( function(item) {
			var tabs = '';
			var indent = item.indent - min_indent;
			if (indent) tabs = ("\t").repeat(indent);
			toc += `${tabs}- [${item.title}](#${item.id})\n`;
		} );
		
		return toc;
	}
	
	setupHeaderLinks(elem) {
		// add links to article section headers
		var self = this;
		if (!elem) elem = this.div;
		else if (typeof(elem) == 'string') elem = $(elem);
		
		var { doc, anchor } = this.args;
		var pre_scrolled = this.scrollCache[ doc + '/' + anchor ];
		
		elem.find('div.markdown-body').find('h1, h2, h3, h4, h5, h6').each( function() {
			var $this = $(this);
			var id = $this.text().trim().replace(/\W+/g, '-').toLowerCase();
			$this.attr('id', id);
			$this.addClass('heading').prepend( '<a href="#Docs/' + doc + '/' + id + '" class="anchor"><i class="mdi mdi-link-variant"></i></a>' );
			if (anchor && (id == anchor) && !pre_scrolled) this.scrollIntoView(true);
		});
	}
	
	highlightCodeBlocks(elem) {
		// highlight code blocks inside markdown doc
		var self = this;
		if (!elem) elem = this.div;
		else if (typeof(elem) == 'string') elem = $(elem);
		
		elem.find('div.markdown-body pre code').each( function() {
			var $this = $(this);
			var text = this.innerText;
			$this.data('raw', text);
			if (text.match(/^\s*\{[\S\s]+\}\s*$/)) this.classList.add('language-json');
			if (this.classList.length) hljs.highlightElement(this);
			$this.after(`<div class="copy_icon" title="Copy to Clipboard" onClick="$P().copyCode(this)"><i class="mdi mdi-clipboard-text-outline"></i></div>`);
		});
	}
	
	copyCode(elem) {
		// copy code block to clipboard
		var $code = $(elem).closest('pre').find('> code');
		copyToClipboard( $code.data('raw') );
		app.showMessage('info', "Code snippet copied to clipboard.");
	}
	
	wrapTables(elem) {
		// wrap all tables with DIVs with special class, for overflow
		var self = this;
		if (!elem) elem = this.div;
		else if (typeof(elem) == 'string') elem = $(elem);
		
		elem.find('div.markdown-body table').each( function() {
			$(this).wrap('<div class="table"></div>');
		});
	}
	
	onStatusUpdate() {
		// HACK: using this to track window.scrollY
		// FUTURE: find a better way to do this
		this.lastScrollY = window.scrollY;
	}
	
	onDeactivate() {
		// called when page is deactivated
		this.div.html( '' );
		delete this.scrollCache;
		return true;
	}
	
};
