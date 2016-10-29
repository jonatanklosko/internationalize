export default class TranslationsListController {
  constructor(TranslationService, $mdDialog) {
    'ngInject';

    this.TranslationService = TranslationService;
    this.$mdDialog = $mdDialog;

    this.TranslationService.getAll()
      .then(translations => this.translations = translations);
  }

  delete(translation, index, event) {
    let confirmation = this.$mdDialog.confirm()
      .targetEvent(event)
      .title('Are you sure you want to delete this translation?')
      .textContent(`${translation.name} - ${translation.locale}`)
      .ok('Yes')
      .cancel('No');

    this.$mdDialog.show(confirmation)
      .then(() => this.TranslationService.delete(translation._id))
      .then(() => this.translations.splice(index, 1));
  }
}
