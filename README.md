# gulp-require-modules

move required modules in node_modules to a new folder.

## Install

```
$ npm install --save-dev gulp-require-modules
```

## Usage

```
var gulp = require('gulp');
var requireModules = require('gulp-require-modules');

gulp.task('default', function () {
    return gulp.src('src/*.js')
        .pipe(requireModules())
        .pipe(gulp.dest('dist'));
});
```

this will:

* copy required modules in `node_modules` to `dist/npm`
* save manifest to file `dist/require-modules.json`
* replace `require(modules)` to `require('./dist/npm/module/index.js')`.

## API

### requireModules([options])

#### options

modulesDirectory: `string` Default: `'dist/npm'`

the new directory for modules

manifestPath: `string` Default: `'dist/require-modules.json'`

path of manifest file

replace: `boolean` Default: `false`

whether replace require path

## Require

### support

* `require('module')`
* `require('./module/file')`
* `require('./module/file.js')`
* `require('./module/folder')`

### not support

* `require('readable-stream/transform')`
