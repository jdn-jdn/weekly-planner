# pga-sql

[![npm](https://img.shields.io/npm/v/pga-sql.svg?style=flat-square)](https://www.npmjs.com/package/pga-sql)
![Node.js](https://img.shields.io/badge/node.js-%3E=_6.4.0-blue.svg?style=flat-square)
[![Build Status](https://img.shields.io/travis/ConnorWiseman/pga-sql/master.svg?style=flat-square)](https://travis-ci.org/ConnorWiseman/pga-sql) [![Coverage](https://img.shields.io/codecov/c/github/ConnorWiseman/pga-sql.svg?style=flat-square)](https://codecov.io/gh/ConnorWiseman/pga-sql)
[![Dependencies Status](https://david-dm.org/ConnorWiseman/pga-sql/status.svg?style=flat-square)](https://david-dm.org/ConnorWiseman/pga-sql)
[![devDependencies Status](https://david-dm.org/ConnorWiseman/pga-sql/dev-status.svg?style=flat-square)](https://david-dm.org/ConnorWiseman/pga-sql?type=dev)
[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/ConnorWiseman/pga-sql/blob/master/LICENSE)

> A template tagging function that returns an object compatible with the [pg](https://github.com/brianc/node-postgres) module's querying methods.

## Installation

```shell
npm install --save pga-sql
```

## Usage

`pga-sql` provides a template tagging function that returns an object compatible with `node-postgres`'s querying methods and, by extension, [`pga`](https://github.com/ConnorWiseman/pga)'s  `query`, `parallel`, and `transact` methods. Template literal variable interpolation makes writing lengthy parameterized queries much cleaner.

Regular variables may be interpolated as string literals (without applying parameterized filtering from the `node-postgres` module) by prefixing them with an additional `$` character. This is unsafe, and should be used carefully.

### Query
```javascript
const pga = require('pga');
const sql = require('pga-sql');

var db = pga({
  user:     'postgres',
  password: '',
  database: 'postgres',
  host:     'localhost',
  port:     5432,
  max:      10
});

var id = 1;
var table = 'test';
var query = sql`SELECT * FROM $${table} WHERE id = ${id};`;

db.query(query, function(error, result) {
  if (error) {
    return console.error(error);
  }
  console.log(result);
});
```
