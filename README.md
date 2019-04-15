<h1 align='center'>HecateJS</h1>

<p align='center'>Javascript Library and CLI for <a href='https://github.com/mapbox/Hecate'>Hecate</a>, the persistent, mutable data store focused on GeoJSON first interchange</p>

## General Usage

### Installation

**JS Library**

```sh
yarn add '@mapbox/hecatejs'
```

**CLI**

```sh
yarn global add `@mapbox/hecatejs'
```

<h3 align=center>Instantiation</h3>

<details>

Note: if the username & password is not explicitly set, Hecate will fallback to checking for
a `HECATE_USERNAME` & `HECATE_PASSWORD` environment variable.

**JS Library**

```js
const Hecate = require('@mapbox/hecatejs');

const hecate = new Hecate({
    username: 'ingalls',
    password: 'yeaheh',
    url: 'example.com/hecate',
    port: 8000
});
```

**CLI**

The CLI tool must be provided the URL to connect to for each subcommand.
This can be accomplished by manually setting the URL/Port or by letting it
query for Hecate resources on a signed in AWS account.


The --url/port or --stack options must be provided for every subcommand
but are omitted in this guide for clarity.

```sh
./cli.js --url 'example.com' --port 8000
```

```sh
./cli.js --stack buildings
```
_Would find the AWS ELB for a CloudFormation stack called `hecate-internal-buildings`_

</details>

<h3 align=center>User Options</h3>

<details>

<p align=right><a href="https://github.com/mapbox/hecate#get-apiusercreate"><strong>Hecate Docs</strong></a></p>

<h4>Create a New User</h4>

By default, most hecate instances are fairly open and will allow a wide range
of operations without authentication. Editing however, and querying on boxes with
tighter access restrictions will require registering a new account.

**JS Library**

```js
const Hecate = require('@mapbox/hecatejs');

const hecate = new Hecate({
    url: 'example.com/hecate',
    port: 8000
});

hecate.register({
    username: 'ingalls',
    password: 'yeaheh',
    email: 'ingalls@protonmail.com'
}, (err, res) => {
    if (err) throw err;
});
```

**CLI**

```sh
./cli.js register
```

</details>

<h3 align=center>Authentication</h3>

<details>

<p align=right><a href="https://github.com/mapbox/hecate#get-apiauth"><strong>Hecate Docs</strong></a></p>

<h4>Authentication</h4>

**JS Library**

```js
const Hecate = require('@mapbox/hecatejs');

const hecate = new Hecate({
    url: 'example.com/hecate',
    port: 8000
});

hecate.auth({}, (err, res) => {
    if (err) throw err;
});
```

**CLI**

```sh
./cli.js auth
```
