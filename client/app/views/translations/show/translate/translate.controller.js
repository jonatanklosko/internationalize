export default class TranslationsTranslateController {
  constructor(translation, TranslationUtils, TranslationService) {
    'ngInject';
    this.translation = translation;
    this.TranslationUtils = TranslationUtils;
    this.TranslationService = TranslationService;

    this.statistics = TranslationUtils.statistics(translation.data);
    this.untranslatedKeys = TranslationUtils.untranslatedKeysGenerator(translation.data);
    this.next();
  }

  next() {
    let generated = this.untranslatedKeys.next();
    let { key = null, chain = [] } = generated.value || {};
    this.key = key;
    this.chain = chain;
    this.finished = generated.done;
  }

  done() {
    let keyId = this.chain.map(parent => parent.key).join('.');
    this.TranslationService.updateKey(this.translation._id, `${keyId}._translated`, this.key._translated)
      .then(() => {
        this.statistics.translatedCount++;
        this.next();
      });
  }
}
