const assert = require('node:assert/strict');

exports.tests = [

	async function test_api_upload_files(test) {
		// upload a file for the current user
		let { data: raw } = await this.request.post( this.api_url + '/app/upload_files/v1', {
			files: { file1: 'test/fixtures/rgb-ramp.png' }
		});
		let body = (typeof raw === 'string') ? raw : raw.toString();
		let data = {};
		try { data = JSON.parse(body); }
		catch (err) { assert.ok(false, 'invalid JSON response for upload_files'); }
		assert.ok( data.code === 0, "successful api response" );
		assert.ok( Array.isArray(data.urls) && data.urls.length >= 1, "expected urls array" );
		assert.ok( /^https?:\/\//.test(data.urls[0]), "url should be absolute" );
		this.uploaded_file_url = data.urls[0];
	},

	async function test_api_file_view_direct(test) {
		// view file via absolute URL
		let { resp, data } = await this.request.get( this.uploaded_file_url );
		assert.ok( resp.statusCode === 200, "HTTP 200 for file" );
		assert.ok( resp.headers['content-type'] && resp.headers['content-type'].includes('image/png'), "content-type image/png" );
		assert.ok( data && data.length > 0, "received file data" );
		// PNG signature: 89 50 4E 47 0D 0A 1A 0A
		assert.ok( data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47, "PNG signature present" );
	},

	async function test_api_file_view_via_api(test) {
		// view same file via /api/app/file/v1?path=...
		const idx = this.uploaded_file_url.indexOf('/files/');
		assert.ok( idx > 0, "url contains /files/" );
		const rel = this.uploaded_file_url.substring(idx + 7); // after /files/
		let { resp, data } = await this.request.get( this.api_url + '/app/file/v1?path=' + encodeURIComponent(rel) );
		assert.ok( resp.statusCode === 200, "HTTP 200 for file via API" );
		assert.ok( resp.headers['content-type'] && resp.headers['content-type'].includes('image/png'), "content-type image/png (api)" );
		assert.ok( data && data.length > 0, "received file data (api)" );
	}

];

