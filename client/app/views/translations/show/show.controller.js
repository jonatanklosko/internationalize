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

    synchronizeWithRemote(event) {
      let translation = this.translation;
      this.TranslationUtils.pullRemoteData(this.translation.sourceUrl, this.translation.data)
        .then(({ newData, newUntranslatedKeysCount, unusedTranslatedKeysCount }) => {
          this.$mdDialog.show({
            tergetEvent: event,
            clickOutsideToClose: true,
            parent: angular.element('body'),
            template: `
              <md-dialog flex>
                <md-toolbar>
                  <div class="md-toolbar-tools">
                    <h2>Synchronize with the remote</h2>
                    <span flex></span>
                    <md-button class="md-icon-button" aria-label="Close dialog" ng-click="dialog.close()">
                      <md-icon>close</md-icon>
                    </md-button>
                  </div>
                </md-toolbar>
                <md-dialog-content class="md-dialog-content">
                  <div ng-hide="dialog.upToDate">
                    <span class="md-title">Changes which will be applied</span>
                    <md-list>
                      <md-list-item ng-show="dialog.newUntranslatedKeysCount !== 0">
                        <md-icon>add</md-icon>
                        <p>{{ dialog.newUntranslatedKeysCount }} new keys need to be translated</p>
                      </md-list-item>
                      <md-list-item ng-show="dialog.unusedTranslatedKeysCount !== 0">
                        <md-icon>remove</md-icon>
                        <p>{{ dialog.unusedTranslatedKeysCount }} translated keys are unused and will be removed</p>
                      </md-list-item>
                    </md-list>
                  </md-dialog-content>
                  <md-dialog-actions>
                    <md-button ng-click="dialog.synchronize()">Sychronize</md-button>
                  </md-dialog-actions>
                </div>
                <div ng-show="dialog.upToDate">
                  <md-icon>check</md-icon> Everything is up to date
                </div
              </md-dialog>
            `,
            controllerAs: 'dialog',
            controller: class DialogController {
              constructor($mdDialog, TranslationService, $state) {
                'ngInject';

                this.$mdDialog = $mdDialog;
                this.TranslationService = TranslationService;
                this.$state = $state;

                this.unusedTranslatedKeysCount = unusedTranslatedKeysCount;
                this.newUntranslatedKeysCount = newUntranslatedKeysCount;
                this.upToDate = (newUntranslatedKeysCount === 0 && unusedTranslatedKeysCount === 0);
              }

              close() {
                this.$mdDialog.hide();
              }

              synchronize() {
                translation.data = newData;
                this.TranslationService.update(translation._id, translation)
                  .then(() => {
                    this.close();
                    this.$state.reload();
                  });
              }
            }
          });
        });
    }
}
