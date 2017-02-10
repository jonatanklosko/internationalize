export default class TranslationsEditController {
  constructor(translation, TranslationService, ToastService, $state) {
    'ngInject';

    this.translation = translation;
    this.TranslationService = TranslationService;
    this.ToastService = ToastService;
    this.$state = $state;
  }

  update(translation) {
    this.TranslationService.update(translation._id, translation)
      .then(() => {
        this.errors = {};
        this.ToastService.simpleToast('Translation updated.');
        this.$state.go('translations.show.translate', { translationId: this.translation._id });
      })
      .catch(errors => this.errors = errors);
  }
}
