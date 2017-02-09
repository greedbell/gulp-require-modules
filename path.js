var fs = require('fs');
var path = require('path');

/**
 * get real required file path
 *
 * module to module.js or module/index.js
 *
 * @param filePath
 * @returns {*}
 */
function realRequirPath(filePath) {
  // console.log('realRequirPath:filePath: ' + filePath);
  var jsFilePath = filePath + '.js';
  if (fs.existsSync(filePath)) {
    if (fs.statSync(filePath).isDirectory()) {
      jsFilePath = filePath + '.js';
      if (fs.existsSync(jsFilePath)) {
        return jsFilePath;
      } else {
        jsFilePath = path.join(filePath, 'index.js');
      }
      // console.log('realRequirPath:jsFilePath: ' + jsFilePath);
    } else if (fs.statSync(filePath).isFile()) {
      return filePath;
    } else {
      return null;
    }
  } else {
    jsFilePath = filePath + '.js';
    // console.log('realRequirPath:filePath: ' + filePath);
  }

  if (fs.existsSync(jsFilePath)) {
    // console.log('realRequirPath:filePath: ' + filePath);
    return jsFilePath;
  } else {
    return null;
  }
}

/**
 * get the full path of subModule
 *
 * @param subModule subModule
 * @returns {*} /User/XXXX/node_modules/module/relative.js
 */
function subModulePath(subModule, node_modules) {
  var index = subModule.indexOf("/");
  var length = subModule.length;
  if (index <= 0 || index + 1 == length) {
    return null;
  }
  var module = subModule.substring(0, index);
  var relative = subModule.substring(index + 1, length);

  var moduleDirectory = path.join(node_modules, module);
  var filePath = path.join(moduleDirectory, relative);
  return realRequirPath(filePath);
}

/**
 * get required module full path
 *
 * @param module module
 * @returns {*} /User/XXXX/node_modules/module/index.js
 */
function modulePath(module, node_modules) {
  var pkgFile = path.join(node_modules, module, 'package.json');
  if (!fs.existsSync(pkgFile)) {
    return null;
  }
  var data = fs.readFileSync(pkgFile, 'utf8');
  var pkg = JSON.parse(data);
  var fileName = pkg.main || 'index.js';
  var filePath = path.join(node_modules, module, fileName);
  return realRequirPath(filePath);
}

/**
 * get required file full path
 *
 * @param fromPath /User/XXXX/node_modules/module/index.js
 * @param require ./require
 * @returns {*} /User/XXXX/node_modules/module/require/index.js
 */
function requirePath(fromPath, require) {
  // console.log('requirePath:fromPath: ' + fromPath);
  // console.log('requirePath:require: ' + require);
  if (fromPath === null || fromPath === undefined
    || require === null || require === undefined) {
    return null;
  }
  var filePath = path.resolve(path.dirname(fromPath), require);
  return realRequirPath(filePath);
}

/**
 * full path in targetDirectory
 * @param fromPath /User/XXXX/node_modules/module/index.js
 * @param basePath /User/XXXX/node_modules/
 * @param targetDirectory /User/XXXX/dist/npm/
 * @returns {*} /User/XXXX/dist/npm/module/index.js
 */
function targetPath(fromPath, basePath, targetDirectory) {
  // console.log('targetPath:fromPath: ' + fromPath);
  // console.log('targetPath:basePath: ' + basePath);
  // console.log('targetPath:targetDirectory: ' + targetDirectory);
  var relativePath = path.relative(basePath, fromPath);
  // console.log('targetPath:relativePath: ' + relativePath);
  // console.log('targetPath: ' + path.resolve(targetDirectory, relativePath));
  return path.resolve(targetDirectory, relativePath);
}

/**
 * get relative path
 *
 * @param from
 * @param to
 * @returns {*}
 */
function relativePath(from, to) {
  // console.log('relativePath:from: ' + from);
  // console.log('relativePath:to: ' + to);
  var relative = path.relative(from, to);
  if (!relative || relative.length < 1) {
    return relative;
  }
  var first = relative.substr(0, 1);
  if (first !== '.' && first !== '/') {
    relative = './' + relative;
  }

  // especially used for windows
  relative = relative.replace('\\', '/');

  return relative;
}

module.exports = {
  modulePath: modulePath,
  subModulePath: subModulePath,
  requirePath: requirePath,
  targetPath: targetPath,
  relativePath: relativePath
};
