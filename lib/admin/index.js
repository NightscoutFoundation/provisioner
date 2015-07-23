
var shallowClone = require('mongoose/node_modules/mongodb/lib/utils').shallowClone;

// Get write concern
var writeConcern = function(options, db) {
  options = shallowClone(options);
  // If options already contain write concerns return it
  if(options.w || options.wtimeout || options.j || options.fsync) {
    return options;
  }
  // Set db write concern if available
  if(db.writeConcern) {
    if(options.w) options.w = db.writeConcern.w;
    if(options.wtimeout) options.wtimeout = db.writeConcern.wtimeout;
    if(options.j) options.j = db.writeConcern.j;
    if(options.fsync) options.fsync = db.writeConcern.fsync;
  }
  // Return modified options
  return options;
}

function createAdmin (ctx) {
  // console.log('ctx', ctx, ctx.mongoose);
  console.log('db', ctx.db.db);
  var admin = ctx.db.db.admin( );

  function list (req, res, next) {
    admin.listDatabases(function (err, docs) {
      if (err) { return next(err); }
      res.results = docs || err;
      next( );
    });
  }

  function create (req, res, next) {
  }

  // http://mongodb.github.io/node-mongodb-native/2.0/api/lib_admin.js.html#line302
  function addUser (username, password, options, callback) {
    var self = this;
    var args = Array.prototype.slice.call(arguments, 2);
    callback = args.pop( );
    if (typeof callback != 'function') args.push(callback);
    options = args.length ? args.shift( ) : { };
    options = options || { };

    options = writeConcern(options, self.s.db);

    if (!options.dbName) {
      options.dbName = 'admin';
    }
    return self.s.db.addUser(username, password, options, callback);
  }

  function adminUser (req, res, next) {
    req.addUser = function (user, cb) {
      var roles = [
      /*
      {
        "role": "readWrite"
      , "db": req.account.db.name + '-' + user.account.salter.split('.').join('-')
      },
      */
      {
        "role": "readWrite"
      , "db": req.account.db.name
      } ];
      var custom = { salter: user.account.salter };
      var opts = {
        dbName: req.account.db.name
      , roles: roles
      , customData: custom
      };
      console.log('creating roles', user, roles);
      addUser.call(admin, user.creds.user, user.creds.pass, opts, cb);
    };
    req.removeUser = function (user, cb) {
      admin.removeUser(user.creds.user, cb);
    };
    next( );
  }

  function remove (req, res, next) {
  }

  function format (req, res, next) {
    res.send(res.results);
    next( );
  }

  var api = {
    list: list
  , format: format
  , adminUser: adminUser
  };
  return api;
}

exports = module.exports = createAdmin;
