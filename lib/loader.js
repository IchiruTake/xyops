// xyOps Server - Loader script
// Copyright (c) 2019 - 2026 PixlCore LLC
// Released under the BSD 3-Clause License.
// See the LICENSE.md file in this repository.

var PixlServer = require("pixl-server");
var server = new PixlServer({
	
	__name: 'xyOps',
	__version: require('../package.json').version,
	
	"multiConfig": [
		{
			"file": "conf/config.json"
		},
		{
			"file": "conf/sso.json",
			"key": "SSO"
		},
		{
			"file": "internal/unbase.json",
			"key": "Unbase"
		},
		{
			"file": "internal/ui.json",
			"key": "ui"
		},
		{
			"file": "internal/intl.json",
			"key": "intl"
		}
	],
	
	components: [
		require('pixl-server-storage'),
		require('pixl-server-unbase'),
		require('pixl-server-web'),
		require('pixl-server-api'),
		require('pixl-server-user'),
		require('pixl-server-debug'),
		require('./engine.js')
	]
	
});

module.exports = server;
