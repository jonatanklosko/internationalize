import angular from 'angular';

export default class ToastService {
  constructor($mdToast) {
    'ngInject';

    this.$mdToast = $mdToast;
  }

  simpleToast(message) {
    return this.$mdToast.show(
      this.$mdToast.simple()
        .textContent(message)
        .position('top right')
        .parent(angular.element('body'))
    );
  }
}
