const jwt = require("jsonwebtoken");
const models = require("../models");

const tokenStatus = {
  ACTIVE: 1,
  INACTIVE: 2
};
exports.swaggerSecurityHandler = function(
  req,
  authOrSecDef,
  scopesOrApiKey,
  cb
) {
  let token;
  const parts = scopesOrApiKey.split(" ");
  if (parts.length == 2) {
    const scheme = parts[0],
      credentials = parts[1];

    if (/^Bearer$/i.test(scheme)) {
      token = credentials;
    }
  } else {
    return req.res.json(401, {
      err: "Format is Authorization: Bearer [token]"
    });
  }
  jwt.verify(token, req.app.get("appConfig").apiSecret, function(err, decoded) {
    if (err) return req.res.send(401, "Unautorized");

    models.tokens.findById(token).then(tokenResponse => {
      if (!tokenResponse) return req.res.status(401).send("Unautorized");
      if (tokenResponse.status === tokenStatus.INACTIVE) {
        return req.res.status(401).send("Unautorized");
      }
      if (!req.swagger["x_swagger-roles"]) {
        if (decoded.user_id) {
          models.User.findById(decoded.user_id).then(response => {
            const role = req.swagger.operation["x-swagger-roles"].filter(
              role => {
                return response.type === role;
              }
            )[0];

            if (!role) return req.res.status(401).send("Unautorized");

            req.flash = { token: token, user_id: decoded.user_id, role: role };
            return cb(null, response);
          });
        } else {
          return req.res.status(401).send("Unautorized");
        }
      } else {
        models.User.findById(decoded.user_id).then(response => {
          if (!response) return req.res.status(401).send("Unautorized");
          req.flash = { token: token, user_id: decode.user_id, role: "none" };
          return cb(null, response);
        });
      }
    });
  });
};

exports.loginWithFacebook = (req, res) => {};
