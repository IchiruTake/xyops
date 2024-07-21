// Generate Sample Data
// Usage: node bin/gen-sample-data.js > conf/sample-data.json
// Then: node bin/storage-cli.js run conf/sample-data.json

var Tools = require('pixl-tools');
var Request = require('pixl-request');
var request = new Request();
request.setAutoError(true);

var data = {
	storage: []
};

request.json( 'https://random-data-api.com/api/company/random_company?size=100', null, function(err, resp, companies, perf) {
	var industries = {};
	var phrases = {};
	companies.forEach( function(company) {
		// console.log( company.industry );
		industries[ company.industry ] = 1;
		phrases[ company.catch_phrase ] = 1;
	} );
	industries = Object.keys(industries);
	phrases = Object.keys(phrases);
	
	// console.log( industries, phrases );
	
	for (var idx = 1; idx <= 10; idx++) {
		var now = Tools.timeNow(true) - Math.floor( Math.random() * 864000 );
		data.storage.push([ "listPush", "global/categories", {
			"id": "cat" + idx,
			"title": industries.shift(),
			"enabled": true,
			"sort_order": idx,
			"username": "admin",
			"modified": now,
			"created": now,
			"notes": "",
			"limits": [],
			"actions": []
		} ]);
	}
	
	for (var idx = 1, len = phrases.length; idx <= len; idx++) {
		var now = Tools.timeNow(true) - Math.floor( Math.random() * 864000 );
		var event = {
			"id": "event" + idx,
			"title": phrases.shift(),
			"enabled": Math.random() > 0.1,
			"username": "admin",
			"modified": now,
			"created": now,
			"category": 'cat' + Math.floor( (Math.random() * 10) + 1 ),
			"targets": ["main"],
			"notes": "",
			"limits": [],
			"actions": []
		};
		
		// plugin & params
		switch (Math.floor(Math.random() * 3)) {
			case 0:
				event.plugin = 'shellplug';
				event.params = {
					script: "#!/bin/bash\n\nsleep " + Math.floor(Math.random() * 60) + ";\necho HELLO;\n",
					annotate: false,
					json: false
				};
			break;
			
			case 1:
				event.plugin = 'testplug';
				event.params = {
					duration: Math.floor(Math.random() * 60),
					action: 'Success',
					progress: true,
					burn: false,
					secret: 'foo'
				};
			break;
			
			case 2:
				event.plugin = 'urlplug';
				event.params = {
					method: 'GET',
					url: 'http://localhost:3012/api/app/echo',
					headers: '',
					data: '',
					timeout: 30,
					success_match: '',
					error_match: '',
					follow: false,
					ssl_cert_bypass: false
				};
			break;
		}
		
		// timings
		var dargs = Tools.getDateArgs( Tools.timeNow(true) + Math.floor( Math.random() * 86400 * 365 ) );
		switch (Math.floor(Math.random() * 7)) {
			case 0:
				event.timings = [{
					type: 'schedule',
					enabled: true,
					years: [ dargs.year ],
					months: [ dargs.mon ],
					days: [ dargs.mday ],
					hours: [ dargs.hour ],
					minutes: [ dargs.min ]
				}];
			break;
			
			case 1:
				event.timings = [{
					type: 'schedule',
					enabled: true,
					// years: [ dargs.year ],
					months: [ dargs.mon ],
					days: [ dargs.mday ],
					hours: [ dargs.hour ],
					minutes: [ dargs.min ]
				}];
			break;
			
			case 2:
				event.timings = [{
					type: 'schedule',
					enabled: true,
					// years: [ dargs.year ],
					// months: [ dargs.mon ],
					days: [ dargs.mday ],
					hours: [ dargs.hour ],
					minutes: [ dargs.min ]
				}];
			break;
			
			case 3:
				event.timings = [{
					type: 'schedule',
					enabled: true,
					// years: [ dargs.year ],
					// months: [ dargs.mon ],
					// days: [ dargs.mday ],
					hours: [ dargs.hour ],
					minutes: [ dargs.min ]
				}];
			break;
			
			case 4:
				event.timings = [{
					type: 'schedule',
					enabled: true,
					// years: [ dargs.year ],
					// months: [ dargs.mon ],
					// days: [ dargs.mday ],
					// hours: [ dargs.hour ],
					minutes: [ dargs.min ]
				}];
			break;
			
			case 5:
				event.timings = [{
					type: 'schedule',
					enabled: true,
					// years: [ dargs.year ],
					// months: [ dargs.mon ],
					// days: [ dargs.mday ],
					weekdays: [ dargs.wday ],
					hours: [ dargs.hour ],
					minutes: [ dargs.min ]
				}];
			break;
			
			case 6:
				event.timings = [{
					type: 'single',
					enabled: true,
					epoch: dargs.epoch
				}];
			break;
		}
		
		if (Math.random() < 0.1) event.timings.push({ type: 'catchup', enabled: true });
		
		data.storage.push([ "listPush", "global/events", event ]);
	}
	
	console.log( JSON.stringify(data, null, "\t") );
} );

