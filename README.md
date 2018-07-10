<h1 align='center'>HecateJS</h1>

<p align='center'>Javascript Library for [Hecate](https://github.com/mapbox/Hecate), the persistent, mutable data store focused on GeoJSON first interchange</p>

# General Usage

## NodeJS Library

### Installation

```sh
yarn add '@mapbox/hecatejs'
```

### Instantiation

```js
const Hecate = require('@mapbox/hecatejs');

const hecate = new Hecate({
    url: 'example.com/hecate',
    port: 8000
});
```

### Registering a New User Account



## Command Line Interface

### Installation

```sh
yarn global add '@mapbox/hecate'
```

### Listing all options

```sh
./cli.js
```

or 

```sh
./cli.js help
```

### Registering a New User Account

```sh
./cli.js register
```
