var app = angular.module('app', []);

app.controller('Controller', ['$scope', '$http', '$parse', function($scope, $http, $parse) {

	$scope.groups = [['Opt'], [], [], [], []];
	$scope.selected = -1;

	$http.get('./AllSets.json', {responseType: 'json'}).then(function(result) {
		$scope.mtgjson = result.data;
		var sets = Object.values($scope.mtgjson).filter(function(set) {
			return !set.name.startsWith('p') && !set.onlineOnly && set.cards[0].multiverseid;
		});
		sets.sort(function(a, b) {
			var setTypeCmp = setTypeIndex(a) - setTypeIndex(b);
			if (setTypeCmp != 0) {
				return setTypeCmp;
			}
			return -a.releaseDate.localeCompare(b.releaseDate);
		});
		$scope.sets = sets.map(function(set) {
			return {name: set.code, type: 'type' + setTypeIndex(set)};
		});
	});

	$scope.update = function() {
		var filter = $scope.filter ? $parse($scope.filter) : function() { return true; };
		var cards = $scope.mtgjson[$scope.selectedCode].cards.filter(function(card) {
			if (BASIC_LAND.has(card.name)) {
				return false;
			}
			switch (card.layout) {
			case 'normal': 
				return true;
			case 'split':
			case 'flip':
			case 'double-faced': 
				return card.name == card.names[0];
			case 'meld': 
				return card.name != card.names[2];
			default: 
				return false;
			}
		}).filter(function(card) {
			return filter($scope, {card: card});
		});
		cards.sort(function(a, b) {
			return a.name.localeCompare(b.name); 
		});
		$scope.cards = cards;
	};
	
	$scope.getCards = function() {
		var marked = new Set($scope.groups.reduce(function(total, amount) {
			return total.concat(amount);
		}, []));
		if (!$scope.cards) {
			return [];
		}
		return $scope.cards.filter(function(card) {
			return !marked.has(card.name);
		});
	};
	
	$scope.selectCard = function(index) {
		$scope.selected = index;
	};

	$scope.selectMarked = function(index) {
		$scope.selected = index;
	};

	$scope.deselect = function() {
		$scope.selected = -1;
	};

	$scope.key = function(e) {
		var index = parseInt(e.key);
		console.log(index);
		if (!isNaN(index) && $scope.selected != -1) {
			$scope.groups[index - 1].push($scope.getCards()[$scope.selected].name);
		}
	};

}]);

BASIC_LAND = new Set(['Plains', 'Island', 'Swamp', 'Mountain', 'Forest']);

function utf8ToBase64(str) {
	return btoa(unescape(encodeURIComponent(str)));
}

function setTypeIndex(set) {
	switch (set.type) {
	case 'core': 
	case 'expansion': 
		return 0;
	case 'commander':
	case 'conspiracy':
	case 'Two-Headed Giant':
		return 1;
	case 'reprint':
	// case 'masters':
		return 2;	
	case 'planechase':
	case 'archenemy':
	case 'box': 
	case 'from the vault':
	case 'premium deck':
	case 'duel deck':
	case 'reprint':
	case 'starter':
	case 'masterpiece':
	case 'global serires':
	case 'board game deck':
	case 'signature spellbook':
		return 3;
	case 'promo':
	case 'un':
	case 'vanguard':
		return 4;
	default:
		console.log(set.name + ': ' + set.type);
		return 99;
	}
}
