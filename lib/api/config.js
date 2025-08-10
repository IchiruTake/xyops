// xyOps API Layer - Configuration
// Copyright (c) 2019 - 2025 PixlCore LLC
// Released under the PixlCore Sustainable Use License.
// See the LICENSE.md file in this repository.

const fs = require('fs');
const assert = require("assert");
const async = require('async');
const Tools = require("pixl-tools");

class Configuration {
	
	api_config(args, callback) {
		// send config to client, JSONP-style
		// Note: this is BEFORE LOGIN, and requires NO AUTH, so make sure the response contains no sensitive data.
		// This is basically the UI config bootstrap.  The rest comes across in the successful user login response.
		var self = this;
		
		// do not cache this API response
		this.forceNoCacheResponse(args);
		
		var resp = {
			code: 0,
			version: this.server.__version,
			epoch: Tools.timeNow(),
			port: args.request.headers.ssl ? this.web.config.get('https_port') : this.web.config.get('http_port')
		};
		
		if (this.master) {
			resp.config = Tools.mergeHashes( this.config.get('client'), {
				base_app_url: this.config.get('base_app_url'),
				debug: this.server.debug ? 1 : 0,
				ui: this.config.get('ui'),
				free_accounts: this.usermgr.config.get('free_accounts'),
				email_from: this.config.get('email_from'),
				intl: this.config.get('intl'),
				tz: this.config.get('tz') || Intl.DateTimeFormat().resolvedOptions().timeZone,
				https_port: this.web.config.get('https_port'),
				quick_monitors: this.config.get('quick_monitors'),
				systems: this.systems,
				hostname_display_strip: this.config.get('hostname_display_strip') || '(?!)'
			} );
			resp.masters = this.getMasterPeerData();
		}
		else {
			resp.code = 'master';
			resp.host = this.masterHost || '';
			resp.title = "Non-Primary Conductor Server";
			resp.description = Tools.sub( this.config.getPath('ui.error_type_descriptions.master'), { masterHost: this.masterHost } );
		}
		
		callback( "200 OK", { 'Content-Type': "text/javascript" }, 'app.receiveConfig(' + JSON.stringify(resp) + ');' );
	}
	
}; // class Configuration

module.exports = Configuration;
