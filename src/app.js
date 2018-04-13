/* eslint-disable global-require */
import SwaggerExpress from 'swagger-express-mw';
import app from 'express';
import fs from 'fs';
import yaml from 'js-yaml';
import config from './config/environment';
import db from './config/db'; // eslint-disable-line no-unused-vars
import seedDB from './config/seed';

const server = app();
let SwaggerUi;

const configSwagger = (appHost) => {
  try {
    const swaggerObject = yaml.safeLoad(fs.readFileSync(`${__dirname}/api/swagger/swagger.yaml`, 'utf8'));
    swaggerObject.host = appHost;
    return swaggerObject;
  } catch (err) {
    throw err;
  }
};
const loadSwaggerUi = (swaggerExpress) => {
  const option = {
    swaggerUi: '/apidocs',
    apiDocs: '/swagger',
  };

  server.use(SwaggerUi(swaggerExpress.runner.swagger, option));
};
export const init = () => {
  const appConfig = {
    appRoot: __dirname,
    swagger: configSwagger(`${config.ip}:${config.port}`),
  };

  SwaggerExpress.create(appConfig, (err, swaggerExpress) => {
    if (err) {
      throw err;
    }

    if (process.env.NODE_ENV !== 'production') {
      SwaggerUi = require('swagger-tools/middleware/swagger-ui');
      loadSwaggerUi(swaggerExpress);
    }
    swaggerExpress.register(server);
    server.listen(config.port);
    console.log(`open port:${config.port}`);
  });
  seedDB();
};

export default server; // for testing
