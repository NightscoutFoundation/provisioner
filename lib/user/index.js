
var crypto = require('crypto');

function api (ctx) {
  var PREFIX = ctx.env.PREFIX;
  var mongo_suite = ctx.env.mongo_suite;


  function list (req, res, next) {
    req.db.models.User.find({ "account.id": req.account._id }, function (err, docs) {
      if (err) { return next(err); }
      res.results = docs || err;
      res.users = docs;
      next( );
    });
  }

  function by_user (req, res, next) {
    // req.db.models.User.find({account: req.params.user}, function (err, docs) { });
    req.db.models.User.findOne({account: req.params.user}, function (err, docs) {
      if (err) { return next(err); }
      res.results = docs || err;
      req.user = docs;
      next( );
    });
  }

  function by_id (req, res, next) {
    var q = {_id: req.params.user || req.params.id};
    req.db.models.User.findOne(q, function (err, docs) {
      if (err) { return next(err); }
      res.results = docs || err;
      req.user = docs;
      next( );
    });
  }

  function format (req, res, next) {
    res.send(res.results);
    next( );
  }

  function suggest (req, res, next) {
    var key = crypto.randomBytes(6).toString('hex');
    var name = req.params.name;
    req.suggested = {
      account: {
        id: req.account._id
      , salter: req.params.salter
      }
      , sitename: req.params.internal_name || name
      , creds: {
        user: PREFIX.CRED + req.params.salter + '.' + name
      , pass: null
      }
    };
    var shasum = crypto.createHash('sha1');
    shasum.update(key);
    shasum.update(JSON.stringify(req.suggested));
    shasum.update(key);
    var pass = shasum.digest('hex');
    req.suggested.creds.pass = pass;
    next( );
  }

  function preview (req, res, next) {
    if (req.suggested) {
      res.results = req.suggested;
    }
    next( );
  }

  function create (req, res, next) {
    if (req.suggested && req.suggested.creds) {
      var q = {
        "account.id": req.account._id
      , "account.salter": req.suggested.account.salter
      };
      req.db.models.User.findOneAndUpdate(q, req.suggested, {upsert: true, "new": true}, function (err, doc) {
        if (err) { return next(err); }
        res.status(201);
        req.user = doc;
        res.results = doc.toJSON( );
        req.addUser(req.user, function (err, info) {
          if (err) { return next(err); }
          res.results.created = info;
          next( );
        });
      });
      return;
    }
    next( );
  }

  function remove_by_user (req, res, next) {
    req.db.models.User.remove({_id: req.user._id }, function (err, users) {
      if (err) { return next(err); }
      res.results = users || err;
      req.removeUser(req.user, function (err, info) {
        if (err) { return next(err); }
        res.status(204);
        next( );
      });
    });
  }

  var api = {
    list: list
  , format: format
  , suggest: suggest
  , by_id: by_id
  , by_user: by_user
  , preview: preview
  , create: create
  , remove_by_user: remove_by_user
  };
  return api;

}
exports = module.exports = api;
