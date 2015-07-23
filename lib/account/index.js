
function api (ctx) {
  var PREFIX = ctx.env.PREFIX;
  var mongo_suite = ctx.env.mongo_suite;

  function list (req, res, next) {
    req.db.models.Account.find({ }, function (err, docs) {
      if (err) { return next(err); }
      res.results = docs || err;
      res.accounts = docs;
      next( );
    });
  }

  function by_id (req, res, next) {
    req.db.models.Account.find({_id: req.params.account || req.params.id}, function (err, docs) {
      if (err) { return next(err); }
      res.results = docs || err;
      next( );
    });
  }

  function by_account (req, res, next) {
    // req.db.models.Account.find({account: req.params.account}, function (err, docs) { });
    req.db.models.Account.findOne({account: req.params.account}, function (err, docs) {
      if (err) { return next(err); }
      res.results = docs || err;
      req.account = docs;
      next( );
    });
  }


  function format (req, res, next) {
    res.send(res.results);
    next( );
  }

  function suggest (req, res, next) {
    req.suggested = {
      account: ctx.mongoose.Types.ObjectId(req.params.account)
      , db: {
        host: mongo_suite.ADDR
      , name: PREFIX.NAME + req.params.name
      }
    };
    next( );
  }

  function preview (req, res, next) {
    if (req.suggested) {
      res.results = req.suggested;
    }
    next( );
  }

  function create (req, res, next) {
    if (req.suggested) {
      var q = {
        account: req.suggested.account
      , "db.name": req.suggested.db.name
      };
      req.db.models.Account.findOneAndUpdate(q, req.suggested, {upsert: true, "new": true}, function (err, doc) {
        if (err) { return next(err); }
        res.status(201);
        res.results = doc.toJSON( );
        next( );
      });
      return;
    }
    next( );
  }

  function remove_by_account (req, res, next) {
    req.db.models.Account.remove({account: req.params.account}, function (err, docs) {
      console.log('removed account', arguments);
      if (err) { return next(err); }
      req.db.models.User.remove({account: { id: req.account._id } }, function (err, users) {
        console.log('removed associated Users', arguments);
        if (err) { return next(err); }
        res.results = docs || err;
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
  , by_account: by_account
  , preview: preview
  , create: create
  , remove_by_account: remove_by_account
  };
  return api;

}
exports = module.exports = api;
