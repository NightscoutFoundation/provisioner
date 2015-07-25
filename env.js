
exports = module.exports = {
    PORT: process.env.PORT || 6060
  , MONGO_ADMIN_URI: process.env.MONGO_ADMIN_URI || "mongodb://localhost/foundry-provisioner"
  , MULTI_ENV_API: process.env.MULTI_ENV_API || "http://127.0.0.1:3434/" // backends.docker:3434
  , KEY_PREFIX_0: process.env.KEY_PREFIX_0 || "0urh0st1ngk3ypr3f!x5h0ulb@b3v@r^l0ng!"
  , MQTT: {
    domain: process.env.MQTT_DOMAIN || 'nightscout.net'
  }
  , PREFIX: {
    NAME: process.env.HOSTED_NAME_PREFIX || "hosted-"
  , CRED: process.env.HOSTED_CRED_PREFIX || "hosted."
  , COLLECTION: process.env.HOSTED_COLLECTION_PREFIX || "A."
  }
  , mongo_suite: {
    ADDR: process.env.HOSTED_MONGO_ADDR || "localhost"
  , MONGO_URI_ARGS: process.env.HOSTED_MONGO_URI_ARGS || ""
  , MONGO_COLLECTION: 'entries'
  , MONGO_SETTINGS_COLLECTION: 'settings'
  , MONGO_TREATMENTS_COLLECTION: 'treatments'
  , MONGO_PROFILE_COLLECTION: 'profile'
  , MONGO_DEVICESTATUS_COLLECTION: 'devicestatus'
  }
};

