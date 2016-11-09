/**
 * Created by Bell on 16/10/14.
 */

'use strict';

var requireModules = require('../index');
var assert = require('assert');
var path = require('path');
var vinylFile = require('vinyl-file');
var testSubMobile = require('gulp-util/lib/log');
var testSubMobile2 = require('ini/ini');

describe('gulp-require-modules', function() {
  it('no dist', function(done) {

    // 读取伪文件
    var fakeFile = vinylFile.readSync('./index.js');

    // 创建一个 prefixer 流（stream）
    var myRequireModules = requireModules({dist: false});

    // 将伪文件写入
    myRequireModules.write(fakeFile);

    // 等文件重新出来
    myRequireModules.once('data', function(file) {
      // 确保它以相同的方式出来
      assert(file.isBuffer());
      done();
    });
  });

  it('dist', function(done) {

    // 读取伪文件
    var fakeFile = vinylFile.readSync('./test/index.test.js');
    // var fakeFile = vinylFile.readSync('./index.js');

    // 创建一个 prefixer 流（stream）
    var myRequireModules = requireModules({dist: true, distDirectory: 'dist', fromDirectory: 'test'});

    // 将伪文件写入
    myRequireModules.write(fakeFile);

    // 等文件重新出来
    myRequireModules.once('data', function(file) {
      // 确保它以相同的方式出来
      assert(file.isBuffer());
      done();
    });
  });
});
