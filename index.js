/**
 * Created by Bell on 16/10/14.
 */

var through = require('through2');
var objectAssign = require('object-assign');
var testSubMobile = require('gulp-util/lib/log');
var testSubMobile2 = require('ini/ini');
var fs = require('fs-extra');
var path = require('path');
var path_util = require('./path');
var PluginError = require('plugin-error');

var PLUGIN_NAME = 'gulp-require-modules';
var node_modules = process.cwd() + '/node_modules/';
var modulesManifest = {};
var requiresManifest = {};

/**
 * require("./path/to/require")
 *
 * @param file
 * @returns {*}
 */
function getRequires(string) {
  var re = /require\(['"]([\.\/][\w\d\-\.\/]+)['"]\)/ig;
  return getMatches(string, re);
}

/**
 * require("module")
 *
 * @param file
 * @returns {*}
 */
function getModules(string) {
  var re = /require\(['"]([\w\d\-]+)['"]\)/ig;
  return getMatches(string, re);
}

/**
 * require("module/subModule")
 *
 * @param file
 * @returns {*}
 */
function getSubModules(string) {
  // var re = /require\(['"]([\w\d\-]+[\/]+[\w\d\-\.\/]+]+)['"]\)/ig;
  var re = /require\(['"]([\w\d\-]+\/[\w\d\-\.\/]+)['"]\)/ig;
  return getMatches(string, re);
}

/**
 * get mateched string
 *
 * @param str
 * @param re
 * @returns {*}
 */
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
  return results;
}

/**
 * copy file from node_module to modulesDirectory
 *
 * @param from file full path
 * @param to file full path
 * @param modulesDirectory
 */
function transformFile(from, to, modulesDirectory) {
  var contents = fs.readFileSync(from, 'utf8');

  // modules
  var modules = getModules(contents);
  for (var index in modules) {
    var module = modules[index];
    if (modulesManifest.hasOwnProperty(module)) {
      continue;
    }
    var modulePath = path_util.modulePath(module, node_modules);
    if (modulePath === null) {
      continue;
    }
    var targetPath = path_util.targetPath(modulePath, node_modules, modulesDirectory);
    modulesManifest[module] = path.relative(process.cwd(), targetPath);
    if (!fs.existsSync(targetPath)) {
      transformFile(modulePath, targetPath, modulesDirectory);
    }
    var relativePath = path_util.relativePath(to, targetPath);
    var re = eval('\/require\\\(\[\'\"\]' + module + '\[\'\"\]\\\)\/ig');
    contents = contents.replace(re, 'require(\'' + relativePath + '\')');
  }

  // requires
  var requires = getRequires(contents);
  for (var index in requires) {
    var require = requires[index];
    var requirePath = path_util.requirePath(from, require);
    if (requirePath === null) {
      continue;
    }
    if (requiresManifest.hasOwnProperty(requirePath)) {
      continue;
    } else {
      requiresManifest[requirePath] = true;
    }
    var targetPath = path_util.targetPath(requirePath, node_modules, modulesDirectory);
    if (!fs.existsSync(targetPath)) {
      transformFile(requirePath, targetPath, modulesDirectory);
    }
  }

  var dirname = path.dirname(to);
  fs.mkdirsSync(dirname);
  fs.writeFileSync(to, contents, 'utf8');
}

// plugin level function (dealing with files)
function plugin(opts) {
  opts = objectAssign({
    modulesDirectory: 'dist/node_modules',
    modulesManifestPath: 'dist/require-modules.json',
    dist: true,
    fromDirectory: 'src',
    distDirectory: 'dist'
  }, opts);

  return through.obj(function (file, enc, cb) {
    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
      return cb();
    }
    if (file.isBuffer()) {
      var modulesDirectory = path.join(process.cwd(), opts.modulesDirectory);
      var modulesManifestPath = path.join(process.cwd(), opts.modulesManifestPath);
      var distDirectory = opts.distDirectory;

      // get old modulesManifest
      if (fs.existsSync(modulesManifestPath)) {
        var data = fs.readFileSync(modulesManifestPath, 'utf8');
        modulesManifest = JSON.parse(data);
      } else {
        dirname = path.dirname(modulesManifestPath);
        fs.mkdirsSync(dirname);
      }

      var filePath = file.path;
      var contents = file.contents.toString();

      // the path where this file will be disted to
      var distFilePath = filePath;
      if (distDirectory) {
        var cwd = path.join(process.cwd());
        var relativePath = path.relative(path.join(cwd, opts.fromDirectory || ''), filePath);
        var distFilePath = path.join(process.cwd(), distDirectory, relativePath);
      }
      var distFileDirname = path.dirname(distFilePath);

      // modules
      var modules = getModules(contents);
      for (var index in modules) {
        var module = modules[index];

        var modulePath = path_util.modulePath(module, node_modules);
        if (modulePath === null) {
          continue;
        }
        var targetPath = path_util.targetPath(modulePath, node_modules, modulesDirectory);

        if (!modulesManifest.hasOwnProperty(module)) {
          var relativePath = path.relative(process.cwd(), targetPath);
          modulesManifest[module] = relativePath;

          if (!fs.existsSync(targetPath)) {
            transformFile(modulePath, targetPath, modulesDirectory);
          }
        }

        if (opts.dist) { // replace modules with path
          var relativePath = path_util.relativePath(distFileDirname, targetPath);
          var re = eval('\/require\\\(\[\'\"\]' + module + '\[\'\"\]\\\)\/ig');
          contents = contents.replace(re, 'require(\'' + relativePath + '\')');
        }
      }

      // subModules
      var subModules = getSubModules(contents);
      for (var index in subModules) {
        var subModule = subModules[index];
        var subModulePath = path_util.subModulePath(subModule, node_modules);
        if (subModulePath === null) {
          continue;
        }
        var targetPath = path_util.targetPath(subModulePath, node_modules, modulesDirectory);

        if (!modulesManifest.hasOwnProperty(subModule)) {
          var relativePath = path.relative(process.cwd(), targetPath);
          modulesManifest[subModule] = relativePath;

          if (!fs.existsSync(targetPath)) {
            transformFile(subModulePath, targetPath, modulesDirectory);
          }
        }

        if (opts.dist) { // replace modules with path
          var relativePath = path_util.relativePath(distFileDirname, targetPath);
          var subModuleRegex = subModule.replace('/', '\\\/');
          var subModuleRegex = subModuleRegex.replace('.', '\\\.');
          var re = 'require\\\(\[\'\"\]' + subModuleRegex + '\[\'\"\]\\\)';
          var regex = new RegExp(re, 'ig');
          contents = contents.replace(regex, 'require(\'' + relativePath + '\')');
        }
      }
      file.contents = Buffer.from(contents);
      fs.writeFileSync(modulesManifestPath, JSON.stringify(modulesManifest, null, 2), 'utf8');
    }

    // go to next gulp plugin
    this.push(file);
    cb();
  });
};

// exporting the plugin main function
module.exports = plugin;
