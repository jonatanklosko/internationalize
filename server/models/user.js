const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const uniquenessValidator = require('mongoose-unique-validator');

const schema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required.'],
    match: [/^\w+$/, 'Username contains invalid characters.'],
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Name is required.']
  },
  passwordDigest: {
    type: String,
    default: ''
  },
  translations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Translation'
  }]
});

schema.plugin(uniquenessValidator, {
  message: 'This {PATH} has already been taken.'
});

schema.virtual('password')
  .get(function() {
    return this._password;
  })
  .set(function(password) {
    this._password = password;
    this.passwordDigest = bcrypt.hashSync(password);
  });

schema.virtual('passwordConfirmation')
  .get(function() {
    return this._passwordConfirmation;
  })
  .set(function(passwordConfirmation) {
    this._passwordConfirmation = passwordConfirmation;
  });

schema.path('passwordDigest').validate(function() {
    if(this._password) {
      if(this._password.length < 6) {
        this.invalidate('password', 'Password must be at least 6 characters long.');
      }
    } else if(this.isNew) {
      this.invalidate('password', 'Password is required.');
    }
    if(this._passwordConfirmation !== this._password) {
      this.invalidate('passwordConfirmation', 'Password confirmation must match password.');
    }
  });

schema.methods = {
  /**
   * Checks if the given password matches the hashed one.
   *
   * @param {String} plainPassword A plain, uncoded password.
   * @param {Function} done A callback receiving the error, if any, otherwise a boolean.
   */
  authenticate: function(plainPassword, done) {
    bcrypt.compare(plainPassword, this.passwordDigest, done);
  }
};

module.exports = mongoose.model('User', schema, 'users');
