const mongoose = require('mongoose');
const User = require('./user');
const request = require('superagent');
const yaml = require('js-yaml');

let yamlUrlValidator = (url, valid) => {
  request.get(url)
    .then(response => yaml.safeLoad(response.text))
    .then(() => valid(true))
    .catch(() => valid(false));
};

let localeRegexp = /^[\w-]+$/;

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
  baseLocale: {
    type: String,
    required: [true, 'Base locale is required.'],
    match: [localeRegexp, 'Base locale constains invalid characters.']
  },
  targetLocale: {
    type: String,
    required: [true, 'Target locale is required.'],
    match: [localeRegexp, 'Target locale constains invalid characters.']
  },
  baseUrl: {
    type: String,
    required: [true, 'Base URL is required.'],
    validate: {
      validator: yamlUrlValidator,
      message: 'Base URL must lead to a valid YAML document.'
    }
  },
  targetUrl: {
    type: String,
    validate: {
      validator: (url, valid) => url ? yamlUrlValidator(url, valid) : valid(true),
      message: 'Base URL must either be blank or lead to a valid YAML document.'
    }
  },
  indentation: {
    type: Number,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} is not an integer value',
    },
  },
  data: {
    type: Object
  },
  hashOriginalPhrases: {
    type: Boolean,
    default: true
  }
}, {
  retainKeyOrder: true
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
