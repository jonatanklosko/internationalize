export default class TranslationsTranslateController {
  constructor(translation, TranslationUtils, TranslationService) {
    'ngInject';
    this.translation = translation;
    this.TranslationUtils = TranslationUtils;
    this.TranslationService = TranslationService;

    this.statistics = TranslationUtils.statistics(translation.data);
    this.untranslatedKeys = TranslationUtils.keysGenerator(translation.data);
    this.next();
  }

  next() {
    let generated = this.untranslatedKeys.next();
    this.key = generated.value || {};
    this.finished = generated.done;
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
