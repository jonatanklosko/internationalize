export default class TranslationsListController {
  constructor(TranslationService) {
    'ngInject';

    this.TranslationService = TranslationService;

    this.TranslationService.getAll()
      .then(translations => this.translations = translations);
  }
}
