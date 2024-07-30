// Orchestra API Layer - Servers
// Copyright (c) 2023 - 2024 Joseph Huckaby
// Released under the MIT License

const fs = require('fs');
const assert = require("assert");
const async = require('async');
const Tools = require("pixl-tools");

class Servers {
	
	api_get_active_servers(args, callback) {
		// get list of all active servers from memory
		var self = this;
		var params = Tools.mergeHashes( args.params, args.query );
		if (!this.requireMaster(args, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
			
			var rows = Object.values(self.servers);
			
			callback({
				code: 0,
				rows: rows,
				list: { length: rows.length }
			});
		} ); // loaded session
	}
	
	api_get_active_server(args, callback) {
		// get single server record from memory
		var self = this;
		var params = Tools.mergeHashes( args.params, args.query );
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(params, {
			id: /^\w+$/
		}, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
			
			if (!self.servers[params.id]) {
				return self.doError('server', "Failed to locate server: " + params.id, callback);
			}
			
			callback({
				code: 0,
				server: self.servers[params.id]
			});
		} ); // loaded session
	}
	
	api_get_server(args, callback) {
		// get server from storage (including full minute monitoring data)
		var self = this;
		var params = Tools.mergeHashes( args.params, args.query );
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(params, {
			id: /^\w+$/
		}, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
			
			// load server host data
			var host_key = 'hosts/' + params.id + '/data';
			
			self.storage.get( host_key, function(err, data) {
				if (err) return self.doError('server', "Failed to load server data: " + err, callback);
				
				if (self.servers[params.id]) {
					// server is active
					callback({ code: 0, server: self.servers[params.id], data: data, online: true });
				}
				else {
					// load server from db (offline)
					self.unbase.get( 'servers', params.id, function(err, server) {
						if (err) return self.doError('server', "Failed to locate server: " + params.id, callback);
						callback({ code: 0, server: server, data: data, online: false });
					}); // unbase.get
				}
			} ); // storage.get
		} ); // loaded session
	}
	
	// Snapshot APIs:
	
	api_get_snapshot(args, callback) {
		// get single snapshot
		var self = this;
		var params = Tools.mergeHashes( args.params, args.query );
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(params, {
			id: /^\w+$/
		}, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
			
			self.unbase.get( 'snapshots', params.id, function(err, snapshot) {
				if (err) return self.doError('snapshot', "Failed to load snapshot: " + err, callback);
				
				callback({
					code: 0,
					snapshot: snapshot
				});
			} ); // unbase.get
		} ); // loaded session
	}
	
	api_create_snapshot(args, callback) {
		// add new snapshot for server
		// use host data already saved in last minute
		var self = this;
		var params = Tools.mergeHashes( args.params, args.query );
		if (!this.requireMaster(args, callback)) return;
		
		if (!this.requireParams(params, {
			server: /^\w+$/
		}, callback)) return;
		
		this.loadSession(args, function(err, session, user) {
			if (err) return self.doError('session', err.message, callback);
			if (!self.requireValidUser(session, user, callback)) return;
			if (!self.requirePrivilege(user, 'create_snapshots', callback)) return;
			
			self.createSnapshot(params.server, { source: 'user', username: user.username }, function(err, id) {
				if (err) return self.doError('snapshot', "Failed to create snapshot: " + err, callback);
				callback({ code: 0, id: id });
			}); // createSnapshot
			
		} ); // loadSession
	}
	
} // class Servers

module.exports = Servers;
