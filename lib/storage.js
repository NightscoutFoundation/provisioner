
var mongoose = require('mongoose');
var encrypt = require('mongoose-encrypt');

var accountSchema = new mongoose.Schema({
  account: { type: mongoose.Schema.Types.ObjectId },
  // status: { },
  db: {
    host: { type: String, default: '' },
    name: { type: String, default: '' }
  }
});

var dbUsersSchema = new mongoose.Schema({
  account: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    salter: String
  },
  created_at: { type: Date, default: Date.now },
  sitename: { type: String, default: '' },
  creds: {
    user: String,
    pass: String
  }
});

function models (ctx, next) {
  dbUsersSchema.plugin(encrypt, {
    paths: ['creds.pass', 'creds.user'],
    password: function (date) {
      // return [this.account.salter, ctx.env.KEY_PREFIX_0].join(':')
      return [ctx.env.KEY_PREFIX_0].join(':')
    }
  });
  /*
  accountSchema.plugin(encrypt, {
    paths: ['db.host', 'db.name'],
    password: function (date) {
      return [ctx.env.KEY_PREFIX_1].join(':')
    }
  });
  */
  ctx.db.model('Account', accountSchema);
  ctx.db.model('User', dbUsersSchema);
  next( );
}

function monitor (ctx, next) {
  // console.log('mongoose', ctx.db);
  ctx.mongoose.connection.on('error disconnected connected open reconnected connecting', function (ev) {
    console.log('mongoose event', arguments);
  });
  next( );
}

function init (ctx, next) {
  var opts = {
    server : { socketOptions: { keepAlive: 1 } },
    replset: { socketOptions: { keepAlive: 1 } }
  };
  ctx.mongoose = mongoose;
  ctx.db = mongoose.createConnection(ctx.env.MONGO_ADMIN_URI, opts);
  ctx.db.on('fullsetup', function (ev) {
    console.log('mongoose connected');
    next( );
  });
  next( );
}

function configure (proc) {
  proc = proc.acquire(init).acquire(monitor).acquire(models);
  return proc;
}

exports = module.exports = configure;
