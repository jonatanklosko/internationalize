export default class SynchronizeDialogController {
  constructor($mdDialog, translation, computationResult, TranslationService, $state) {
    'ngInject';

    this.$mdDialog = $mdDialog;
    this.TranslationService = TranslationService;
    this.$state = $state;

    this.translation = translation;
    this.newData = computationResult.newData;
    this.conflicts = computationResult.conflicts;
    this.upToDate = computationResult.upToDate;
    this.unusedTranslatedKeysCount = computationResult.unusedTranslatedKeysCount;
    this.straightforward = !this.upToDate && this.unusedTranslatedKeysCount === 0 && this.conflicts.length === 0;
    this.resolvedConflictsCount = 0;
    this.nextConflict();
  }

  resolveConflict() {
    this.currentConflict.resolve(this.currentKey._translated);
    this.resolvedConflictsCount++;
    this.nextConflict();
  }

  nextConflict() {
    this.conflictsIterator = this.conflictsIterator || this.conflicts[Symbol.iterator]();

    let { value, done } = this.conflictsIterator.next();
    this.currentConflict = value;
    this.isConflict = !done;
    this.currentKey = done ? {} : {
      _original: value.newOriginal,
      _translated: value.currentTranslated
    };
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
