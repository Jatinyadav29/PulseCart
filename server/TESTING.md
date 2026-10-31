# Backend testing

The backend uses Vitest for test execution, Supertest for HTTP requests, and a
dedicated MongoDB database for integration tests.

## Initial setup

1. Copy `.env.test.example` to `.env.test`.
2. Set `MONGODB_TEST_URI` to a database dedicated to testing. Its database name
   must contain `test`; the test lifecycle refuses any other database name.
3. Replace the example JWT values with test-only values. Never reuse production
   secrets or a production MongoDB URI.
4. Ensure the MongoDB instance is reachable from the test process.

The test setup maps `MONGODB_TEST_URI` to the application’s `MONGODB_URI`
environment variable before application modules are imported. Production
environment files and database configuration are not changed.

## Commands

Run the functional suites:

```shell
npm test
```

Run only unit or integration tests:

```shell
npm run test:unit
npm run test:integration
```

Other useful commands:

```shell
npm run test:watch
npm run test:coverage
npm run test:performance
```

The performance command is intentionally separate from functional tests.
Performance specs belong under `tests/performance` and should define explicit
latency or throughput thresholds before being added.

## Test organization

- `tests/unit`: isolated utilities, validators, and business logic. Mock
  dependencies when the dependency itself is not under test.
- `tests/integration`: Express routes, middleware, authentication, and real
  Mongoose interactions against the test database.
- `tests/setup`: environment bootstrap and database lifecycle helpers.
- `tests/fixtures`: reusable data factories and deterministic request inputs.
- `tests/performance`: separate performance workloads and thresholds.

Integration tests run without file-level parallelism and clear all Mongoose
collections after each test. This keeps tests isolated while using one
configured test database. Do not use production seed scripts or production
credentials from a test.

## Authentication tests

Login returns an access token and sets the `refreshToken` httpOnly cookie.
Supertest agents preserve that cookie across requests, which allows refresh
rotation and logout flows to be tested end to end. Protected requests should
send the access token with:

```js
.set("Authorization", `Bearer ${accessToken}`)
```

## Scope notes

The current application has authentication checks but no user role field or
role-based authorization middleware. Tests cover authenticated versus
unauthenticated access; role scenarios should be added when that production
capability exists rather than introducing test-only behavior.

`ioredis` is present in dependencies but no source module currently uses Redis.
There is therefore no Redis behavior to exercise yet. When Redis-backed
functionality is introduced, unit tests should mock the client and integration
tests should use an explicitly isolated Redis test instance.

Database failures and unexpected errors should be covered with focused tests
that mock the failing model/service at the unit boundary. Route integration
tests should keep real database interactions so they verify persistence,
indexes, validation, and cleanup behavior.
