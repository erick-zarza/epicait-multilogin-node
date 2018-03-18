

//// EXAMPLE CODE TO UPLOAD FILES
const models = require('../../models')



const { saveBufferToFile, generalResponse } = require('../../helpers/util')

module.exports = {
  termsAndConditionsUpdate: termsAndConditionsUpdate,
  termsAndConditions: termsAndConditions,
  privacyPolicies: privacyPolicies,
  privacyPoliciesUpdate: privacyPoliciesUpdate
}
function termsAndConditionsUpdate (req, res) {
  if (req.files && req.files.file.mimetype === 'text/html') {
    const modelType = req.swagger.params.type.value
    saveBufferToFile(
      req,
      `public/${modelType}/termsAndConditions.html`,
      req.files.file.buffer
    )
      .then(response => {
        models.terms_and_conditions
          .findOrCreate({
            where: {
              type: modelType
            },
            defaults: {
              type: modelType,
              path: response
            }
          })
          .spread(response => {
            res.send(generalResponse(response, 200))
          })
      })
      .catch(err => {
        res.send(generalResponse(err, 400))
      })
  } else {
    res.send(generalResponse({ error: 'file type not supported' }, 400))
  }
}
function termsAndConditions (req, res) {
  models.terms_and_conditions
    .find({
      where: {
        type: req.swagger.params.type.value
      }
    })
    .then(response => {
      if (!response) return res.status(401).send('Page not exist')
      res.sendFile(response.path)
    })
}

function privacyPoliciesUpdate (req, res) {
  if (req.files && req.files.file.mimetype === 'text/html') {
    const modelType = req.swagger.params.type.value
    saveBufferToFile(
      req,
      `public/${modelType}/privacyPolicies.html`,
      req.files.file.buffer
    )
      .then(response => {
        models.privacy_policies
          .findOrCreate({
            where: {
              type: modelType
            },
            defaults: {
              type: modelType,
              path: response
            }
          })
          .spread(response => {
            res.send(generalResponse(response, 200))
          })
      })
      .catch(err => {
        res.send(generalResponse(err, 400))
      })
  } else {
    res.send(generalResponse({ error: 'file type not supported' }, 400))
  }
}
function privacyPolicies (req, res) {
  models.privacy_policies
    .find({
      where: {
        type: req.swagger.params.type.value
      }
    })
    .then(response => {
      if (!response) return res.status(401).send('Page not exist')
      res.sendFile(response.path)
    })
}
