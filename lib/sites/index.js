
var request = require('request');

function api (ctx) {
  var PREFIX = ctx.env.PREFIX;
  var mongo_suite = ctx.env.mongo_suite;
  var API = ctx.env.MULTI_ENV_API;

  function list (req, res, next) {
    req.users.map(function (user) {
    });

  }

  function find_by_name (req, res, next) {
    req.db.models.User.findOne({"account.id": req.account._id, "sitename": req.params.site }, function (err, users) {
      if (err) { return next(err); }
      res.results = users || err;
      req.site = users;
      next( );
    });
  }

  function query_multienv (req, res, next) {
    var get = API + '/environs/' + req.site.sitename;
    request({url: get, json: true }, function (err, resp, body) {
      console.log('proc from MULTI_ENV_API', err, body);
      if (err) { return next(err); }
      req.site.proc = body;
      res.results = req.site.toJSON( );
      res.results.proc = body;
      next( );
    });
  }

  function suggest (req, res, next) {
    // salter
    // internal_name
    // name
    // api_secret
    // uploader_prefix
    var salter = req.params.salter;
    var internal_name = req.params.internal_name;
    var name = req.params.name;
    var api_secret = req.params.api_secret;
    var uploader_prefix = req.params.uploader_prefix;
    var mongo_auth = [req.user.creds.user, req.user.creds.pass].join(':');
    var mongo = 'mongodb://' + mongo_auth + '@' + mongo_suite.ADDR + '/' + req.account.db.name + '?' + mongo_suite.MONGO_URI_ARGS;
    var mqtt_auth = [uploader_prefix, api_secret].join(':');
    var mqtt_uri = 'tcp://' + mqtt_auth + '@' + ctx.env.MQTT.domain;
    var prefix = PREFIX.COLLECTION + [internal_name, 'i'].join('.');

    req.suggested = {
      mongo: mongo
    , internal_name: internal_name
    , MONGO_COLLECTION: [prefix, mongo_suite.MONGO_COLLECTION].join('.')
    , MONGO_SETTINGS_COLLECTION: [prefix, mongo_suite.MONGO_SETTINGS_COLLECTION].join('.')
    , MONGO_TREATMENTS_COLLECTION: [prefix, mongo_suite.MONGO_TREATMENTS_COLLECTION].join('.')
    , MONGO_PROFILE_COLLECTION: [prefix, mongo_suite.MONGO_PROFILE_COLLECTION].join('.')
    , MONGO_DEVICESTATUS_COLLECTION: [prefix, mongo_suite.MONGO_DEVICESTATUS_COLLECTION].join('.')
    , MQTT_MONITOR: mqtt_uri
    , API_SECRET: api_secret
    };
    /* */
    next( );
  }

  function create (req, res, next) {
    var create_url = API + '/environs/' + req.user.sitename;
    if (req.suggested && req.suggested.mongo && req.suggested.internal_name) {
      request.post({url: create_url, json: req.suggested}, function (err, resp, body) {
        console.log("FROM MULTIENV", body);
        if (err) { return next(err); }
        res.results.proc = body;
        next( );
      });
    }
  }

  function remove_by_site (req, res, next) {
    console.log("SITE", req.site);
    var delete_url = API + '/environs/' + req.site.sitename;
    request.del({url: delete_url}, function (err, resp, body) {
      if (err) { return next(err); }
      req.db.models.User.remove({_id: req.site._id }, function (err, users) {
        if (err) { return next(err); }
        res.results = users || err;
        req.removeUser(req.user, function (err, info) {
          if (err) { return next(err); }
          res.status(204);
          next( );
        });
      });
    });
  }

  function format (req, res, next) {
    res.header('content-type', 'application/json');
    res.send(res.results);
    next( );
  }


  var api = {
    list: list
  , format: format
  , suggest: suggest
  , find_by_name: find_by_name
  , query_multienv: query_multienv
  , create: create
  , remove_by_site: remove_by_site
  };
  return api;

}
exports = module.exports = api;
