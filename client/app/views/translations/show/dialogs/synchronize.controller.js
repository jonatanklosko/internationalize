export default class SynchronizeDialogController {
  constructor($mdDialog, translation, newData, newUntranslatedKeysCount, unusedTranslatedKeysCount, currentKeysTranslatedRemotelyCount, TranslationService, $state) {
    'ngInject';

    this.$mdDialog = $mdDialog;
    this.TranslationService = TranslationService;
    this.$state = $state;

    this.translation = translation;
    this.newData = newData;
    this.unusedTranslatedKeysCount = unusedTranslatedKeysCount;
    this.newUntranslatedKeysCount = newUntranslatedKeysCount;
    this.currentKeysTranslatedRemotelyCount = currentKeysTranslatedRemotelyCount;
    this.upToDate = (newUntranslatedKeysCount === 0 && unusedTranslatedKeysCount === 0 && currentKeysTranslatedRemotelyCount === 0);
  }

  close() {
    this.$mdDialog.hide();
  }

  synchronize() {
    this.translation.data = this.newData;
    this.TranslationService.update(this.translation._id, this.translation)
      .then(() => {
        this.close();
        this.$state.reload();
      });
  }
}
