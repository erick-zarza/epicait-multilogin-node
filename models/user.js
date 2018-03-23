const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const SALT_WORK_FACTOR = 10;
// these values can be whatever you want - we're defaulting to a
// max of 5 attempts, resulting in a 30 min lock
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 0.5 * 60 * 60 * 1000;

const usrSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },

    photo: {
      type: String,
      required: false
    },
    email: {
      type: String,

      validate: {
        validator: function(v) {
          var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          return re.test(v);
        },
        message: "invalid email"
      }
    },

    tempPassword: {
      type: String,
      required: [true, "password required"]
    },
    password: {
      type: String,
      required: [true, "password required"]
    },
    status: {
      type: Number,
      default: 1
    },

    admin: {
      type: Boolean,
      default: false
    },
    oauth: { type: Object }
  },
  { timestamps: true }
);

usrSchema.index(
  {
    email: 1
  },
  {
    unique: true
  },
  {
    name: "propEmail_uq_indx"
  }
);
usrSchema.virtual("isLocked").get(function() {
  // check for a future lockUntil timestamp
  return !!(this.lockUntil && this.lockUntil > Date.now());
});
usrSchema.pre("save", function(next) {
  var user = this;

  if (!user.isModified("password")) return next();

  bcrypt.genSalt(8, function(err, salt) {
    if (err) return next(err);
    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

usrSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};
usrSchema.methods.HashPassword = function(password, cb) {
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) return next(err);
    bcrypt.hash(password, salt, function(err, hash) {
      if (err) return cb(err);
      return cb(hash);
    });
  });
};

usrSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

usrSchema.methods.incLoginAttempts = function(cb) {
  // if we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.update(
      {
        $set: { loginAttempts: 1 },
        $unset: { lockUntil: 1 }
      },
      cb
    );
  }
  // otherwise we're incrementing
  var updates = { $inc: { loginAttempts: 1 } };
  // lock the account if we've reached max attempts and it's not locked already
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }
  return this.update(updates, cb);
};

// expose enum on the model, and provide an internal convenience reference
var reasons = (usrSchema.statics.failedLogin = {
  NOT_FOUND: 0,
  PASSWORD_INCORRECT: 1,
  MAX_ATTEMPTS: 2
});

usrSchema.statics.getAuthenticated = function(email, password, cb) {
  this.findOne({ email: email }).exec(function(err, user) {
    if (err) return cb(err);

    // make sure the user exists
    if (!user) {
      return cb(null, null, "User Not Found");
    }

    // check if the account is currently locked
    if (user.isLocked) {
      // just increment login attempts if account is already locked
      return user.incLoginAttempts(function(err) {
        if (err) return cb(err);
        return cb(null, null, "MAX_ATTEMPTS");
      });
    }

    // test for a matching password
    if (!user.password) {
      return cb(null, user);
    }
    user.comparePassword(password, function(err, isMatch) {
      if (err) return cb(err);

      // check if the password was a match
      if (isMatch) {
        // if there's no lock or failed attempts, just return the user
        if (!user.loginAttempts && !user.lockUntil) return cb(null, user);
        // reset attempts and lock info
        var updates = {
          $set: { loginAttempts: 0 },
          $unset: { lockUntil: 1 }
        };
        return user.update(updates, function(err) {
          if (err) return cb(err);
          return cb(null, user);
        });
      }

      // password is incorrect, so increment login attempts before responding
      user.incLoginAttempts(function(err) {
        if (err) return cb(err);
        return cb(null, null, "PASSWORD_INCORRECT");
      });
    });
  });
};

mongoosePlugin = require("mongoose-opt-paginate").plugin;
mongoose.plugin(mongoosePlugin);

const usrs = mongoose.model("user", usrSchema, "user");

module.exports = usrs;
