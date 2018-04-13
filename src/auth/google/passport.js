/* eslint-disable import/prefer-default-export, consistent-return */

import passport from 'passport';
import { OAuth2Strategy as Strategy } from 'passport-google-oauth';
import config from '../../config/environment';

export function setup(User /* , config */) {
  passport.use(new Strategy(
    {
      clientID: config.googleAuth.clientID,
      clientSecret: config.googleAuth.clientSecret,
      callbackURL: config.googleAuth.callbackURL,
    },
    (token, refreshToken, profile, done) => {
      // make the code asynchronous
      // User.findOne won't fire until we have all our data back from Google
      process.nextTick(() => {
        // try to find the user based on their google id
        User.findOne({ 'google.id': profile.id }, (err, user) => {
          if (err) return done(err);

          if (user) {
            // if a user is found, log them in
            return done(null, user);
          }
          // if the user isnt in our database, create a new user
          const newUser = new User();

          // set all of the relevant information
          newUser.google.id = profile.id;
          newUser.google.token = token;
          newUser.google.name = profile.displayName;
          newUser.google.email = profile.emails[0].value; // pull the first email

          // save the user
          newUser.save((err) => {
            if (err) throw err;
            return done(null, newUser);
          });
        });
      });
    },
  ));
}
