const models = require('../../models')
module.exports = {
  login: login
}
function login (req, res, next) {

  const loginParams = req.body

  models.User.getAuthenticated(
    loginParams.email,
    loginParams.password,
    (err, user, reason) => {
      console.log(err, user)
       if (!user) return next(new Error("User not exist"));
      if (err) return next(err)
      if (reason) {
        if (reason == 2) return next(new Error('MAX_ATTEMPTS'))
        if (reason == 1) return next(new Error('PASSWORD_INCORRECT'))
        if (reason == 0) return next(new Error('USER NOT_FOUND'))
      }
        models.User.findById(user._id).exec((err, resp) => {
        if (err) return next(err)
        res.json(resp)
      })
    }
  )
}
