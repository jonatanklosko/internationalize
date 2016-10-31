export default class TranslationsTranslateController {
  constructor(translation, TranslationUtils, TranslationService) {
    'ngInject';
    this.translation = translation;
    this.TranslationUtils = TranslationUtils;
    this.TranslationService = TranslationService;

    this.statistics = TranslationUtils.statistics(translation.data);
    this.untranslatedKeys = TranslationUtils.untranslatedKeysGenerator(translation.data);
    this.current = this.untranslatedKeys.next().value;
  }

  done() {
    let currentKeyId = this.current.chain.join('.');
    this.TranslationService.updateKey(this.translation._id, `${currentKeyId}._translated`, this.current.key._translated)
      .then(() => {
        this.statistics.translatedCount++;
        this.current = this.untranslatedKeys.next().value;
      });
  }
}
