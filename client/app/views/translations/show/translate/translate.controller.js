import angular from 'angular';

export default class TranslationsTranslateController {
  constructor(translation, TranslationUtils, TranslationService, $mdDialog) {
    'ngInject';
    this.translation = translation;
    this.TranslationUtils = TranslationUtils;
    this.TranslationService = TranslationService;
    this.$mdDialog = $mdDialog;

    this.statistics = TranslationUtils.statistics(translation.data);
    this.untranslatedKeys = TranslationUtils.untranslatedKeysGenerator(translation.data);
    this.next();
  }

  next() {
    let generated = this.untranslatedKeys.next();
    let { key = null, chain = null } = generated.value || {};
    this.key = key;
    this.chain = chain;
    this.finished = generated.done;
  }

  done() {
    let keyId = this.chain.join('.');
    this.TranslationService.updateKey(this.translation._id, `${keyId}._translated`, this.key._translated)
      .then(() => {
        this.statistics.translatedCount++;
        this.next();
      });
  }

  showRaw(event) {
    let yamlData = this.TranslationUtils.processedDataToYaml(this.translation.data);
    this.$mdDialog.show({
      tergetEvent: event,
      clickOutsideToClose: true,
      parent: angular.element('body'),
      template: `
        <md-dialog flex>
          <md-toolbar>
            <div class="md-toolbar-tools">
              <h2>Raw data</h2>
              <span flex></span>
              <md-button class="md-icon-button" aria-label="Close dialog" ng-click="dialog.close()">
                <md-icon>close</md-icon>
              </md-button>
            </div>
          </md-toolbar>
          <md-dialog-content layout="row" class="md-dialog-content">
            <md-content flex hljs hljs-language="yaml" hljs-source="dialog.yamlData"></md-content>
          </md-dialog-content>
          <md-dialog-actions>
            <md-button ng-click="dialog.copyToClipboard()"><md-icon>content_copy</md-icon> Copy to clipboard</md-button>
          </md-dialog-actions>
        </md-dialog>
      `,
      controllerAs: 'dialog',
      controller: class DialogController {
        constructor($mdDialog, clipboard) {
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
    });
  }

  download() {
    let yamlData = this.TranslationUtils.processedDataToYaml(this.translation.data);
    let blob = new Blob([yamlData], { type: 'text/yaml' });
    let downloadLink = angular.element('<a></a>')
                      .attr('href', window.URL.createObjectURL(blob))
                      .attr('download', `${this.translation.locale}.yml`);
    angular.element('body').append(downloadLink);
		downloadLink[0].click().remove();
  }
}
