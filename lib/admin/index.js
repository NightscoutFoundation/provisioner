
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
        roles: roles
      , customData: custom
      };
      console.log('creating roles', user, roles);
      admin.addUser(user.creds.user, user.creds.pass, opts, cb);
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
