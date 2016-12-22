export default class TranslationsBrowseController {
  constructor(translation, TranslationUtils, TranslationService) {
    'ngInject';
    this.translation = translation;
    this.TranslationUtils = TranslationUtils;
    this.TranslationService = TranslationService;

    this.data = this.translation.data;
    this.chain = [];
    this.chain.push({ key: this.translation.targetLocale, data: this.data });
  }

  choose(key, child) {
    this.chain.push({ key, data: child });
    this.data = child;
  }

  moveTo(index) {
    this.data = this.chain[index].data;
    this.chain = this.chain.slice(0, index + 1);
  }

  save() {
    /* Slice the initial targetLocale element. */
    let keyId = this.chain.slice(1).map(parent => parent.key).join('.');
    this.TranslationService.updateKey(this.translation._id, `${keyId}._translated`, this.data._translated);
  }

  isEditMode() {
    return this.TranslationUtils.isInnermostProcessedObject(this.data);
  }
}
