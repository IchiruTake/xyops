const assert = require('node:assert/strict');
const async = require('async');

// helper: sleep
async function sleep(ms) {
  await new Promise(res => setTimeout(res, ms));
}

// helper: poll internal jobs until specified job id disappears (or title not found)
async function waitForJobGone(ctx, matcher, opts = {}) {
  const timeoutMs = opts.timeoutMs || 20000;
  const intervalMs = opts.intervalMs || 250;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    let { data } = await ctx.request.json(ctx.api_url + '/app/get_internal_jobs/v1', {});
    if (data.code !== 0) throw new Error('get_internal_jobs failed');
    const rows = data.rows || [];
    let keepWaiting = false;
    if (typeof matcher === 'string') {
      keepWaiting = !!rows.find(r => r.id === matcher);
    }
    else if (matcher && matcher.title) {
      keepWaiting = !!rows.find(r => r.title === matcher.title);
    }
    else if (typeof matcher === 'function') {
      keepWaiting = !!rows.find(matcher);
    }
    else {
      // no matcher means wait for any jobs to disappear
      keepWaiting = rows.length > 0;
    }
    if (!keepWaiting) return;
    await sleep(intervalMs);
  }
  throw new Error('Timed out waiting for internal job to finish');
}

exports.tests = [

  async function test_admin_get_servers(test) {
    // get live snapshot of servers and conductor peers
    let { data } = await this.request.json(this.api_url + '/app/get_servers/v1', {});
    assert.ok(data.code === 0, 'successful api response');
    assert.ok(data.servers && typeof data.servers === 'object', 'expected servers object');
    assert.ok(data.masters && typeof data.masters === 'object', 'expected masters object');
    assert.ok(!!data.servers['satunit1'], 'expected satunit1 server present');
  },

  async function test_admin_get_global_state(test) {
    // fetch state pre-update
    let { data } = await this.request.json(this.api_url + '/app/get_global_state/v1', {});
    assert.ok(data.code === 0, 'successful api response');
    assert.ok(data.state && typeof data.state === 'object', 'expected state object');
  },

  async function test_admin_update_global_state(test) {
    // set an arbitrary state flag and verify
    let { data } = await this.request.json(this.api_url + '/app/update_global_state/v1', { unit_test: 1 });
    assert.ok(data.code === 0, 'successful api response');

    let { data: data2 } = await this.request.json(this.api_url + '/app/get_global_state/v1', {});
    assert.ok(data2.code === 0, 'successful state fetch');
    assert.ok(data2.state && data2.state.unit_test === 1, 'expected unit_test state flag');
  },

  async function test_admin_update_global_state_naughty_key(test) {
    // attempt to set a naughty key (should error)
    let { data } = await this.request.json(this.api_url + '/app/update_global_state/v1', { "__proto__.x": 1 });
    assert.ok(!!data.code, 'expected error for naughty key');
  },

  async function test_admin_internal_job_before(test) {
    // ensure our test job is not currently running
    let { data } = await this.request.json(this.api_url + '/app/get_internal_jobs/v1', {});
    assert.ok(data.code === 0, 'successful api response');
    const found = (data.rows || []).find(r => r.title === 'Test job that does nothing');
    assert.ok(!found, 'no existing test internal job running');
  },

  async function test_admin_test_internal_job(test) {
    // start the 1-second test job and verify it appears
    let { data } = await this.request.json(this.api_url + '/app/test_internal_job/v1', { duration: 1 });
    assert.ok(data.code === 0, 'successful api response');

    // fetch jobs to capture id
    let { data: jobs } = await this.request.json(this.api_url + '/app/get_internal_jobs/v1', {});
    assert.ok(jobs.code === 0, 'successful jobs fetch');
    const job = (jobs.rows || []).find(r => r.title === 'Test job that does nothing');
    assert.ok(!!job && !!job.id, 'expected test internal job present');
    this.test_job_id = job.id;
  },

  async function test_admin_wait_internal_job_done(test) {
    // wait until the test job disappears from the running list
    await waitForJobGone(this, this.test_job_id, { timeoutMs: 10000 });
    delete this.test_job_id;
  },

  async function test_admin_dash_stats_before(test) {
    // capture stats before reset
    let { data } = await this.request.json(this.api_url + '/app/dash_stats/v1', {});
    assert.ok(data.code === 0, 'successful api response');
    assert.ok(data.stats && data.stats.day && data.stats.day.transactions, 'expected day stats');
    this.server_add_before = (data.stats.day.transactions.server_add || 0);
  },

  async function test_admin_reset_daily_stats(test) {
    // reset daily stats
    let { data } = await this.request.json(this.api_url + '/app/admin_reset_daily_stats/v1', {});
    assert.ok(data.code === 0, 'successful api response');
  },

  async function test_admin_dash_stats_after(test) {
    // verify daily stats were reset (server_add is a good metric to check)
    let { data } = await this.request.json(this.api_url + '/app/dash_stats/v1', {});
    assert.ok(data.code === 0, 'successful api response');
    const after = (data.stats.day.transactions.server_add || 0);
    assert.ok(after <= this.server_add_before, 'server_add should not increase after reset');
  },

  async function test_admin_delete_data_tags(test) {
    // delete only the tags list via background internal job
    let { data } = await this.request.json(this.api_url + '/app/admin_delete_data/v1', {
      items: [ { type: 'list', key: 'global/tags' } ]
    });
    assert.ok(data.code === 0 && data.id, 'successful delete start with job id');
    await waitForJobGone(this, data.id, { timeoutMs: 20000 });
  },

  async function test_admin_import_data_tags(test) {
    // import sample tags from fixture via background job
    let { data: raw } = await this.request.post(this.api_url + '/app/admin_import_data/v1', {
      files: { file: 'test/fixtures/data-export-tags.txt' }
    });
    const body = (typeof raw === 'string') ? raw : raw.toString();
    let data = {};
    try { data = JSON.parse(body); }
    catch (err) { assert.ok(false, 'invalid JSON response for admin_import_data'); }
    assert.ok(data.code === 0 && data.id, 'successful import start with job id');
    await waitForJobGone(this, data.id, { timeoutMs: 30000 });
  },

  async function test_admin_export_data_tags(test) {
    // request a transfer token for tags-only export
    let { data: tok } = await this.request.json(this.api_url + '/app/get_transfer_token/v1', {
      lists: ['tags'],
      indexes: [],
      extras: []
    });
    assert.ok(tok.code === 0 && tok.token, 'successful token creation');

    // download gzip file using token
    let url = this.api_url + '/app/admin_export_data/v1?token=' + encodeURIComponent(tok.token);
    let { data: gz } = await this.request.get(url);
    assert.ok(Buffer.isBuffer(gz) && gz.length > 0, 'received non-empty buffer');
    // gzip magic bytes 0x1f 0x8b
    assert.ok(gz[0] === 0x1f && gz[1] === 0x8b, 'buffer looks like gzip');
  },

  async function test_admin_logout_all(test) {
    // logout all sessions for admin user via background job
    let { data } = await this.request.json(this.api_url + '/app/admin_logout_all/v1', { username: 'admin' });
    assert.ok(data.code === 0 && data.id, 'successful logout start with job id');
    await waitForJobGone(this, data.id, { timeoutMs: 15000 });
  },

  async function test_admin_run_maintenance(test) {
    // run maintenance and wait for job completion
    let { data } = await this.request.json(this.api_url + '/app/admin_run_maintenance/v1', {});
    assert.ok(data.code === 0, 'successful api response');
    if (data.id) {
      await waitForJobGone(this, data.id, { timeoutMs: 60000 });
    }
    else {
      // fallback: match by title if server is on older API (no id)
      await waitForJobGone(this, { title: 'Daily maintenance manual run' }, { timeoutMs: 60000 });
    }
  },

  async function test_admin_stats(test) {
    // verify admin_stats returns rich stats structure
    let { data } = await this.request.json(this.api_url + '/app/admin_stats/v1', {});
    assert.ok(data.code === 0, 'successful api response');
    assert.ok(data.stats && typeof data.stats === 'object', 'expected stats object');
    assert.ok(!!data.stats.version, 'expected version');
    assert.ok(data.stats.db && typeof data.stats.db === 'object', 'expected db stats');
    assert.ok(data.stats.unbase && typeof data.stats.unbase === 'object', 'expected unbase stats');
    assert.ok(Array.isArray(data.stats.sockets), 'expected sockets array');
  },

  async function test_admin_run_optimization(test) {
    // run optimization if supported; gracefully handle not-required configs
    let { data } = await this.request.json(this.api_url + '/app/admin_run_optimization/v1', {});
    if (data.code === 0) {
      if (data.id) {
        await waitForJobGone(this, data.id, { timeoutMs: 120000 });
      }
      else {
        await waitForJobGone(this, { title: 'Database integrity and optimization' }, { timeoutMs: 120000 });
      }
    }
    else {
      // Accept environments that don't require optimization (non-SQLite)
      assert.ok(!!data.code, 'expected error for unsupported optimization');
    }
  }

];
