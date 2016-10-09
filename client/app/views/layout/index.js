import angular from 'angular';

import './layout.partial.html';
import LayoutController from './layout.controller';

export default angular
  .module('app.view.layout', [])
  .controller('LayoutController', LayoutController)
  .name;
