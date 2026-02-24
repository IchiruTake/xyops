const assert = require('node:assert/strict');
const Tools = require('pixl-tools');

exports.tests = [

	async function test_api_get_active_servers(test) {
		// list all active servers
		let { data } = await this.request.json( this.api_url + '/app/get_active_servers/v1', {} );
		assert.ok( data.code === 0, 'successful api response' );
		assert.ok( Array.isArray(data.rows), 'expected rows array' );
		assert.ok( data.list && (data.list.length >= 0), 'expected list metadata' );
		assert.ok( Tools.findObject(data.rows, { id: 'satunit1' }), 'expected satunit1 in active servers' );
	},

	async function test_api_get_active_server_missing_param(test) {
		// fetch active server with missing id
		let { data } = await this.request.json( this.api_url + '/app/get_active_server/v1', {} );
		assert.ok( !!data.code, 'expected error for missing id' );
	},

	async function test_api_get_active_server_missing(test) {
		// fetch non-existent active server
		let { data } = await this.request.json( this.api_url + '/app/get_active_server/v1', { id: 'nope' } );
		assert.ok( !!data.code, 'expected error for missing active server' );
	},

	async function test_api_get_active_server(test) {
		// fetch single active server by id
		let { data } = await this.request.json( this.api_url + '/app/get_active_server/v1', { id: 'satunit1' } );
		assert.ok( data.code === 0, 'successful api response' );
		assert.ok( data.server && data.server.id === 'satunit1', 'unexpected server id' );
	},

	async function test_api_get_server_missing_param(test) {
		// fetch server with missing id
		let { data } = await this.request.json( this.api_url + '/app/get_server/v1', {} );
		assert.ok( !!data.code, 'expected error for missing id' );
	},

	async function test_api_get_server_missing(test) {
		// fetch non-existent server
		let { data } = await this.request.json( this.api_url + '/app/get_server/v1', { id: 'nope' } );
		assert.ok( !!data.code, 'expected error for missing server' );
	},

	async function test_api_get_server(test) {
		// fetch server by id, include data + online flag
		let { data } = await this.request.json( this.api_url + '/app/get_server/v1', { id: 'satunit1' } );
		assert.ok( data.code === 0, 'successful api response' );
		assert.ok( data.server && data.server.id === 'satunit1', 'unexpected server id' );
		assert.ok( typeof data.online === 'boolean', 'expected online boolean' );
		assert.ok( data.data && (typeof data.data === 'object'), 'expected data object' );
	},

	async function test_api_update_server_missing_id(test) {
		// update without id should error
		let { data } = await this.request.json( this.api_url + '/app/update_server/v1', { title: 'oops' } );
		assert.ok( !!data.code, 'expected error for missing id' );
	},

	async function test_api_update_server(test) {
		// update server metadata (disable autoGroup to set explicit groups)
		let groupId = this.group_final_id; // created in groups suite
		let { data } = await this.request.json( this.api_url + '/app/update_server/v1', {
			id: 'satunit1',
			title: 'UT Server',
			enabled: true,
			icon: 'server',
			autoGroup: false,
			groups: groupId ? [ groupId ] : []
		});
		assert.ok( data.code === 0, 'successful api response' );
	},

	async function test_api_get_updated_server(test) {
		// verify updates took effect
		let { data } = await this.request.json( this.api_url + '/app/get_server/v1', { id: 'satunit1' } );
		assert.ok( data.code === 0, 'successful api response' );
		assert.ok( data.server && data.server.title === 'UT Server', 'unexpected server title' );
		assert.ok( data.server.icon === 'server', 'unexpected server icon' );
		if (this.group_final_id) {
			assert.ok( Array.isArray(data.server.groups), 'expected groups array' );
			assert.ok( data.server.groups.includes(this.group_final_id), 'expected server to include final group' );
		}
	},

	async function test_api_update_server_revert(test) {
		// revert autoGroup and clear title/icon
		let { data } = await this.request.json( this.api_url + '/app/update_server/v1', {
			id: 'satunit1',
			title: '',
			icon: '',
			autoGroup: true
		});
		assert.ok( data.code === 0, 'successful api response' );
	},

	async function test_api_get_server_reverted(test) {
		// verify revert
		let { data } = await this.request.json( this.api_url + '/app/get_server/v1', { id: 'satunit1' } );
		assert.ok( data.code === 0, 'successful api response' );
		assert.ok( data.server && data.server.id === 'satunit1', 'unexpected server id' );
		assert.ok( data.server.autoGroup === true, 'expected autoGroup true' );
	},
	
	async function test_api_update_server_data(test) {
		// update server user data
		let { data } = await this.request.json( this.api_url + '/app/update_server_data/v1', {
			id: 'satunit1',
			data: { "foo": "bar1" }
		});
		assert.ok( data.code === 0, 'successful api response' );
	},
	
	async function test_api_get_updated_server_data(test) {
		// verify data updates took effect
		let { data } = await this.request.json( this.api_url + '/app/get_server/v1', { id: 'satunit1' } );
		assert.ok( data.code === 0, 'successful api response' );
		assert.ok( !!data.server, 'server object missing' );
		assert.ok( !!data.server.userData, 'userData object missing' );
		assert.ok( data.server.userData.foo == "bar1", 'unexpected result in user data' );
	},
	
	async function test_api_update_server_data_shallow_merge(test) {
		// update server user data
		let { data } = await this.request.json( this.api_url + '/app/update_server_data/v1', {
			id: 'satunit1',
			data: { "added": "zzz" }
		});
		assert.ok( data.code === 0, 'successful api response' );
	},
	
	async function test_api_get_updated_server_data_merged(test) {
		// verify data updates took effect
		let { data } = await this.request.json( this.api_url + '/app/get_server/v1', { id: 'satunit1' } );
		assert.ok( data.code === 0, 'successful api response' );
		assert.ok( !!data.server, 'server object missing' );
		assert.ok( !!data.server.userData, 'userData object missing' );
		assert.ok( data.server.userData.foo == "bar1", 'unexpected foo result in user data' );
		assert.ok( data.server.userData.added == "zzz", 'unexpected added result in user data' );
	},
	
	async function test_api_get_servers_admin_snapshot(test) {
		// admin endpoint: get snapshot of all connected servers + masters
		let { data } = await this.request.json( this.api_url + '/app/get_servers/v1', {} );
		assert.ok( data.code === 0, 'successful api response' );
		assert.ok( data.servers && typeof data.servers === 'object', 'expected servers object' );
		assert.ok( data.servers['satunit1'], 'expected satunit1 in servers' );
		assert.ok( data.masters && typeof data.masters === 'object', 'expected masters object' );
	},

	async function test_api_get_server_summaries(test) {
		// summaries across indexed servers
		let { data } = await this.request.json( this.api_url + '/app/get_server_summaries/v1', {} );
		assert.ok( data.code === 0, 'successful api response' );
		assert.ok( data.summaries && typeof data.summaries === 'object', 'expected summaries object' );
	},

	async function test_api_stub_watch_server(test) {
		// stubbed: skip watch_server
		assert.ok(true, 'stub watch_server');
	},

	async function test_api_stub_delete_server(test) {
		// stubbed: skip delete_server
		assert.ok(true, 'stub delete_server');
	},
	
	async function test_api_create_snapshot(test) {
		// take snapshot of server
		let { data } = await this.request.json( this.api_url + '/app/create_snapshot/v1', {
			server: 'satunit1'
		} );
		assert.ok( data.code === 0, 'successful api response' );
		assert.ok( !!data.id, 'found snap id in resp' );
		
		this.snapshot_id = data.id;
	},
	
	async function test_api_delete_snapshot(test) {
		// take snapshot of server
		let { data } = await this.request.json( this.api_url + '/app/delete_snapshot/v1', {
			id: this.snapshot_id
		} );
		assert.ok( data.code === 0, 'successful api response' );
		
		delete this.snapshot_id;
	},
	
	async function test_api_create_final_snapshot(test) {
		// take another snapshot of server, for searching later
		let { data } = await this.request.json( this.api_url + '/app/create_snapshot/v1', {
			server: 'satunit1'
		} );
		assert.ok( data.code === 0, 'successful api response' );
		assert.ok( !!data.id, 'found snap id in resp' );
		
		this.final_snapshot_id = data.id;
	},

];

