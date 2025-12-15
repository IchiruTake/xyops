const assert = require('node:assert/strict');
const Tools = require('pixl-tools');

exports.tests = [
	
	async function test_api_get_bucket_missing_param(test) {
		// missing id param
		let { data } = await this.request.json( this.api_url + '/app/get_bucket/v1', {} );
		assert.ok( !!data.code, "expected error for missing id" );
	},

	async function test_api_create_bucket_missing_title(test) {
		// missing required title
		let { data } = await this.request.json( this.api_url + '/app/create_bucket/v1', {
			"enabled": true
		});
		assert.ok( !!data.code, "expected error for missing title" );
	},

	async function test_api_get_buckets(test) {
		// get all buckets
		let { data } = await this.request.json( this.api_url + '/app/get_buckets/v1', {} );
		assert.ok( data.code === 0, "successful api response" );
		assert.ok( data.list && (data.list.length >= 0), "expected list metadata" );
	},

	async function test_api_create_bucket(test) {
		// create new bucket with initial data
		let { data } = await this.request.json( this.api_url + '/app/create_bucket/v1', {
			"title": "Unit Test Bucket",
			"enabled": true,
			"icon": "",
			"notes": "Created by unit tests",
			"data": { "hello": "world" }
		});
		assert.ok( data.code === 0, "successful api response" );
		assert.ok( data.bucket, "expected bucket in response" );
		assert.ok( data.bucket.id, "expected bucket.id in response" );
		
		// save for later
		this.bucket_id = data.bucket.id;
	},

	async function test_api_get_bucket(test) {
		// fetch our new bucket by id
		let { data } = await this.request.json( this.api_url + '/app/get_bucket/v1', { id: this.bucket_id } );
		assert.ok( data.code === 0, "successful api response" );
		assert.ok( data.bucket && data.bucket.id === this.bucket_id, "bucket id unexpected" );
		assert.ok( data.data && data.data.hello === 'world', "unexpected bucket data" );
		assert.ok( Array.isArray(data.files), "expected files array" );
	},

	async function test_api_update_bucket(test) {
		// update bucket (shallow merge)
		let { data } = await this.request.json( this.api_url + '/app/update_bucket/v1', {
			"id": this.bucket_id,
			"notes": "unit test notes"
		});
		assert.ok( data.code === 0, "successful api response" );
	},

	async function test_api_update_bucket_missing_id(test) {
		// update without id should error
		let { data } = await this.request.json( this.api_url + '/app/update_bucket/v1', {
			"notes": "oops"
		});
		assert.ok( !!data.code, "expected error for missing id" );
	},

	async function test_api_update_bucket_not_found(test) {
		// update non-existent bucket should error
		let { data } = await this.request.json( this.api_url + '/app/update_bucket/v1', {
			"id": "nope",
			"notes": "nope"
		});
		assert.ok( !!data.code, "expected error for missing bucket" );
	},

	async function test_api_get_updated_bucket(test) {
		// verify update took
		let { data } = await this.request.json( this.api_url + '/app/get_bucket/v1', { id: this.bucket_id } );
		assert.ok( data.code === 0, "successful api response" );
		assert.ok( data.bucket && data.bucket.id === this.bucket_id, "bucket id unexpected" );
		assert.ok( data.bucket.notes === 'unit test notes', "unexpected bucket notes" );
	},

	async function test_api_upload_bucket_files(test) {
		// upload a file to our bucket
		let { data: raw } = await this.request.post( this.api_url + '/app/upload_bucket_files/v1', {
			data: { bucket: this.bucket_id },
			files: { file1: 'test/fixtures/rgb-ramp.png' }
		});
		let body = (typeof raw === 'string') ? raw : raw.toString();
		let data = {};
		try { data = JSON.parse(body); }
		catch (err) { assert.ok(false, 'invalid JSON response for upload_bucket_files'); }
		assert.ok( data.code === 0, "successful api response" );
	},

	async function test_api_upload_bucket_files_missing_files(test) {
		// upload with no files should error
		let { data: raw } = await this.request.post( this.api_url + '/app/upload_bucket_files/v1', {
			data: { bucket: this.bucket_id }
		});
		let body = (typeof raw === 'string') ? raw : raw.toString();
		let data = {};
		try { data = JSON.parse(body); }
		catch (err) { assert.ok(false, 'invalid JSON response for upload_bucket_files (neg)'); }
		assert.ok( !!data.code, "expected error for missing files" );
	},

	async function test_api_get_bucket_with_file(test) {
		// confirm file exists in bucket
		let { data } = await this.request.json( this.api_url + '/app/get_bucket/v1', { id: this.bucket_id } );
		assert.ok( data.code === 0, "successful api response" );
		assert.ok( Array.isArray(data.files) && data.files.length >= 1, "expected at least one file" );
		assert.ok( !!Tools.findObject(data.files, { filename: 'rgb-ramp.png' }), "expected rgb-ramp.png in files" );
	},

	async function test_api_delete_bucket_file(test) {
		// delete our uploaded file
		let { data } = await this.request.json( this.api_url + '/app/delete_bucket_file/v1', {
			"id": this.bucket_id,
			"filename": "rgb-ramp.png"
		});
		assert.ok( data.code === 0, "successful api response" );
	},

	async function test_api_delete_bucket_file_missing_filename(test) {
		// attempt delete without filename should error
		let { data } = await this.request.json( this.api_url + '/app/delete_bucket_file/v1', {
			"id": this.bucket_id
		});
		assert.ok( !!data.code, "expected error for missing filename" );
	},

	async function test_api_get_bucket_after_file_delete(test) {
		// verify file is gone
		let { data } = await this.request.json( this.api_url + '/app/get_bucket/v1', { id: this.bucket_id } );
		assert.ok( data.code === 0, "successful api response" );
		assert.ok( !Tools.findObject(data.files, { filename: 'rgb-ramp.png' }), "rgb-ramp.png should be deleted" );
	},

	async function test_api_delete_bucket(test) {
		// delete our bucket
		let { data } = await this.request.json( this.api_url + '/app/delete_bucket/v1', {
			"id": this.bucket_id
		});
		assert.ok( data.code === 0, "successful api response" );
	},

	async function test_api_delete_bucket_missing_id(test) {
		// delete without id should error
		let { data } = await this.request.json( this.api_url + '/app/delete_bucket/v1', {} );
		assert.ok( !!data.code, "expected error for missing id" );
	},

	async function test_api_get_bucket_deleted(test) {
		// ensure bucket is no longer fetchable
		let { data } = await this.request.json( this.api_url + '/app/get_bucket/v1', { id: this.bucket_id } );
		assert.ok( !!data.code, "expected error for missing bucket" );
		delete this.bucket_id;
	},

	async function test_api_create_bucket_final(test) {
		// create a new bucket for other suites to use later
		let { data } = await this.request.json( this.api_url + '/app/create_bucket/v1', {
			"title": "Unit Test Bucket Final",
			"enabled": true,
			"notes": "Keep me for future tests"
		});
		assert.ok( data.code === 0, "successful api response" );
		assert.ok( data.bucket && data.bucket.id, "expected bucket in response" );
		this.bucket_final_id = data.bucket.id;
	}

];
