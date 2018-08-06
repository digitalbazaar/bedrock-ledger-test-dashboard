/*!
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
 */
import angular from 'angular';
import DashboardComponent from './dashboard-component.js';
import PeerService from './peer-service.js';

const module = angular.module('bedrock.ledger-test-dashboard', [
  'chart.js', 'ngMaterial', 'md.data.table'
]);

module.component('brltDashboard', DashboardComponent);
module.service('brltPeerService', PeerService);
