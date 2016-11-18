const mongoose = require('mongoose');
const User = require('./user');
const request = require('superagent');
const yaml = require('js-yaml');

const schema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Name is required.']
  },
  targetLocale: {
    type: String,
    required: [true, 'Target locale is required.'],
    match: [/^\w+$/, 'Target locale constains invalid characters.']
  },
  sourceUrl: {
    type: String,
    required: [true, 'Source URL is required.'],
    validate: {
      validator: (url, valid) => {
        request.get(url)
          .then(response => yaml.safeLoad(response.text))
          .then(() => valid(true))
          .catch(() => valid(false));
      },
      message: 'Source URL must lead to a valid YAML document.'
    }
  },
  data: {
    type: Object
  }
});

schema.pre('save', function(next) {
  this.justCreated = this.isNew; // Meant to be used in the post save callback.
  next();
});

/* Add the translation to the associated user translations. */
schema.post('save', function(translation, next) {
  if(!this.justCreated) return next(); // Continue only after creation.

  User.update({ _id: translation.user }, { $push: { translations: translation } }, next);
});

/* Remove the translation from the associated user translations. */
schema.post('remove', function(translation, next) {
  User.update({ _id: translation.user }, { $pullAll: { translations: [translation] } }, next);
});

module.exports = mongoose.model('Translation', schema, 'translations');
