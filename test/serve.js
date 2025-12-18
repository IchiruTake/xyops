// xyOps Server - Run foreground server pointed at unit test data
// Copyright (c) 2019 - 2026 PixlCore LLC
// Released under the BSD 3-Clause License.
// See the LICENSE.md file in this repository.

var Echo = require('../lib/echo.js');

// enable debug and echo
process.env['XYOPS_debug'] = 'true';
process.env['XYOPS_echo'] = 'xyOps Transaction Error error API Unbase Action Comm Job Workflow Maint Multi Scheduler SSO User Ticket Alert';
process.env['XYOPS_color'] = 'true';
process.env['XYOPS_repl'] = 'true';

// override the overrides with our test overrides
process.env['XYOPS_config_overrides_file'] = 'test/fixtures/overrides.json';

// chdir to the proper server root dir
process.chdir( require('path').dirname( __dirname ) );

// load pixl-server
const server = require('../lib/loader.js');

server.on('init', function() {
	// setup fancy echo / repl system, if enabled
	Echo.setup(server);
});

// start pixl-server
server.startup( function() {
	// server startup complete
	
}); // server.startup
