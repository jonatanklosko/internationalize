export default class ShowRawDialogController {
  constructor($mdDialog, yamlData, clipboard) {
    'ngInject';
    this.yamlData = yamlData;
    this.$mdDialog = $mdDialog;
    this.clipboard = clipboard;
  }

  close() {
    this.$mdDialog.hide();
  }

  copyToClipboard() {
    this.clipboard.copyText(this.yamlData);
  }
}
