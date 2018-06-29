var app = angular.module('app', []);

app.controller('Controller', ['$scope', '$http', '$parse', function($scope, $http, $parse) {

	$scope.groups = [[], [], [], [], []];
	$scope.selected = 0;
	$scope.marked = new Set();

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

	$scope.clickCard = function(card) {
		$scope.marked.add(card.name);
		$scope.groups[$scope.selected].push(card.name);
	}

	$scope.clickMarked = function(e, groupIndex, index) {
		var name = $scope.groups[groupIndex][index];
		$scope.groups[groupIndex].splice(index, 1);
		if (e.shiftKey) {
			$scope.marked.delete(name);
		} else {
			$scope.groups[$scope.selected].push(name);
		}
	}
	
	// Dirty load/save code
	
	$scope.save = function() {
		var lines = [];
		for (var i = 0; i < $scope.groups.length; i++) {
			lines.push('# GROUP' + i);
			for (card of $scope.groups[i]) {
				lines.push(card);
			}
		}
		var download = document.getElementById('download');
		download.download = 'cards.txt';
		download.href = 'data:text/plain;charset=utf-8;base64,' + utf8ToBase64(lines.join('\n'));
		download.click();
	}
	
	$scope.handleDragOver = function(e) {
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
	};
	
	$scope.readFile = function(e) {
		var reader = new FileReader();
		var file = e.target.files[0];
		reader.onload = function(e1) {
			var data = e1.target.result;
			$scope.$apply(function() {
				parse(data.split(/\r?\n/), $scope.viewIndex);
			});
		}
		reader.readAsText(file, 'UTF-8');
	};
	
	function parse(lines) {
		var group = 0;
		for (var line of lines) {
			line = line.trim();
			if (line.startsWith('#')) {
				group++;
			} else {
				if (!$scope.marked.has(line)) {
					$scope.marked.add(line)
					$scope.groups[group - 1].push(line);
				}
			}
		}
	}
	
	$scope.load = function() {
		document.getElementById('upload').click();
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

function utf8ToBase64(str) {
	return btoa(unescape(encodeURIComponent(str)));
}
