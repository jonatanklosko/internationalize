const Translation = require('../models/translation');
const status = require('http-status');

class TranslationController {
  create(req, res) {
    let translation = new Translation(req.body);
    translation.user = req.user._id;
    translation.save()
      .then(translation => res.status(status.CREATED).json({ translation }))
      .catch(error => res.status(status.UNPROCESSABLE_ENTITY).json({ errors: error.errors }));
  }
}

module.exports = new TranslationController();
