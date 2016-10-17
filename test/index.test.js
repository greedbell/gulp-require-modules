/**
 * Created by Bell on 16/10/14.
 */

'use strict';

var requireModules = require('../index');
var assert = require('assert');
var path = require('path');
var vinylFile = require('vinyl-file');

describe('gulp-require-modules', function() {
  it('should work in buffer mode', function(done) {

    // 读取伪文件
    var fakeFile = vinylFile.readSync('./index.js');

    // 创建一个 prefixer 流（stream）
    var myRequireModules = requireModules();

    // 将伪文件写入
    myRequireModules.write(fakeFile);

    // 等文件重新出来
    myRequireModules.once('data', function(file) {
      // 确保它以相同的方式出来
      assert(file.isBuffer());
      done();
    });
  });

  // it('replace input buffer', function(done) {
  //
  //   // 读取伪文件
  //   var fakeFile = vinylFile.readSync('./index.js');
  //
  //   // 创建一个 prefixer 流（stream）
  //   var myRequireModules = requireModules({replace: true, distDirectory: 'dist'});
  //
  //   // 将伪文件写入
  //   myRequireModules.write(fakeFile);
  //
  //   // 等文件重新出来
  //   myRequireModules.once('data', function(file) {
  //     // 确保它以相同的方式出来
  //     assert(file.isBuffer());
  //     done();
  //   });
  // });
});
