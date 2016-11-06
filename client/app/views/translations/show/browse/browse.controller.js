export default class TranslationsBrowseController {
  constructor(translation, TranslationUtils, TranslationService) {
    'ngInject';
    this.translation = translation;
    this.TranslationUtils = TranslationUtils;
    this.TranslationService = TranslationService;

    this.currentData = this.translation.data;
    this.previousData = [];
  }

  choose(child) {
    this.previousData.push(this.currentData);
    this.currentData = child;
  }

  previous() {
    this.currentData = this.previousData.pop();
  }
}
