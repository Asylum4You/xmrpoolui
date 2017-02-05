'use strict';

angular.module('utils.services', [])

.service('dataService', function($http) {
    var apiURL = "https://api.xmrpool.net";

    // delete $http.defaults.headers.common['X-Requested-With'];
    this.getData = function(url, callbackFunc, errCallback) {
        $http({
            method: 'GET',
            url: apiURL + url,
            // params: 'limit=10, sort_by=created:desc',
            // headers: {'Authorization': 'Token token=xxxxYYYYZzzz'}
        }).then(function successCallback(response) {
          // With the data succesfully returned, call our callback
          callbackFunc(response.data);
        }, function errorCallback(response) {
          if (errCallback && response != undefined) errCallback(response); else console.log("Network Error", response);
          // called asynchronously if an error occurs
          // or server returns response with an error status.
        }).$promise;
     }
})

.service('timerService', function($interval) {
    var timer;
    var listeners = {};

    this.startTimer = function(ms) {
        timer = $interval(function() {
            Object.keys(listeners).forEach(function(key,index) {
                return listeners[key]();
            });
        }, ms);
    }

    this.stopTimer = function(){
        $interval.cancel(timer);
    }

    this.register = function(callback, key){
        // console.log("Registering requests for", key);
        return listeners[key] = callback;
    }

    this.remove = function(key){
        // console.log("Destroying requests for", key);
        delete listeners[key];
    }
})

.service('minerService', function(dataService, timerService, $localStorage, ngAudio) {
  var addrStats = {};
  var callback;
  var storage = $localStorage;
  
  this.trackAddress = function (addr) {
    addrStats[addr] = {};
    track();
  }

  this.deleteAddress = function (key) {
    delete addrStats[key];
    console.log("deleting");
  };

  this.getData = function (){
    return addrStats;
  }

  this.setAlarm = function(addr, bool){
    addrStats[addr].alarm = bool;
    storage.minerStats[addr].alarm = bool;
  }

  var track = function(){
    Object.keys(addrStats).forEach(function(key,index) {
      // Get Miner stats
      dataService.getData("/miner/"+key+"/stats", function(data){
        addrStats[key] = Object.assign(addrStats[key], data);

        // check and inject alarm var
        if (addrStats[key].alarm == undefined) {
          addrStats[key].alarm = false;
        }

        // Set default miner name address
        if (addrStats[key].name === undefined) {
          addrStats[key].name = key;
        }
        
        // update
        storage.minerStats = addrStats;
        callback(addrStats);
      });

      // Get all miner stats 
      // This should run only when the user is at the dashboard
      dataService.getData("/miner/"+key+"/identifiers", function(data){
        for (var i = 0, len = data.length; i < len; i++) {
          console.log("/miner/"+key+"/chart/hashrate/"+data[i]);

          dataService.getData("/miner/"+key+"/chart/hashrate/"+data[i], function(data){
            console.log(data);
          });
        }
        
      });


    });

  }

  this.start = function (cb){
    timerService.register(track, 'minerStats');
    addrStats = storage.minerStats || {} ;
    callback = cb;
    track(); // also run immediately
  }
});