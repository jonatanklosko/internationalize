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
}

module.exports = new TranslationsController();
