/* This script clones the rails-i18n repo and extracts pluralization keys for each locale. */

const fs = require('fs');
const exec = require('child_process').exec;

const I18N_REPO = 'https://github.com/svenfuchs/rails-i18n.git';
const I18N_DIR = 'tmp-rails-i18n';
const COMMON_PLURALIZATIONS_PATH = `${I18N_DIR}/lib/rails_i18n/common_pluralizations`;
const LOCALE_FILES_PATH = `${I18N_DIR}/rails/pluralization`;
const DESTINATION_PATH = 'client/app/services/pluralization-keys.json';

exec(`git clone ${I18N_REPO} ${I18N_DIR} --depth 1`, error => {
  if(error) { console.log(error); return; }

  let extractKeys = content => {
    let match = content.match(/:keys => \[(.*?)\]/);
    if(!match) return null;
    let [, keysString] = match;
    return keysString.replace(/:/g, '').split(', ');
  };

  let commonPluralizationKeys = {};
  fs.readdirSync(COMMON_PLURALIZATIONS_PATH).forEach(file => {
    let content = fs.readFileSync(`${COMMON_PLURALIZATIONS_PATH}/${file}`, 'utf8');
    let commonPluralizationName = file.replace('.rb', '');
    commonPluralizationKeys[commonPluralizationName] = extractKeys(content);
  });

  let localeWithKeys = {};
  fs.readdirSync(LOCALE_FILES_PATH).forEach(file => {
    let content = fs.readFileSync(`${LOCALE_FILES_PATH}/${file}`, 'utf8');
    let keys = extractKeys(content);
    if(!keys) {
      for(let commonPluralizationName in commonPluralizationKeys) {
        if(content.match(new RegExp(`require '.*/${commonPluralizationName}'`))) {
          keys = commonPluralizationKeys[commonPluralizationName];
        }
      }
    }
    let locale = file.replace('.rb', '').toLowerCase();
    localeWithKeys[locale] = keys;
  });

  fs.writeFileSync(DESTINATION_PATH, JSON.stringify(localeWithKeys), 'utf8');
  exec(`rm -rf ${I18N_DIR}`);
});
