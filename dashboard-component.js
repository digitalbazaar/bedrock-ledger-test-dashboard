/*!
 * Copyright (c) 2017-2018 Digital Bazaar, Inc. All rights reserved.
 */
export default {
  bindings: {
    collection: '<brltCollection'
  },
  controller: Ctrl,
  templateUrl: 'bedrock-ledger-test-dashboard/dashboard-component.html'
};

/* @ngInject */
function Ctrl($interval, $route, brltPeerService) {
  const self = this;
  self.labels = [];
  self.data = [];
  self.data2 = [];

  self.datasetOverride = [{
    label: 'out merge',
    yAxisID: 'left-y-axis',
  }, {
    label: 'out total',
    yAxisID: 'right-y-axis',
  }, {
    label: 'total',
    yAxisID: 'right-y-axis2',
    backgroundColor: 'transparent',
  }];

  self.durationOverride = [{
    label: 'aggregate (ms)',
    yAxisID: 'left-y-axis',
  }, {
    label: 'findConsensus (ms)',
    yAxisID: 'left-y-axis',
  }, {
    label: 'recentHistoryMergeOnly (ms)',
    yAxisID: 'left-y-axis',
  }, {
    label: 'avgConsensusTime (sec)',
    yAxisID: 'right-y-axis',
    backgroundColor: 'transparent',
  }, {
    label: 'loadavg (5 min))',
    yAxisID: 'right-y-axis2',
    backgroundColor: 'transparent',
  }];

  self.options = {
    animation: false,
    legend: {
      display: true
    },
    scales: {
      yAxes: [{
        id: 'left-y-axis',
        position: 'left',
        scaleLabel: {
          display: true,
          labelString: 'out merge',
          fontSize: 12
        },
        ticks: {
          beginAtZero: true
        },
      }, {
        id: 'right-y-axis',
        position: 'right',
        scaleLabel: {
          display: true,
          labelString: 'out total',
          fontSize: 12
        },
        ticks: {
          beginAtZero: true
        },
      }, {
        id: 'right-y-axis2',
        position: 'right',
        scaleLabel: {
          display: true,
          labelString: 'total',
          fontSize: 12
        },
        ticks: {
          beginAtZero: true
        },
      }],
      xAxes: [{
        type: 'time',
        distribution: 'linear',
        time: {
          displayFormats: {
            minute: 'kk:mm',
          },
        },
      }]
    }
  };

  self.optionsDuration = {
    animation: false,
    legend: {
      display: true
    },
    scales: {
      yAxes: [{
        id: 'left-y-axis',
        position: 'left',
        scaleLabel: {
          display: true,
          labelString: 'duration (ms)',
          fontSize: 10,
        },
        ticks: {
          beginAtZero: true,
        },
        type: 'logarithmic',
      }, {
        id: 'right-y-axis',
        position: 'right',
        scaleLabel: {
          display: true,
          labelString: 'time (sec)',
          fontSize: 10,
        },
        ticks: {
          beginAtZero: true,
        },
        type: 'linear',
      }, {
        id: 'right-y-axis2',
        position: 'right',
        scaleLabel: {
          display: true,
          labelString: 'cpu load average',
          fontSize: 12
        },
        ticks: {
          beginAtZero: true
        },
      }],
      xAxes: [{
        distribution: 'linear',
        time: {
          displayFormats: {
            minute: 'kk:mm',
          },
        },
        type: 'time',
      }]
    }
  };

  self.$onInit = () => _getChartData();

  self.blocksPerMinute = (blocks, startTime) => {
    const seconds = (Date.now() - startTime) / 1000;
    const minutes = seconds / 60;
    return (blocks / minutes).toFixed(2);
  };

  self.refresh = () => {
    $route.reload();
  };

  $interval(() => _getChartData(), 30000);

  self.averageDups = () => {
    const dups = self.collection.peers.map(p => p.status.events.dups);
    if(dups.some(d => d === null)) {
      return 0;
    }
    const sum = dups.reduce((a, b) => a + b, 0);
    return Math.round(sum / dups.length);
  };

  self.averageEventsPerSecond = () => {
    const eventsPerSecond = self.collection.peers.map(p =>
      p.status.events.eventsPerSecondLocal +
        p.status.events.eventsPerSecondPeer);
    // incase some peers are not reporting
    if(eventsPerSecond.some(d => d === null)) {
      return 0;
    }
    const sum = eventsPerSecond.reduce((a, b) => a + b, 0);
    return Math.round(sum / eventsPerSecond.length);
  };

  self.averageOpsPerSecond = () => {
    const opsPerSecond = self.collection.peers.map(p =>
      p.status.opsPerSecond.peer + p.status.opsPerSecond.local);
    // incase some peers are not reporting
    if(opsPerSecond.some(d => d === null)) {
      return 0;
    }
    const sum = opsPerSecond.reduce((a, b) => a + b, 0);
    return Math.round(sum / opsPerSecond.length);
  };

  self.dupPercent = () => {
    const eps = self.averageEventsPerSecond();
    if(eps === 0) {
      return 0;
    }
    const epm = eps * 60;
    return `${Math.round(self.averageDups() / epm * 100)}%`;
  };

  function _getChartData() {
    if(self.collection.peers.length !== 0) {
      const primaryIndex = self.collection.peers
        .findIndex(p => p.label.startsWith('Primary-'));
      const primaryId = self.collection.peers[primaryIndex]._id;
      brltPeerService.get(primaryId).then(result => {
        self.labels = result.map(r => r.timeStamp);
        self.data = [
          result.map(r => r.status.events.mergeEventsOutstanding),
          result.map(r => r.status.events.outstanding),
          result.map(r => r.status.events.total),
        ],
        self.data2 = [
          result.map(r => r.status.duration.aggregate),
          result.map(r => r.status.duration.findConsensus),
          result.map(r => r.status.duration.recentHistoryMergeOnly),
          result.map(r => Math.round(r.status.events.avgConsensusTime / 1000)),
          // this is result of `os.loadavg`, second element is 5 min avg
          result.map(r => r.status.loadAverage[1]),
        ];
        console.log('PRIMARY', result);
      });
    }
  }
}
