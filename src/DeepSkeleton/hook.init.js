/**
 * Created by AlexanderC on 10/06/2015
 */

'use strict';

module.exports = function(callback) {
  var spawn = require('child_process').spawn;
  var path = require('path');

  var installation = spawn(
    process.env.SHELL || 'bash', 
    [
      path.join(__dirname, 'framework.sh')
    ]
  );

  installation.stdout.pipe(process.stdout);
  installation.stderr.pipe(process.stderr);

  installation.on('close', function(code) {
      if (code !== 0) {
        console.error('Framework installation failed (exit with code ' + code + ')');
      }

      callback();
    });
};
