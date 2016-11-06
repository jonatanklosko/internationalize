import angular from 'angular';

export default class TranslationsShowController {
  constructor(translation, $state, TranslationUtils, $mdDialog) {
    'ngInject';

    this.translation = translation;
    this.$state = $state;
    this.TranslationUtils = TranslationUtils;
    this.$mdDialog = $mdDialog;

    this.currentState = $state.current.name;
    this.navItems = [{
      state: 'translations.show.translate',
      text: 'Translate'
    }, {
      state: 'translations.show.browse',
      text: 'Browse'
    }];
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
