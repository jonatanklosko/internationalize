export default class NewTranslationController {
  constructor(TranslationService) {
    'ngInject';

    this.TranslationService = TranslationService;
  }

  create(translation) {
    this.TranslationService.create(translation)
      .then(() => undefined /* Redirect to the translation page. */)
      .catch(errors => this.errors = errors);
  }
}
