
var restify = require('restify');
var bunyan = require('bunyan');

function createServer (opts) {
  if (opts) {
    opts.handleUpgrades = true;
  }
  var logger = bunyan.createLogger({ name: 'provisioner', level: 'info'
    , serializers: {
    req: bunyan.stdSerializers.req,
    // res: restify.bunyan.serializers.response
    }
  });
  if (!'log' in opts) {
    opts.log = logger;
  }

  var server = restify.createServer(opts);

  server.on('after', restify.auditLogger({
    log: bunyan.createLogger({
      name: 'audit',
      level: 'info',
      stream: process.stdout
    })
  }));


  server.use(restify.dateParser());
  server.use(restify.queryParser());
  server.use(restify.jsonp());
  server.use(restify.gzipResponse());
  server.use(restify.bodyParser());
  server.use(function (req, res, next) {
    req.db = opts.db;
    next( );
  });

  var admin = require('./lib/admin/')(opts);
  var account = require('./lib/account/')(opts);
  var user = require('./lib/user/')(opts);
  var sites = require('./lib/sites/')(opts);
  server.get('/dbs', admin.list, admin.format);

  server.get('/db/:db', function (req, res, next) {
    var q = { name: req.params.db };
    console.log('fetch', q);
    req.db.models.Account.findOne(q, function (err, docs) {
      if (err) { return next(err); }
      res.send(docs || err);
      next( );
    });
  });
  server.post('/accounts', account.suggest, account.create, account.format);
  server.get('/accounts', account.list, account.format);

  server.get('/accounts/:account', account.by_account, account.format);
  server.del('/accounts/:account', admin.adminUser, account.by_account, account.remove_by_account, account.format);

  server.get('/accounts/:account/dbs', account.by_account, function (req, res, next) { });

  server.get('/accounts/:account/users', account.by_account, user.list, user.format);
  server.get('/accounts/:account/users/:user', account.by_account, user.by_id, user.format);
  server.del('/accounts/:account/users/:user', admin.adminUser, account.by_account, user.by_id, user.remove_by_user, user.format);

  // server.post('/accounts/:account/users/:user/password', account.by_account, user.by_id, user.format);
  server.post('/accounts/:account/users', account.by_account, admin.adminUser, user.suggest, user.create, user.format);
  server.post('/accounts/:account/users/:name', account.by_account, admin.adminUser, user.suggest, user.create, user.format);

  // server.get('/accounts/:account/sites', account.by_account, user.list, sites.format);
  server.get('/accounts/:account/sites/:site', account.by_account, sites.find_by_name, sites.query_multienv, sites.format);

  server.del('/accounts/:account/sites/:site', account.by_account, sites.find_by_name, admin.adminUser, sites.remove_by_site, sites.format);
  server.post('/accounts/:account/sites', account.by_account, admin.adminUser
        , user.suggest
        , user.lookup_prexists
        , user.create
        , sites.suggest
        , sites.create
        , sites.format);
  server.post('/accounts/:account/sites/:name', account.by_account, admin.adminUser
        , user.suggest
        , user.lookup_prexists
        , user.create
        , sites.suggest
        , sites.create
        , sites.format);

  return server;
}

exports = module.exports = createServer;

if (!module.parent) {
  var env = require('./env');
  var bootevent = require('./lib/bootevent');
  bootevent(env).boot(function (ctx) {
    var server = createServer(ctx);
    console.log('ok', 'booted', ctx);
    server.listen(env.PORT, function ( ) {
      console.log('listening on', server.address( ));
    });
  });
}
