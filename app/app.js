'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('poolui', [
	'ngRoute',
	'ngMaterial',
	'angularMoment',
	'ngStorage',
	'ngAudio',
	'utils.strings',
	'utils.services'
]).config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
	$locationProvider.hashPrefix('');
	// $mdIconProvider.defaultIconSet("https://rawgit.com/angular/material-start/es5-tutorial/app/assets/svg/avatars.svg", 128)

	$routeProvider
		.when('/home', {
			templateUrl: 'home/home.html',
			controller: 'HomeCtrl',
			activetab: 'home'
		})
		.when('/dashboard', {
			templateUrl: 'dashboard/dashboard.html',
			controller: 'DashboardCtrl',
			activetab: 'dashboard'
		})
		.when('/blocks', {
			templateUrl: 'blocks/blocks.html',
			controller: 'BlocksCtrl',
			activetab: 'blocks'
		})
		.when('/payments', {
			templateUrl: 'payments/payments.html',
			controller: 'PaymentsCtrl',
			activetab: 'payments'
		})
		.when('/network', {
			templateUrl: 'network/network.html',
			controller: 'NetworkCtrl',
			activetab: 'network'
		})
		.when('/help/chat', {
			templateUrl: 'help/chat.html',
			controller: 'ChatCtrl',
			activetab: 'support'
		})
		.when('/help/getting_started', {
			templateUrl: 'help/getting_started.html',
			controller: 'GettingStartedCtrl',
			activetab: 'help'
		})
		.when('/help/faq', {
			templateUrl: 'help/faq.html',
			controller: 'FAQCtrl',
			activetab: 'help'
		});


		$routeProvider.otherwise({redirectTo: '/home'});

	}]);

app.controller('AppCtrl', function($scope, $window, $route, $mdSidenav, $mdMedia, dataService, timerService, minerService, $localStorage, ngAudio){
	var appCache = window.applicationCache;

	$scope.poolList = ["pplns", "pps", "solo"];
	$scope.poolStats = {};
    $scope.lastBlock = {};
	
	// for miner tracking
	$scope.yourTotalHashRate = 0;

	// Hashrate Alarm
	$scope.globalSiren = false;
	$scope.sirenAudio = ngAudio.load("assets/ding.wav");
	$scope.$storage = $localStorage.$default({
    	hashRateLimit: 42
	});

	
	// Sidebar Toggle Stuff
	$scope.menuOpen = $mdMedia('gt-md');
	$scope.$watch(function() { return $mdMedia('gt-md'); }, function(big) {
    	$scope.menuOpen = $mdMedia('gt-md');
  	});

	$scope.toggleSidenav = function (){
		if (!$mdMedia('gt-md')) {
			$mdSidenav('left').toggle();
		} else {
			// toggle boolean
			$scope.menuOpen = !$scope.menuOpen;
		}
	}

	// Update global hashrate and set off alarm if any of the tracked addresses fall below the threshold
	var updateHashRate = function (addrStats){
		var totalHashRate = 0;
		var siren = false;
		Object.keys(addrStats).forEach(function(key,index) {
            totalHashRate += addrStats[key].hash;
            if (addrStats[key].alarm && addrStats[key].hash < $scope.$storage.hashRateLimit) {
            	siren=true;
            }
        });

		$scope.globalSiren=siren;
        $scope.yourTotalHashRate = totalHashRate;
	}

	var playSiren = function (){
		($scope.globalSiren) ? $scope.sirenAudio.play() : $scope.sirenAudio.stop();
	}

	var update = function() {
		
		if (appCache.status == window.applicationCache.UPDATEREADY) {
			appCache.swapCache();  // The fetch was successful, swap in the new cache.
			$window.location.reload();
		}
	}

	appCache.addEventListener("updateready", function(event) {
		console.log("UpdateReady Event Caught");
		update();
	}, false);

	var updateCache = function () {
		var appCache = window.applicationCache;
		update();
		 // appCache.update(); Attempt to update the user's cache.
	}

	var loadData = function () {
		dataService.getData("/pool/stats", function(data){
			$scope.poolList = data.pool_list;
			$scope.poolStats.global = data.pool_statistics;
		});

		dataService.getData("/network/stats", function(data){
			$scope.network = data;
		});
	}

	// Set active page in the sidebar
	$scope.isActivePage = function(page) {
		return ($route.current && ($route.current.activetab == page)) ? 'selected' : '';
	}

	// Start the timer and register global requests
	timerService.startTimer(3000);
	timerService.register(loadData, 'global');
	// Also Load immediately
	loadData();
	updateCache();

	// Start minerservice after starting timer, only one callback supported at a time
	minerService.start(function(addrStats) {
			$scope.trackedAddresses = addrStats;
			updateHashRate(addrStats);
			playSiren();
		}
	);


});