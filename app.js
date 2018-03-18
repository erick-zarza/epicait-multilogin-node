"use strict";
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const express = require("express");
const app = express();
const methodOverride = require("method-override");

const SwaggerExpress = require("swagger-express-mw");

const SwaggerUi = require("swagger-tools/middleware/swagger-ui");

const db = require("./helpers/db");

module.exports = app; // for testing

const env = process.env.NODE_ENV || "development";
const appConfig = require(path.join(__dirname, "./config/config.json"))[env];

app.set("appConfig", appConfig);

app.set("appRoot", __dirname);

app.use(methodOverride());

db.dbSetup(appConfig);

const config = {
  appRoot: __dirname,
  swagger: configSwagger(appConfig.appHost)
};

SwaggerExpress.create(config, function(err, swaggerExpress) {
  if (err) {
    throw err;
  }
  if (env !== "production") {
    loadSwaggerUi(swaggerExpress);
  }
  // install middleware
  swaggerExpress.register(app);

  const port = process.env.PORT || 10010;
  app.listen(port);

  console.log(
    "Actual routes: " + Object.keys(swaggerExpress.runner.swagger.paths)
  );
});

function loadSwaggerUi(swaggerExpress) {
  const option = {
    swaggerUi: "/apidocs",
    apiDocs: "/swagger"
  };

  app.use(SwaggerUi(swaggerExpress.runner.swagger, option));
}

function configSwagger(appHost) {
  try {
    const swaggerObject = yaml.safeLoad(
      fs.readFileSync("./api/swagger/swagger.yaml", "utf8")
    );
    swaggerObject.host = appHost;
    return swaggerObject;
  } catch (err) {
    throw err;
  }
}
