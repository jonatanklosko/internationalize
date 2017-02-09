import '../assets/sass/main.scss';

import 'babel-polyfill';

import 'jquery';

import angular from 'angular';
import uiRouter from 'angular-ui-router';
import ngMaterial from 'angular-material';
import mdCollectionPagination from 'md-collection-pagination';

import config from './app.config';

import services from './services';
import directives from './directives';
import views from './views';

angular
  .module('app', [
    uiRouter,
    ngMaterial,
    mdCollectionPagination,
    services,
    directives,
    views
  ])
  .config(config);
