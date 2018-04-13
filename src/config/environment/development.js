// Developement specific configuration
// ===================================

export default {
  // MongoDB connection options
  mongo: {
    uri: 'mongodb://localhost',
  },
  ip: 'localhost',
  port: 10100,
  // TODO: fix seeds
  seedDB: true,
  googleAuth: {
    clientID: '',
    clientSecret: '',
    callbackURL: '',
  },
};
