const assert = require('node:assert/strict');
const Tools = require('pixl-tools');

exports.tests = [
	
	async function test_api_get_alerts(test) {
		// get all alerts
		let { data } = await this.request.json( this.api_url + '/app/get_alerts/v1', {} );
		assert.ok( data.code === 0, "successful api response" );
		assert.ok( data.rows.length, "expected rows" );
		assert.ok( Tools.findObject(data.rows, { id: 'load_avg_high' } ), "expected load_avg_high" );
		assert.ok( data.list.length, "expected list length" );
	},

	async function test_api_get_alert_missing_param(test) {
		// fetch alert with missing id param
		let { data } = await this.request.json( this.api_url + '/app/get_alert/v1', {} );
		assert.ok( !!data.code, "expected error for missing id" );
	},

	async function test_api_get_alert(test) {
		// fetch single alert by id
		let { data } = await this.request.json( this.api_url + '/app/get_alert/v1', { id: 'load_avg_high' } );
		assert.ok( data.code === 0, "successful api response" );
		assert.ok( data.alert, "expected alert in response" );
		assert.ok( data.alert.id == 'load_avg_high', "alert id == load_avg_high" );
	},

	async function test_api_get_alert_missing(test) {
		// fetch non-existent alert
		let { data } = await this.request.json( this.api_url + '/app/get_alert/v1', { id: 'nope' } );
		assert.ok( !!data.code, "expected error for missing alert" );
	},

	async function test_api_create_alert_missing_title(test) {
		// create alert without required title
		let { data } = await this.request.json( this.api_url + '/app/create_alert/v1', {
			"expression": "monitors.cpu_usage >= 90",
			"message": "CPU usage is too high: {{pct(monitors.cpu_usage)}}"
		});
		assert.ok( !!data.code, "expected error for missing title" );
	},

	async function test_api_create_alert_missing_expression(test) {
		// create alert without required expression
		let { data } = await this.request.json( this.api_url + '/app/create_alert/v1', {
			"title": "High CPU Usage",
			"message": "CPU usage is too high: {{pct(monitors.cpu_usage)}}"
		});
		assert.ok( !!data.code, "expected error for missing expression" );
	},
	
	async function test_api_create_alert(test) {
		// create new alert
		let { data } = await this.request.json( this.api_url + '/app/create_alert/v1', {
			"title": "High CPU Usage",
			"expression": "monitors.cpu_usage >= 90",
			"message": "CPU usage is too high: {{pct(monitors.cpu_usage)}}",
			"groups": [],
			"email": "",
			"web_hook": "",
			"monitor_id": "cpu_usage",
			"enabled": true,
			"samples": 1,
			"notes": ""
		});
		assert.ok( data.code === 0, "successful api response" );
		assert.ok( data.alert, "expected alert in response" );
		assert.ok( data.alert.id, "expected alert.id in response" );
		
		// save our new alert id for later
		this.alert_id = data.alert.id;
	},
	
	async function test_api_get_new_alert(test) {
		// fetch our new alert by id
		let { data } = await this.request.json( this.api_url + '/app/get_alert/v1', { id: this.alert_id } );
		assert.ok( data.code === 0, "successful api response" );
		assert.ok( !!data.alert, "expected alert in response" );
		assert.ok( data.alert.id == this.alert_id, "alert id unexpected" );
	},
	
	async function test_api_update_alert(test) {
		// update our alert (shallow merge)
		let { data } = await this.request.json( this.api_url + '/app/update_alert/v1', {
			"id": this.alert_id,
			"notes": "unit test notes"
		});
		assert.ok( data.code === 0, "successful api response" );
	},

	async function test_api_update_alert_missing_id(test) {
		// update without id should error
		let { data } = await this.request.json( this.api_url + '/app/update_alert/v1', {
			"notes": "oops"
		});
		assert.ok( !!data.code, "expected error for missing id" );
	},
	
	async function test_api_get_updated_alert(test) {
		// make sure our changes took
		let { data } = await this.request.json( this.api_url + '/app/get_alert/v1', { id: this.alert_id } );
		assert.ok( data.code === 0, "successful api response" );
		assert.ok( !!data.alert, "expected alert in response" );
		assert.ok( data.alert.id == this.alert_id, "alert id unexpected" );
		assert.ok( data.alert.notes == "unit test notes", "unexpected alert notes" );
	},
	
	async function test_api_test_alert(test) {
		// test alert expression and message
		let { data } = await this.request.json( this.api_url + '/app/test_alert/v1', {
			"server": "satunit1",
			"expression": "monitors.cpu_usage >= 90",
			"message": "CPU usage is too high: {{pct(monitors.cpu_usage)}}",
		});
		assert.ok( data.code === 0, "successful api response" );
		assert.ok( !data.result, "expected result to be false" );
		assert.ok( !!data.message, "expected message to be present" );
		assert.ok( !!data.message.match(/CPU usage is too high/), "unexpected message content" );
	},

	async function test_api_test_alert_missing_server(test) {
		// test alert missing server should error
		let { data } = await this.request.json( this.api_url + '/app/test_alert/v1', {
			"expression": "monitors.cpu_usage >= 90",
			"message": "CPU usage is too high: {{pct(monitors.cpu_usage)}}"
		});
		assert.ok( !!data.code, "expected error for missing server" );
	},

	async function test_api_test_alert_missing_expression(test) {
		// test alert missing expression should error
		let { data } = await this.request.json( this.api_url + '/app/test_alert/v1', {
			"server": "satunit1",
			"message": "CPU usage is too high: {{pct(monitors.cpu_usage)}}"
		});
		assert.ok( !!data.code, "expected error for missing expression" );
	},
	
	async function test_api_delete_alert(test) {
		// delete our alert
		let { data } = await this.request.json( this.api_url + '/app/delete_alert/v1', {
			"id": this.alert_id
		});
		assert.ok( data.code === 0, "successful api response" );
	},

	async function test_api_delete_alert_missing_id(test) {
		// delete without id should error
		let { data } = await this.request.json( this.api_url + '/app/delete_alert/v1', {} );
		assert.ok( !!data.code, "expected error for missing id" );
	},

	async function test_api_delete_alert_missing(test) {
		// delete non-existent alert
		let { data } = await this.request.json( this.api_url + '/app/delete_alert/v1', { id: 'nope' } );
		assert.ok( !!data.code, "expected error for missing alert" );
	},
	
	async function test_api_get_alert_deleted(test) {
		// make sure our deleted alert is no longer fetchable
		let { data } = await this.request.json( this.api_url + '/app/get_alert/v1', { 
			id: this.alert_id
		} );
		assert.ok( !!data.code, "expected error for missing alert" );
		delete this.alert_id;
	}
	
];
