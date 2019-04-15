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

<h2 align=center>API Documentation</h2>

The [API documentation](/docs/API.md) can be found in the `docs/API.md` file. This file is automatically
generated from the internal JSDocs.
