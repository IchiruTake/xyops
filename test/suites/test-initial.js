const assert = require('node:assert/strict');

exports.tests = [
	
	async function testAdminLogin(test) {
		// initial admin login
		let { resp, data } = await this.request.json( this.api_url + '/user/login', { username: 'admin', password: 'admin' } );
		assert.ok( data.code === 0, "successful login" );
		
		assert.ok( !!resp.headers['set-cookie'], "found set-cookie header" );
		assert.ok( !!resp.headers['set-cookie'][0], "found set-cookie header" );
		
		const matches = resp.headers['set-cookie'][0].match(/session_id=(\w+)/);
		if (!matches) {
			assert.ok(false, "No session id found in set-cookie");
		}
		this.admin_session_id = matches[1];
		
		assert.ok( !!this.admin_session_id, "found session id" );
		this.request.setHeader('X-Session-ID', this.admin_session_id);
	},
	
	async function testAdminCreate(test) {
		// create a second account we can use going forward
		let { data } = await this.request.json( this.api_url + '/user/admin_create', {
			"username": "testuser",
			"password": "testuser",
			"full_name": "Test User",
			"email": "test@localhost",
			"active": 1,
			"privileges": {
				"admin": true
			},
			"roles": [] 
		} );
		assert.ok( data.code === 0, "successful user creation" );
	},
	
	async function testUserLogin(test) {
		// login our second user
		let { resp, data } = await this.request.json( this.api_url + '/user/login', { username: 'testuser', password: 'testuser' } );
		assert.ok( data.code === 0, "successful login" );
		
		assert.ok( !!resp.headers['set-cookie'], "found set-cookie header" );
		assert.ok( !!resp.headers['set-cookie'][0], "found set-cookie header" );
		
		const matches = resp.headers['set-cookie'][0].match(/session_id=(\w+)/);
		if (!matches) {
			assert.ok(false, "No session id found in set-cookie");
		}
		this.session_id = matches[1];
		
		assert.ok( !!this.session_id, "found session id" );
	},
	
	async function testAdminLogout(test) {
		// admin logout
		let { data } = await this.request.json( this.api_url + '/user/logout', {} );
		assert.ok( data.code === 0, "successful admin logout" );
		
		// update session id to use testuser going forward
		this.request.setHeader('X-Session-ID', this.session_id);
	}
	
];
