const Translation = require('../models/translation');
const User = require('../models/user');
const status = require('http-status');

class TranslationsController {
  create(req, res) {
    let translation = new Translation(req.body);
    translation.user = req.params.userId;
    translation.save()
      .then(translation => res.status(status.CREATED).json({ translation }))
      .catch(error => res.status(status.UNPROCESSABLE_ENTITY).json({ errors: error.errors }));
  }

  index(req, res, next) {
    User.findById(req.params.userId).populate('translations')
      .then(user => res.status(status.OK).json({ translations: user.translations }))
      .catch(next);
  }

  show(req, res, next) {
    Translation.findById(req.params.translationId)
      .then(translation => res.status(status.OK).json({ translation }))
      .catch(next);
  }

  destroy(req, res, next) {
    Translation.findById(req.params.translationId)
      .then(translation => translation.remove())
      .then(() => res.status(status.NO_CONTENT).end())
      .catch(next);
  }

  update(req, res) {
    Translation.findById(req.params.translationId)
      .then(translation => translation.update(req.body, { runValidators: true }))
      .then(() => res.status(status.NO_CONTENT).end())
      .catch(error => res.status(status.UNPROCESSABLE_ENTITY).json({ errors: error.errors }));
  }

  updateKey(req, res, next) {
    Translation.findByIdAndUpdate(req.params.translationId, { [`data.${req.params.keyId}`]: req.body.value })
      .then(() => res.status(status.NO_CONTENT).end())
      .catch(next);
  }
}

module.exports = new TranslationsController();
