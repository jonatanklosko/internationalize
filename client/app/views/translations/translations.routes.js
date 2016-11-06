import translationsNewTemplate from './new/new.view.html';
import translationsListTemplate from './list/list.view.html';
import translationsTranslateTemplate from './show/translate/translate.view.html';
import translationsBrowseTemplate from './show/browse/browse.view.html';

export default ($stateProvider) => {
  'ngInject';

  $stateProvider
    .state('translations', {
      abstract: true,
      url: '/translations',
      template: '<ui-view></ui-view>'
    })
    .state('translations.new', {
      url: '/new',
      template: translationsNewTemplate,
      controller: 'TranslationsNewController',
      controllerAs: 'vm'
    })
    .state('translations.list', {
      url: '/list',
      template: translationsListTemplate,
      controller: 'TranslationsListController',
      controllerAs: 'vm',
      resolve: {
        translations: (TranslationService) => {
          'ngInject';
          return TranslationService.getAll();
        }
      }
    })
    .state('translations.show', {
      url: '/:translationId',
      abstract: true,
      template: `
        <div>
          <md-nav-bar md-selected-nav-item="vm.currentState" nav-bar-aria-label="Translation menu">
            <md-nav-item ng-repeat="item in vm.navItems" name="{{ item.state}} " md-nav-sref="{{ item.state }}">
              {{ item.text }}
            </md-nav-item>
          </md-nav-bar>
          <ui-view></ui-view>
        </div>
      `,
      controller: class TranslationsShowController {
        constructor($state) {
          'ngInject';

          this.currentState = $state.current.name;
          this.navItems = [{
            state: 'translations.show.translate',
            text: 'Translate'
          }, {
            state: 'translations.show.browse',
            text: 'Browse'
          }];
        }
      },
      controllerAs: 'vm'
    })
    .state('translations.show.translate', {
      url: '/translate',
      template: translationsTranslateTemplate,
      controller: 'TranslationsTranslateController',
      controllerAs: 'vm',
      resolve: {
        translation: (TranslationService, $stateParams) => {
          'ngInject';
          return TranslationService.getTranslation($stateParams.translationId);
        }
      }
    })
    .state('translations.show.browse', {
      url: '/browse',
      template: translationsBrowseTemplate,
      controller: 'TranslationsBrowseController',
      controllerAs: 'vm',
      resolve: {
        translation: (TranslationService, $stateParams) => {
          'ngInject';
          return TranslationService.getTranslation($stateParams.translationId);
        }
      }
    });
};
