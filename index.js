/**
 * Created by Bell on 16/10/14.
 */

var through = require('through2');
var gutil = require('gulp-util');
var objectAssign = require('object-assign');
var fs = require('fs-extra');
var path = require('path');
var path_util = require('./path');
var PluginError = gutil.PluginError;

// consts
var PLUGIN_NAME = 'gulp-require-modules';
var node_modules = process.cwd() + '/node_modules/';
var manifest = {};
var transformedArray = [];

/**
 * require(./require
 * @param file
 * @returns {*}
 */
function getRequires(string) {
  var re = /require\(['"]([\.\/][\w\d\-\.\/]+)['"]\)/ig;
  return getMatches(string, re);
}

/**
 * require(module)
 * @param file
 * @returns {*}
 */
function getModules(string) {
  var re = /require\(['"]([\w\d\-]+)['"]\)/ig;
  return getMatches(string, re);
}

function getMatches(str, re) {
  if (str == null) {
    return null;
  }
  if (re == null) {
    return null;
  }
  var results = [];
  var match;
  while ((match = re.exec(str)) !== null) {
    results.push(match[1]);
  }
  // console.log('matches: ', results);
  return results;
}

/**
 * copy file is node_module to modulesDirectory
 * @param from
 * @param to
 * @param modulesDirectory
 */
function transformFile(from, to, modulesDirectory) {
  // console.log('from: ' + from);
  // console.log('to: ' + to);
  // return;
  var contents = fs.readFileSync(from, 'utf8');

  // modules
  var modules = getModules(contents);
  for (var index in modules) {
    var module = modules[index];
    // console.log('transformFile:manifest: ' + Object.keys(manifest));
    // console.log('transformFile:module: ' + module);
    // console.log('transformFile:manifest:module: ' + manifest[module]);

    if (transformedArray.indexOf(module) > 0) {
      continue;
    } else {
      transformedArray.push(module);
    }
    var modulePath = path_util.modulePath(module, node_modules);
    if (modulePath === null) {
      continue;
    }
    var targetPath = path_util.targetPath(modulePath, node_modules, modulesDirectory);
    if (!fs.existsSync(targetPath)) {
      transformFile(modulePath, targetPath, modulesDirectory);
    }
    // var relativePath = path.relative(targetPath, to);
    var relativePath = path.relative(to, targetPath);
    // console.log('transformFile:module: ' + module);
    // console.log('transformFile:targetPath: ' + targetPath);
    // console.log('transformFile:relativePath: ' + relativePath);
    // console.log('transformFile:to: ' + to);
    var re = eval('\/require\\\(\[\'\"\]' + module + '\[\'\"\]\\\)\/ig');
    // console.log('transformFile:re: ' + re);
    contents = contents.replace(re, 'require(\'' + relativePath + '\')');
  }

  // requires
  var requires = getRequires(contents);
  for (var index in requires) {
    var require = requires[index];
    if (transformedArray.indexOf(require) > 0) {
      continue;
    } else {
      transformedArray.push(require);
    }
    var requirePath = path_util.requirePath(from, require);
    // console.log('requirePath: ' + requirePath);
    if (requirePath === null) {
      continue;
    }
    var targetPath = path_util.targetPath(requirePath, node_modules, modulesDirectory);
    if (!fs.existsSync(targetPath)) {
      transformFile(requirePath, targetPath, modulesDirectory);
    }
  }
  var dirname = path.dirname(to);
  // console.log('dirname: ' + dirname);
  fs.mkdirsSync(dirname);
  fs.writeFileSync(to, contents, 'utf8');
}

// plugin level function (dealing with files)
function plugin(npmroot, opts) {
  opts = objectAssign({
    modulesDirectory: 'dist/npm',
    manifestPath: 'dist/require-modules.json',
    replace: false
  }, opts);

  return through.obj(function (file, enc, cb) {
    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
      return cb();
    }
    if (file.isBuffer()) {
      var modulesDirectory = path.join(process.cwd(), opts.modulesDirectory);
      var manifestPath = path.join(process.cwd(), opts.manifestPath);

      // get old manifest
      if (fs.existsSync(manifestPath)) {
        var data = fs.readFileSync(manifestPath, 'utf8');
        manifest = JSON.parse(data);
      } else {
        dirname = path.dirname(manifestPath);
        fs.mkdirsSync(dirname);
      }

      var filePath = file.path;
      var contents = file.contents.toString();
      var modules = getModules(contents);
      for (var index in modules) {
        var module = modules[index];

        if (manifest.hasOwnProperty(module)) {
          continue;
        }

        var modulePath = path_util.modulePath(module, node_modules);
        // console.log('modulePath: ' + modulePath);
        if (modulePath === null) {
          continue;
        }

        var targetPath = path_util.targetPath(modulePath, node_modules, modulesDirectory);
        var relativePath = path.relative(process.cwd(), targetPath);
        manifest[module] = relativePath;
        transformedArray.push(module);

        if (!fs.existsSync(targetPath)) {
          transformFile(modulePath, targetPath, modulesDirectory);
        }

        if (opts.replace) { // replace modules with path
          var dirname = path.dirname(filePath);
          var relativePath = path.relative(dirname, targetPath);
          // var re = /require\(['"]( + module + )['"]\)/ig;
          var re = eval('\/require\\\(\[\'\"\]' + module + '\[\'\"\]\\\)\/ig');
          contents = contents.replace(re, 'require(\'' + relativePath + '\')');
          // console.log(contents);
        }
      }
      file.contents = Buffer.from(contents);
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    }

    // 确保文件进入下一个 gulp 插件
    this.push(file);
    cb();
  });
};

// exporting the plugin main function
module.exports = plugin;
