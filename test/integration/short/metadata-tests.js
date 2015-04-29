"use strict";
var assert = require('assert');
var async = require('async');

var helper = require('../../test-helper');
var Client = require('../../../lib/client');
var utils = require('../../../lib/utils');
var types = require('../../../lib/types');
var vit = helper.vit;

describe('Metadata', function () {
  this.timeout(60000);
  before(helper.ccmHelper.start(2, {vnodes: true}));
  after(helper.ccmHelper.remove);
  describe('#keyspaces', function () {
    it('should keep keyspace information up to date', function (done) {
      var client = newInstance();
      client.connect(function (err) {
        assert.ifError(err);
        var m = client.metadata;
        assert.ok(m);
        assert.ok(m.keyspaces);
        assert.ok(m.keyspaces['system']);
        assert.ok(m.keyspaces['system'].strategy);
        async.series([
          helper.toTask(client.execute, client, "CREATE KEYSPACE ks1 WITH replication = {'class': 'SimpleStrategy', 'replication_factor' : 3}"),
          helper.toTask(client.execute, client, "CREATE KEYSPACE ks2 WITH replication = {'class': 'SimpleStrategy', 'replication_factor' : 2}"),
          helper.toTask(client.execute, client, "CREATE KEYSPACE ks3 WITH replication = {'class': 'SimpleStrategy', 'replication_factor' : 1}"),
          helper.toTask(client.execute, client, "CREATE KEYSPACE ks4 WITH replication = {'class': 'NetworkTopologyStrategy', 'datacenter1' : 1}")
        ], function (err) {
          function checkKeyspace(name, strategy, optionName, optionValue) {
            var ks = m.keyspaces[name];
            assert.ok(ks);
            assert.strictEqual(ks.strategy, strategy);
            assert.ok(ks.strategyOptions);
            assert.strictEqual(ks.strategyOptions[optionName], optionValue);
          }
          assert.ifError(err);
          assert.ok(Object.keys(m.keyspaces).length > 4);
          checkKeyspace('ks1', 'org.apache.cassandra.locator.SimpleStrategy', 'replication_factor', '3');
          checkKeyspace('ks2', 'org.apache.cassandra.locator.SimpleStrategy', 'replication_factor', '2');
          checkKeyspace('ks3', 'org.apache.cassandra.locator.SimpleStrategy', 'replication_factor', '1');
          checkKeyspace('ks4', 'org.apache.cassandra.locator.NetworkTopologyStrategy', 'datacenter1', '1');
          done();
        });
      });
    });
  });
  describe('#getUdt()', function () {
    vit('2.1', 'should return null if it does not exists', function (done) {
      var client = newInstance();
      client.connect(function (err) {
        assert.ifError(err);
        var m = client.metadata;
        m.getUdt('ks1', 'udt_does_not_exists', function (err, udtInfo) {
          assert.ifError(err);
          assert.strictEqual(udtInfo, null);
          done();
        });
      });
    });
    vit('2.1', 'should return the udt information', function (done) {
      var client = newInstance();
      var createUdtQuery1 = 'CREATE TYPE phone (alias text, number text, country_code int)';
      var createUdtQuery2 = 'CREATE TYPE address (street text, "ZIP" int, phones set<frozen<phone>>)';
      async.series([
        helper.toTask(client.connect, client),
        helper.toTask(client.execute, client, helper.createKeyspaceCql('ks_udt1', 3)),
        helper.toTask(client.execute, client, 'USE ks_udt1'),
        helper.toTask(client.execute, client, createUdtQuery1),
        helper.toTask(client.execute, client, createUdtQuery2),
        function checkPhoneUdt(next) {
          var m = client.metadata;
          m.getUdt('ks_udt1', 'phone', function (err, udtInfo) {
            assert.ifError(err);
            assert.ok(udtInfo);
            assert.strictEqual(udtInfo.name, 'phone');
            assert.ok(udtInfo.fields);
            assert.strictEqual(udtInfo.fields.length, 3);
            assert.strictEqual(udtInfo.fields[0].name, 'alias');
            assert.strictEqual(udtInfo.fields[0].type.code, types.dataTypes.varchar);
            assert.strictEqual(udtInfo.fields[1].name, 'number');
            assert.strictEqual(udtInfo.fields[1].type.code, types.dataTypes.varchar);
            assert.strictEqual(udtInfo.fields[2].name, 'country_code');
            assert.strictEqual(udtInfo.fields[2].type.code, types.dataTypes.int);
            next();
          });
        },
        function checkAddressUdt(next) {
          var m = client.metadata;
          m.getUdt('ks_udt1', 'address', function (err, udtInfo) {
            assert.ifError(err);
            assert.ok(udtInfo);
            assert.strictEqual(udtInfo.name, 'address');
            assert.strictEqual(udtInfo.fields.length, 3);
            assert.strictEqual(udtInfo.fields[0].name, 'street');
            assert.strictEqual(udtInfo.fields[0].type.code, types.dataTypes.varchar);
            assert.strictEqual(udtInfo.fields[1].name, 'ZIP');
            assert.strictEqual(udtInfo.fields[1].type.code, types.dataTypes.int);
            assert.strictEqual(udtInfo.fields[2].name, 'phones');
            assert.strictEqual(udtInfo.fields[2].type.code, types.dataTypes.set);
            assert.strictEqual(udtInfo.fields[2].type.info.code, types.dataTypes.udt);
            assert.strictEqual(udtInfo.fields[2].type.info.info.name, 'phone');
            assert.strictEqual(udtInfo.fields[2].type.info.info.fields.length, 3);
            assert.strictEqual(udtInfo.fields[2].type.info.info.fields[0].name, 'alias');
            next();
          });
        }
      ], done);
    });
  });
  describe('#getTrace()', function () {
    it('should retrieve the trace immediately after', function (done) {
      var client = newInstance();
      async.waterfall([
        client.connect.bind(client),
        function executeQuery(next) {
          client.execute('SELECT * FROM system.schema_keyspaces', [], { traceQuery: true}, next);
        },
        function getTrace(result, next) {
          client.metadata.getTrace(result.info.traceId, next);
        },
        function checkTrace(trace, next) {
          assert.ok(trace);
          assert.strictEqual(typeof trace.duration, 'number');
          assert.ok(trace.events.length);
          next();
        }
      ], done);
    });
    it('should retrieve the trace a few seconds after', function (done) {
      var client = newInstance();
      async.waterfall([
        client.connect.bind(client),
        function executeQuery(next) {
          client.execute('SELECT * FROM system.local', [], { traceQuery: true}, next);
        },
        function getTrace(result, next) {
          client.metadata.getTrace(result.info.traceId, function (err, trace) {
            setTimeout(function () {
              next(err, trace);
            }, 1500);
          });
        },
        function checkTrace(trace, next) {
          assert.ok(trace);
          assert.strictEqual(typeof trace.duration, 'number');
          assert.ok(trace.events.length);
          next();
        }
      ], done);
    });
  });
  describe('#getTable()', function () {
    var keyspace = 'ks_tbl_meta';
    before(function createTables(done) {
      var client = newInstance();
      var queries = [
        "CREATE KEYSPACE ks_tbl_meta WITH replication = {'class': 'SimpleStrategy', 'replication_factor' : 3}",
        "CREATE TABLE ks_tbl_meta.tbl1 (id uuid PRIMARY KEY, text_sample text)",
        "CREATE TABLE ks_tbl_meta.tbl2 (id uuid, text_sample text, PRIMARY KEY ((id, text_sample)))",
        "CREATE TABLE ks_tbl_meta.tbl3 (id uuid, text_sample text, PRIMARY KEY (id, text_sample))",
        "CREATE TABLE ks_tbl_meta.tbl4 (zck timeuuid, apk2 text, pk1 uuid, val2 blob, valz1 int, PRIMARY KEY ((pk1, apk2), zck))"
      ];
      async.eachSeries(queries, client.execute.bind(client), helper.wait(500, done));
    });
    it('should retrieve the metadata of a single partition key table', function (done) {
      var client = newInstance({ keyspace: keyspace});
      client.connect(function (err) {
        assert.ifError(err);
        client.metadata.getTable(keyspace, 'tbl1', function (err, table) {
          assert.ifError(err);
          assert.ok(table);
          assert.strictEqual(table.bloomFilterFalsePositiveChance, 0.01);
          assert.ok(table.caching);
          assert.strictEqual(typeof table.caching, 'string');
          done();
        });
      });
    });
    it('should retrieve the metadata of a composite partition key table');
    it('should retrieve the metadata of a partition key and clustering key table');
    it('should retrieve the metadata of a counter table');
  });
});

/** @returns {Client}  */
function newInstance(options) {
  return new Client(utils.extend({}, helper.baseOptions, options));
}
