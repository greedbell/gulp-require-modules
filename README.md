# gulp-require-modules

move required modules in node_modules to a new folder.

## Install

```
$ npm install --save-dev gulp-require-modules
```

## Usage

### no replace

```
var gulp = require('gulp');
var requireModules = require('gulp-require-modules');

gulp.task('default', function () {
    return gulp.src('src/*.js')
        .pipe(requireModules({dist: false}))
        .pipe(gulp.dest());
});
```

this will:

* copy required modules in `node_modules` to `dist/npm`
* save manifest to file `dist/require-modules.json`

### replace

```
var gulp = require('gulp');
var requireModules = require('gulp-require-modules');
var dist = 'dist';
gulp.task('default', function () {
    return gulp.src('src/*.js')
        .pipe(requireModules({dist: true, fromDirectory:'src', distDirectory: dist}))
        .pipe(gulp.dest(dist));
});
```

this will:

* copy required modules in `node_modules` to `dist/node_modules`
* save manifest to file `dist/require-modules.json`
* replace `require(modules)` to `require('./npm/module/index.js')`.

## API

### requireModules([options])

#### options

modulesDirectory: `string` Default: `'dist/node_modules'`

the new directory for modules

modulesManifestPath: `string` Default: `'dist/require-modules.json'`

path of manifest file

dist: `boolean` Default: `true`

whether the requires in the file will be modified to new path.

distDirectory: `string` Default: `'dist'`

the directory where input file will be disted to. if `null`, the requires of the file will not be modified.

fromDirectory: `string` Default: `'src'`

the directory where input file is from. if `null`, use process.cwd

## Require

### support

* `require('module')`
* `require('./module/file')`
* `require('./module/file.js')`
* `require('./module/folder')`
* `require('readable-stream/transform')`
