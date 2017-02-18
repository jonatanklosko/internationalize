export default class TranslationsTranslateController {
  constructor(translation, TranslationUtils, TranslationService) {
    'ngInject';
    this.translation = translation;
    this.TranslationUtils = TranslationUtils;
    this.TranslationService = TranslationService;

    this.statistics = TranslationUtils.statistics(translation.data);
    this.setUpUntranslatedKeysGenerator();
  }

  setUpUntranslatedKeysGenerator() {
    this.untranslatedKeys = this.TranslationUtils.keysGenerator(this.translation.data);
    this.next();
  }

  next() {
    let { value, done } = this.untranslatedKeys.next();
    this.key = value;
    this.finished = done;
    /* The user may have skipped some keys, in such case renew the generator. */
    if(this.finished && this.statistics.translatedCount !== this.statistics.overallCount) {
      this.setUpUntranslatedKeysGenerator();
    }
  }

  done() {
    this.TranslationService.updateKey(this.translation._id, `${this.key.path}._translated`, this.key.value._translated)
      .then(() => {
        this.statistics.translatedCount++;
        this.next();
      });
  }

  skip() {
    this.next();
  }

  useOriginal() {
    this.key.value._translated = this.key.value._original;
    this.done();
  }
}
