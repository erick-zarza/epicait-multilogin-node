const mongoose = require("mongoose");
const bluebird = require("bluebird");

exports.dbSetup = (config) => {
  mongoose.Promise = global.Promise;
  let dbURI;
  if (!config.dbURI) {
    dbURI = "mongodb://" + config.host + "/" + config.database;
  } else {
    dbURI = config.dbURI;
  }
  mongoose.connect(dbURI);

  const db = mongoose.connection;

  db.on("connected", function() {
    console.log("Mongoose default connection open to " + config.host);
  });

  db.on("error", function(err) {
    console.log("Mongoose default connection error", err);
  });

  // When the connection is disconnected
  db.on("disconnected", function() {
    console.log("Mongoose default connection disconnected");
  });

  process.on("SIGINT", function() {
    db.close(function() {
      console.log(
        "Mongoose default connection disconnected through app termination"
      );
      process.exit(0);
    });
  });
};
