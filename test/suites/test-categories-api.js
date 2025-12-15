const assert = require('node:assert/strict');
const Tools = require('pixl-tools');

exports.tests = [

	async function test_api_get_categories(test) {
		// list all categories
		let { data } = await this.request.json( this.api_url + '/app/get_categories/v1', {} );
		assert.ok( data.code === 0, "successful api response" );
		assert.ok( Array.isArray(data.rows), "expected rows array" );
		assert.ok( data.list && (data.list.length >= 0), "expected list metadata" );
	},

	async function test_api_get_category_missing_param(test) {
		// missing id param
		let { data } = await this.request.json( this.api_url + '/app/get_category/v1', {} );
		assert.ok( !!data.code, "expected error for missing id" );
	},

	async function test_api_get_category_missing(test) {
		// non-existent category
		let { data } = await this.request.json( this.api_url + '/app/get_category/v1', { id: 'nope' } );
		assert.ok( !!data.code, "expected error for missing category" );
	},

	async function test_api_create_category_missing_title(test) {
		// missing required title
		let { data } = await this.request.json( this.api_url + '/app/create_category/v1', { enabled: true } );
		assert.ok( !!data.code, "expected error for missing title" );
	},

	async function test_api_create_category_invalid_limit(test) {
		// invalid limit (duration must be number)
		let { data } = await this.request.json( this.api_url + '/app/create_category/v1', {
			"title": "Bad Cat",
			"enabled": true,
			"limits": [ { "enabled": true, "type": "time", "duration": "nope" } ]
		});
		assert.ok( !!data.code, "expected error for invalid limit" );
	},

	async function test_api_create_category_invalid_action(test) {
		// invalid action (email requires users array or email string)
		let { data } = await this.request.json( this.api_url + '/app/create_category/v1', {
			"title": "Bad Cat 2",
			"enabled": true,
			"actions": [ { "enabled": true, "condition": "error", "type": "email" } ]
		});
		assert.ok( !!data.code, "expected error for invalid action" );
	},

	async function test_api_create_category(test) {
		// create new category
		let { data } = await this.request.json( this.api_url + '/app/create_category/v1', {
			"title": "Unit Test Category",
			"enabled": true,
			"color": "plain",
			"icon": "",
			"notes": "Created by unit tests",
			"limits": [ { "enabled": true, "type": "time", "duration": 120 } ],
			"actions": [ { "enabled": true, "condition": "error", "type": "email", "users": ["admin"] } ]
		});
		assert.ok( data.code === 0, "successful api response" );
		assert.ok( data.category && data.category.id, "expected category in response" );
		this.category_id = data.category.id;
	},

	async function test_api_get_new_category(test) {
		// fetch our category
		let { data } = await this.request.json( this.api_url + '/app/get_category/v1', { id: this.category_id } );
		assert.ok( data.code === 0, "successful api response" );
		assert.ok( data.category && data.category.id === this.category_id, "category id unexpected" );
		assert.ok( data.category.title === 'Unit Test Category', "unexpected category title" );
		assert.ok( Array.isArray(data.category.limits) && data.category.limits.length === 1, "expected limits array with one entry" );
		assert.ok( data.category.limits[0].type === 'time' && data.category.limits[0].duration === 120, "unexpected limit content" );
		assert.ok( Array.isArray(data.category.actions) && data.category.actions.length === 1, "expected actions array with one entry" );
		assert.ok( data.category.actions[0].type === 'email' && data.category.actions[0].enabled === true, "unexpected action content" );
	},

	async function test_api_update_category_missing_id(test) {
		// update without id should error
		let { data } = await this.request.json( this.api_url + '/app/update_category/v1', { title: 'oops' } );
		assert.ok( !!data.code, "expected error for missing id" );
	},

	async function test_api_update_category(test) {
		// update our category
		let { data } = await this.request.json( this.api_url + '/app/update_category/v1', {
			id: this.category_id,
			title: 'UTC v2',
			color: 'blue'
		});
		assert.ok( data.code === 0, "successful api response" );
	},

	async function test_api_update_category_invalid_limit(test) {
		// invalid limit on update (amount must be number)
		let { data } = await this.request.json( this.api_url + '/app/update_category/v1', {
			id: this.category_id,
			limits: [ { enabled: true, type: 'file', amount: 'five' } ]
		});
		assert.ok( !!data.code, "expected error for invalid limit on update" );
	},

	async function test_api_update_category_invalid_action(test) {
		// invalid action on update (invalid condition)
		let { data } = await this.request.json( this.api_url + '/app/update_category/v1', {
			id: this.category_id,
			actions: [ { enabled: true, condition: 'nope', type: 'email', users: ['admin'] } ]
		});
		assert.ok( !!data.code, "expected error for invalid action on update" );
	},

	async function test_api_get_updated_category(test) {
		// verify updates
		let { data } = await this.request.json( this.api_url + '/app/get_category/v1', { id: this.category_id } );
		assert.ok( data.code === 0, "successful api response" );
		assert.ok( data.category && data.category.title === 'UTC v2', "unexpected category title" );
		assert.ok( data.category.color === 'blue', "unexpected category color" );
	},

	async function test_api_delete_category_missing_id(test) {
		// delete without id should error
		let { data } = await this.request.json( this.api_url + '/app/delete_category/v1', {} );
		assert.ok( !!data.code, "expected error for missing id" );
	},

	async function test_api_delete_category_nonexistent(test) {
		// delete non-existent category should error
		let { data } = await this.request.json( this.api_url + '/app/delete_category/v1', { id: 'nope' } );
		assert.ok( !!data.code, "expected error for missing category" );
	},

	async function test_api_delete_category(test) {
		// delete our category
		let { data } = await this.request.json( this.api_url + '/app/delete_category/v1', { id: this.category_id } );
		assert.ok( data.code === 0, "successful api response" );
	},

	async function test_api_get_category_deleted(test) {
		// ensure deleted
		let { data } = await this.request.json( this.api_url + '/app/get_category/v1', { id: this.category_id } );
		assert.ok( !!data.code, "expected error for missing category" );
		delete this.category_id;
	},

	async function test_api_create_category_final(test) {
		// create a final category for use by other suites
		let { data } = await this.request.json( this.api_url + '/app/create_category/v1', {
			"title": "Unit Test Category Final",
			"enabled": true,
			"color": "plain",
			"notes": "Keep me for future tests"
		});
		assert.ok( data.code === 0, "successful api response" );
		assert.ok( data.category && data.category.id, "expected category in response" );
		this.category_final_id = data.category.id;
	}

];
