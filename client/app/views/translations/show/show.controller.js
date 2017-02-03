import angular from 'angular';

import showRawDialogTemplate from './dialogs/show-raw.template';
import ShowRawDialogController from './dialogs/show-raw.controller';

import synchronizeDialogTemplate from './dialogs/synchronize.template';
import SynchronizeDialogController from './dialogs/synchronize.controller';

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
    }, {
      state: 'translations.show.search',
      text: 'Search'
    }];
  }

  showRaw(event) {
    this.$mdDialog.show({
      tergetEvent: event,
      clickOutsideToClose: true,
      parent: angular.element('body'),
      template: showRawDialogTemplate,
      controllerAs: 'vm',
      controller: ShowRawDialogController,
      locals: { yamlData: this.yamlData() }
    });
  }

  download() {
    let blob = new Blob([this.yamlData()], { type: 'text/yaml' });
    let downloadLink = angular.element('<a></a>')
                      .attr('href', window.URL.createObjectURL(blob))
                      .attr('download', `${this.translation.targetLocale}.yml`);
    angular.element('body').append(downloadLink);
    downloadLink[0].click().remove();
  }

  synchronizeWithRemote(event) {
    this.TranslationUtils.computeDataForTranslation(this.translation)
      .then((computationResult) => {
        this.$mdDialog.show({
          tergetEvent: event,
          clickOutsideToClose: true,
          parent: angular.element('body'),
          template: synchronizeDialogTemplate,
          controllerAs: 'vm',
          controller: SynchronizeDialogController,
          locals: { translation: this.translation, computationResult }
        });
      });
  }

  yamlData() {
    return this.TranslationUtils.processedDataToYaml(this.translation.data, this.translation.targetLocale, {
      hashOriginalPhrases: this.translation.hashOriginalPhrases
    });
  }
}
