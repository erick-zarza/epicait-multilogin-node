const everyauth = require("everyauth");
const models = require("../models");
everyauth.debug = true;
function auth (app) {


    everyauth.linkedin
        .consumerKey("pv6AWspODUeHIPNZfA531OYcFyB1v23u3y-KIADJdpyw54BXh-ciiQnduWf6FNRH")
        .consumerSecret('Pdx7DCoJRdAk0ai3joXsslZvK1DPCQwsLn-T17Opkae22ZYDP5R7gmAoFes9TNHy')
        .findOrCreateUser(function(sess, accessToken, accessSecret, linkedinUser) {
            return models.User.findOneAndUpdate(
                    { "oauth.linkedin.id": linkedinUser.id },
                    { "oauth.linkedin": linkedinUser },
                    { upsert: true, new: true }
                ).exec((err, resp) => {
                    return linkedinUser;
        });

            // return usersByLinkedinId[linkedinUser.id] || (usersByLinkedinId[linkedinUser.id] = addUser('linkedin', linkedinUser));
        })
        .redirectPath("/");

    app.use(everyauth.middleware());
    return app
}
module.exports =auth;


