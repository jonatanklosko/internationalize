import * as _ from 'lodash';

export default class TranslationsBrowseController {
  constructor(translation, TranslationUtils, TranslationService, ToastService) {
    'ngInject';
    this.translation = translation;
    this.TranslationUtils = TranslationUtils;
    this.TranslationService = TranslationService;
    this.ToastService = ToastService;

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

  navigate(upToDown) {
    /* The *chain* is an array of *element*s - objects of the form { key, data }.  */
    let nonPrivateElements = data => _.entries(data).map(([key, data]) => ({ key, data }))
                                      .filter(element => !this.TranslationUtils.isPrivateKey(element.key));
    let currentElement = this.chain.pop();
    let parentElement = _.last(this.chain);
    let parentChildElements = nonPrivateElements(parentElement.data);
    let currentElementIndex = _.findIndex(parentChildElements, ['key', currentElement.key]);
    let nextElement = parentChildElements[currentElementIndex + (upToDown ? 1 : -1)]; /* The next or previous element. */
    if(nextElement) {
      this.chain.push(nextElement);
      if(!this.TranslationUtils.isInnermostProcessedObject(nextElement.data)) {
        let findInnermost = (data) => {
          let elements = nonPrivateElements(data);
          let element = elements[upToDown ? 0 : elements.length - 1]; /* The first or the last element. */
          this.chain.push(element);
          if(!this.TranslationUtils.isInnermostProcessedObject(element.data)) {
            findInnermost(element.data);
          }
        };
        findInnermost(nextElement.data);
      }
    } else {
      /* If there's only the root element, then we iterated over all keys and there's no previous/next one. */
      if(this.chain.length === 1) return;
      this.navigate(upToDown);
    }
    this.data = _.last(this.chain).data;
  }

  save() {
    /* Slice the initial targetLocale element. */
    let keyId = this.chain.slice(1).map(parent => parent.key).join('.');
    this.TranslationService.updateKey(this.translation._id, `${keyId}._translated`, this.data._translated)
      .then(() => this.ToastService.simpleToast('Translation updated.'));
  }

  isEditMode() {
    return this.TranslationUtils.isInnermostProcessedObject(this.data);
  }
}
