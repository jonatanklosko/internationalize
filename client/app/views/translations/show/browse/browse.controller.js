export default class TranslationsBrowseController {
  constructor(translation, TranslationUtils, TranslationService) {
    'ngInject';
    this.translation = translation;
    this.TranslationUtils = TranslationUtils;
    this.TranslationService = TranslationService;

    let comment = this.translation.data._comment ? this.translation.data._comment._original : null;
    this.data = this.translation.data;
    this.chain = [];
    this.chain.push({ key: this.translation.targetLocale, data: this.data, comment: comment });
    this.commentChain = this.TranslationUtils.getCommentListFromChain(this.chain);
  }

  choose(key, child) {
    let comment = child._comment ? child._comment._original : null;
    this.chain.push({ key, data: child, comment: comment });
    this.data = child;
    this.commentChain = this.TranslationUtils.getCommentListFromChain(this.chain);
  }

  moveTo(index) {
    this.data = this.chain[index].data;
    this.chain = this.chain.slice(0, index + 1);
    this.commentChain = this.TranslationUtils.getCommentListFromChain(this.chain);
  }

  save() {
    /* Slice the initial targetLocale element. */
    let keyId = this.chain.slice(1).map(parent => parent.key).join('.');
    this.TranslationService.updateKey(this.translation._id, `${keyId}._translated`, this.data._translated);
  }
}
