const nodemailer = require('nodemailer')
const Promise = require('bluebird')
const crypto = require('crypto')
const mg = require('nodemailer-mailgun-transport')
const fs = require('fs')
const path = require('path')
const handlebars = require('handlebars')

exports.randomChars = (howMany, chars) => {
  chars = chars || '0123456789BCDFGHJKLMNPQRSTV'
  var rnd = crypto.randomBytes(howMany),
    value = new Array(howMany),
    len = chars.length

  for (var i = 0; i < howMany; i++) {
    value[i] = chars[rnd[i] % len]
  }

  return value.join('')
}

exports.saveBufferToFile = (req, filePath, buffer) => {
  return new Promise(function (resolve, reject) {
    const appDir = req.app.get('appDir')
    filepath = path.join(appDir, filePath)

    fs.open(filepath, 'w', function (err, fd) {
      if (err) {
        reject('could not open file: ' + err)
      }

      // write the contents of the buffer, from position 0 to the end, to the file descriptor returned in opening our file
      fs.write(fd, buffer, 0, buffer.length, null, function (err) {
        if (err) reject('could not open file: ' + err)
        fs.close(fd, function () {
          resolve(filepath)
        })
      })
    })
  })
}

exports.generalResponse = (res, statusCode) => {
  console.log(res)
  res = res || []
  const data = Array.isArray(res) ? res : [res]
  let message = 'OK'
  let status = 'success'
  if (statusCode >= 400) {
    message = 'Error'
    status = 'fail'
  }
  return { status: status, code: statusCode, message: message, data: data }
}
/**
 * email sender helper.
 * @constructor
 * @param {object} config - {host:"smtp.example.com"',port:587,user:"user",password:"password",html:true}.
 * @param {object} params - {from:"admin@examples.com",to:"user@examples.com",subject:"welcome new user"}
 */
exports.dateToGMT0 = date => {
  date = new Date(date).toUTCString() // will convert to present timestamp offset
  return new Date(date)
}
exports.emailSender = (config, params, template) => {
  return new Promise(function (resolve, reject) {
    nodemailer.createTestAccount((err, account) => {
      let transporter
      if (config.service === 'smtp') {
        transporter = nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: false,
          auth: {
            user: config.user,
            pass: config.pass
          }
        })
      } else if (config.service === 'mailgun') {
        transporter = nodemailer.createTransport(
          mg({
            auth: {
              api_key: config.apiKey,
              domain: config.domain
            }
          })
        )
      } else if (config.service === 'gmail') {
        transporter = nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: true,
          user: config.user,
          password: config.pass,
          // service: "gmail",
          auth: {
            user: config.user,
            pass: config.pass
          }
        })
      }

      let mailOptions = {
        from: params.from,
        to: params.to,
        subject: params.subject,
        text: !config.html ? template : undefined,
        html: config.html ? template : undefined
      }

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return reject(error)
        }
        return resolve(info)
      })
    })
  })
}

exports.htmlTemplate = (req, filePath, values) => {
  return new Promise(function (resolve, reject) {
    const readHTMLFile = function (filePath, callback) {
      fs.readFile(filePath, { encoding: 'utf-8' }, function (err, html) {
        if (err) {
          callback(err)
        } else {
          callback(null, html)
        }
      })
    }

    const appDir = req.app.get('appDir')

    filepath = path.join(appDir, filePath)

    readHTMLFile(filepath, function (err, html) {
      if (err) return reject(err)
      const template = handlebars.compile(html)

      return resolve(template(values))
    })
  })
}
