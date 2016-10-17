var fs = require('fs');
var path = require('path');

function realRequirPath(filePath) {
  // console.log('realRequirPath:filePath: ' + filePath);
  if (fs.existsSync(filePath)) {
    if (fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.js');
      // console.log('realRequirPath:filePath: ' + filePath);
    }
  } else {
    filePath += '.js';
    // console.log('realRequirPath:filePath: ' + filePath);
  }

  if (fs.existsSync(filePath)) {
    // console.log('realRequirPath:filePath: ' + filePath);
    return filePath;
  } else {
    return null;
  }
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

module.exports = {
  modulePath: modulePath,
  requirePath: requirePath,
  targetPath: targetPath
};
