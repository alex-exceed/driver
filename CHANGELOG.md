# ChangeLog - DataStax Node.js Driver

## 2.2.2

2015-10-14

### Features

- [NODEJS-187] - Expose Metadata prototype to be available for _promisification_

### Bug Fixes

- [NODEJS-160] - Error setting routing keys before query execution
- [NODEJS-175] - Select from table after a new field is added to a UDT can result in callback never fired
- [NODEJS-185] - Metadata fetch of table with ColumnToCollectionType fails

## 2.2.1

2015-09-14

### Features

- [NODEJS-162] - Add coordinator of query to error object

### Bug Fixes

- [NODEJS-154] - Local datacenter could not be determined
- [NODEJS-165] - Driver 2.2 fails to connect under windows server for cassandra 2.1

## 2.2.0

2015-08-10

### Notable Changes

- **Client**: All requests use `readTimeout` that can be configured in the `socketOptions`, enabled by default to
12secs
- **Client**: Now exposes topology and node status change events: `hostAdd`, `hostRemove`, `hostUp` and `hostDown`

### Features

- [NODEJS-140] - WhiteListPolicy
- [NODEJS-114] - Client-Configurable High Level Request Timeout
- [NODEJS-138] - Provide option to open all connections at startup
- [NODEJS-149] - Expose node status and topology changes
- [NODEJS-152] - Enable client read timeout by default

### Bug Fixes

- [NODEJS-111] - Connect should callback in error after shutdown
- [NODEJS-151] - 'All host(s) tried for query failed' error immediately after Cassandra node failure
- [NODEJS-156] - RequestHandler retry should not use a new query plan
- [NODEJS-157] - Control connection can fail and not be re-established if it errors on initOnConnection

## 2.2.0-rc1

2015-06-18

### Notable Changes

- Added support for Cassandra 2.2 and native protocol v4

### Features

- [NODEJS-117] - Small int and byte types for C* 2.2
- [NODEJS-118] - Support new date and time types
- [NODEJS-121] - Distinguish between `NULL` and `UNSET` values in Prepared Statements
- [NODEJS-122] - Add support for client warnings
- [NODEJS-123] - Support Key-value payloads in native protocol v4
- [NODEJS-124] - Use PK columns from v4 prepared responses
- [NODEJS-125] - Support UDF and Aggregate Function Schema Meta
- [NODEJS-126] - Add client address to query trace
- [NODEJS-129] - Support server error in Startup response for C* 2.1
- [NODEJS-131] - Handle new C* 2.2 errors

### Bug Fixes

- [NODEJS-119] - Rare 'write after end' error encountered while reconnecting with lower protocol version on nodejs 0.10.x
- [NODEJS-120] - Connection 'object is not a function' at Connection.handleResult
- [NODEJS-127] - Integer.toBuffer() gives wrong representation for positive numbers with the msb on
- [NODEJS-128] - getPeersSchemaVersions uses system.local instead of system.peers
- [NODEJS-136] - LocalDate fails to parse dates less than -271821-04-20 and greater than 275760-09-13
- [NODEJS-137] - DriverInternalError - No active connection found
- [NODEJS-139] - Use retry policy defined in the query options
- [NODEJS-141] - Node schema change - keyspace metadata does not exist
- [NODEJS-146] - Unhandled 'error' event caused by RST on Socket on Connection Initialization causes app to terminate
