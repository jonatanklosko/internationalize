import template from './collection-pagination.template.html';
import * as _ from 'lodash';

export default () => {
  return {
    restrict: 'E',
    scope: {
      collection: '=',
      paginatedCollection: '=',
      perPage: '=',
      navigationLength: '='
    },
    template: template,
    controllerAs: 'vm',
    controller: class PaginationController {
      constructor($scope) {
        'ngInject';
        this.$scope = $scope;
        this.perPage = $scope.perPage || 5;
        this.shownIndexesCount = $scope.navigationLength || 5;
        $scope.$watchCollection('collection', collection => {
          this.collection = collection;
          this.lastIndex = Math.ceil(this.collection.length / this.perPage) - 1;
          this.allIndexes = _.range(0, this.lastIndex + 1);
          this.beginning();
        });
      }

      beginning() {
        this.currentIndex = 0;
        this.index = 0;
        this.updateCollection();
      }

      end() {
        this.currentIndex = _.last(this.allIndexes);
        while(this.index + this.shownIndexesCount <= this.lastIndex) this.index += this.shownIndexesCount;
        this.updateCollection();
      }

      moveTo(index) {
        this.currentIndex = index;
        this.updateCollection();
      }

      previousIndexes() {
        this.currentIndex = this.index - 1;
        this.index -= this.shownIndexesCount;
        this.updateCollection();
      }

      nextIndexes() {
        this.index += this.shownIndexesCount;
        this.currentIndex = this.index;
        this.updateCollection();
      }

      updateCollection() {
        this.$scope.paginatedCollection = _.take(this.collection.slice(this.currentIndex * this.perPage), this.perPage);
      }
    }
  };
};
