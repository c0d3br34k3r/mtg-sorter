var app = angular.module('app', []);

app.controller('Controller', ['$scope', '$http', '$parse', function($scope, $http, $parse) {

	$scope.groups = {};
	$scope.selected = 0;
	$scope.marked = new Set();
	
	let sets = Object.values(database);
	sets.sort(function(a, b) {
		var setTypeCmp = setTypeIndex(a) - setTypeIndex(b);
		if (setTypeCmp != 0) {
			return setTypeCmp;
		}
		return -a.date.localeCompare(b.date);
	});
	$scope.sets = sets;

	$scope.update = function() {
		$scope.cards = database[$scope.selectedCode].cards;
	};

	$scope.key = function(e) {
		var index = parseInt(e.key);
		if (!isNaN(index) && $scope.selected != -1) {
			$scope.selected = index - 1;
		}
	};

	$scope.unmarkedCards = function() {
		if (!$scope.cards) {
			return [];
		}
		return $scope.cards.filter(function(card) {
			return !$scope.marked.has(card.name);
		});
	};
	
	function getGroup(key) {
		let list = $scope.groups[key]
		if (list === undefined) {
			list = [];
			$scope.groups[key] = list;
		}
		return list;
	}

	$scope.clickCard = function(card) {
		$scope.marked.add(card.name);
		getGroup($scope.selected).push(card.name);
	}

	$scope.clickMarked = function(e, groupIndex, index) {
		var name = $scope.groups[groupIndex][index];
		getGroup(groupIndex).splice(index, 1);
		if (e.shiftKey) {
			$scope.marked.delete(name);
		} else {
			getGroup($scope.selected).push(name);
		}
	}
	
	// Dirty load/save code
	
	$scope.save = function() {
		var download = document.getElementById('download');
		download.download = 'cards.txt';
		download.href = 'data:application/json;charset=utf-8;base64,' + utf8ToBase64(JSON.stringify($scope.groups));
		download.click();
	}

	$scope.handleDragOver = function(e) {
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
	};

	
	$scope.load = function() {
		document.getElementById('upload').click();
	};
	
	$scope.reminder = function(text) {
		return text.replace(/\([^\)]+\)/g, '');
	};
	
	$scope.within = function(colors, cardColors) {
		if (!cardColors) {
			return true;
		}
		for (let color of cardColors) {
			if (!colors.includes(COLORS[cardColors])) {
				return false;
			}
		}
		return true;
	};
	
	$scope.getText = function(card) {
		return card.name + (card.manaCost ? ' ' + card.manaCost : '') + '\n'
			+ card.type + '\n'
			+ (card.text ? card.text + '\n' : '')
			+ (card.power ? card.power + '/' + card.toughness : '')
			+ (card.loyalty ? card.loyalty : '');
	};
	
	$scope.next = function() {
		$scope.selectedCode = $scope.sets[$scope.sets.map(function(x) {
			return x.name;
		}).indexOf($scope.selectedCode) + 1].name;
		$scope.update();
	};

	$scope.previous = function() {
		$scope.selectedCode = $scope.sets[$scope.sets.map(function(x) {
			return x.name;
		}).indexOf($scope.selectedCode) - 1].name;
		$scope.update();
	};
	
}]);

var BASIC_LAND = new Set(['Plains', 'Island', 'Swamp', 'Mountain', 'Forest']);

var COLORS = {
	'White': 'W',
	'Blue': 'U',
	'Black': 'B',
	'Red': 'R',
	'Green': 'G'
};

function utf8ToBase64(str) {
	return btoa(unescape(encodeURIComponent(str)));
}

function setTypeIndex(set) {
	switch (set.type) {
	case 'core': 
	case 'expansion': 
		return 0;
	case 'commander':
	case 'draft_innovation':
		return 1;
	case 'masters':
		return 2;	
	case 'archenemy':
	case 'box': 
	case 'duel_deck':
	case 'from_the_vault':
	case 'masterpiece':
	case 'memorabilia':
	case 'spellbook':
	case 'planechase':
	case 'premium_deck':
	case 'starter':
	case 'global serires':
	case 'board game deck':
		return 3;
	case 'promo':
	case 'funny':
	case 'vanguard':
		return 4;
	default:
		console.log(set.name + ': ' + set.type);
		return 99;
	}
}

function utf8ToBase64(str) {
	return btoa(unescape(encodeURIComponent(str)));
}

var database;

function init(json) {
	database = json;
}
