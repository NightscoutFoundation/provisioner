
var bootevent = require('bootevent');


function boot (env) {
  var proc = bootevent( )
    .acquire(function (ctx, next) {
      ctx.env = env;
      next( );
    })
    ;
  var storage = require('./storage');
  proc = storage(proc);
  return proc;
}

exports = module.exports = boot;

