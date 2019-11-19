// Get pixel color under the mouse.
var fs = require("fs");
var robot = require("robotjs");
var windowManipulation = require("../window-manipulation");

windowManipulation.getInfo("winmine").then(function (winpos) {
	console.log(winpos);

	// Get mouse position.
	var mouse = robot.getMousePos();

	// Get pixel color in hex format.
	var hex = robot.getPixelColor(mouse.x, mouse.y);
	console.log("#" + hex + " at x:" + mouse.x + " y:" + mouse.y);
	
	const UNKNOWN = 9;
	const MINE = 13;
	const FLAG = 11;
	const CLICKED = 14;
	const FAILMINE = 10;
	
	//Returns whether the smiley has glasses
	function isWin(img) {
		var hex = img.colorAt(140, 74);
		if (hex == "000000") {
			console.log("win");
			return true;
		}
		return false;
	}

	function getGrid() {
		console.log(winpos.TopLeft.X);
		console.log(winpos.TopLeft.Y);
		console.log(winpos.Width);
		console.log(winpos.Height);
		var img = robot.screen.capture(winpos.TopLeft.X, winpos.TopLeft.Y, winpos.Size.Width, winpos.Size.Height);
		if (isWin(img)) {
			return [];
		}

		let cases = [];
		for (let y=0; y<16; y++) {
			cases[y] = Array(16).fill(UNKNOWN);
			for (let x=0; x<16; x++) {
				//robot.moveMouse(22+16*x, 110+16*y);
				cases[y][x] = getKind(img, 15+16*x, 100+16*y);
			}
		}
		return cases;
	}

	function getAjustedGrid(grid) {
		let cases = [];
		for (let y=0; y<16; y++) {
			cases[y] = Array(16).fill(UNKNOWN);
			for (let x=0; x<16; x++) {
				cases[y][x] = getAjustedValue(grid, x, y);
			}
		}
		return cases;
	}

	function getAjustedValue(grid, x, y) {
		let value = grid[y][x];
		if (value > 0 && value < 6) value -= countFlag(grid, x, y);
		return value;
	}
	function getValue(grid, x, y) {
		let value = grid[y][x];
		return value;
	}

	function countFlag(grid, x, y) {
		let nb = 0;
		if (isFlag(grid, x-1, y-1)) nb++;
		if (isFlag(grid, x+0, y-1)) nb++;
		if (isFlag(grid, x+1, y-1)) nb++;
		if (isFlag(grid, x-1, y+0)) nb++;
		if (isFlag(grid, x+1, y+0)) nb++;
		if (isFlag(grid, x-1, y+1)) nb++;
		if (isFlag(grid, x+0, y+1)) nb++;
		if (isFlag(grid, x+1, y+1)) nb++;
		return nb;
	}

	function countClickable(grid, x, y) {
		let nb = 0;
		if (isClickable(grid, x-1, y-1)) nb++;
		if (isClickable(grid, x+0, y-1)) nb++;
		if (isClickable(grid, x+1, y-1)) nb++;
		if (isClickable(grid, x-1, y+0)) nb++;
		if (isClickable(grid, x+1, y+0)) nb++;
		if (isClickable(grid, x-1, y+1)) nb++;
		if (isClickable(grid, x+0, y+1)) nb++;
		if (isClickable(grid, x+1, y+1)) nb++;
		return nb;
	}

	function isSunrrounded(grid, x, y) {
		let nb = getSunrrounded(grid, x, y);
		return countClickable(grid, x, y) == nb;
	}

	function getSunrrounded(grid, x, y) {
		if (x == 0 && y ==0) return 3;
		if (x == 0 && y ==15) return 3;
		if (x == 15 && y ==0) return 3;
		if (x == 15 && y ==15) return 3;
		if (x == 0 || x ==15) return 5;
		if (y == 0 || y ==15) return 5;
		return 8;
	}

	function isFlag(grid, x, y) { //flag
		return y>=0 && x>=0 && y<16 && x<16 && grid[y][x] == FLAG;
	}
	function isClickable(grid, x, y) { //clickable
		return y>=0 && x>=0 && y<16 && x<16 && grid[y][x] == 0;
	}
	function isNumber(grid, x, y) {
		return y>=0 && x>=0 && y<16 && x<16 && grid[y][x] > 0 && grid[y][x] < 9;
	}

	function getProba(grid, x, y) {
		var probaMine = 0;
		var probaVide = 0;
		if (grid[y][x]==0) {
			probaMine = 0;
			probaVide = 0;
			
			if (isSunrrounded(grid, x, y)) probaMine = 0;
			if (isNumber(grid, x-1, y-1)) {
				let dd=getValue(grid, x-1, y-1) / (countClickable(grid, x-1, y-1) + countFlag(grid, x-1, y-1));
				probaMine = Math.max(probaMine, dd);
				dd = (getValue(grid, x-1, y-1)-countFlag(grid, x-1, y-1)) == 0 ? 1 : 0;
				probaVide = Math.max(probaVide, dd);
			}
			if (isNumber(grid, x, y-1)) {
				let dd=getValue(grid, x, y-1) / (countClickable(grid, x, y-1) + countFlag(grid, x, y-1));
				probaMine = Math.max(probaMine, dd);
				dd = (getValue(grid, x, y-1)-countFlag(grid, x, y-1)) == 0 ? 1 : 0;
				probaVide = Math.max(probaVide, dd);
			}
			if (isNumber(grid, x+1, y-1)) {
				let dd=getValue(grid, x+1, y-1) / (countClickable(grid, x+1, y-1) + countFlag(grid, x+1, y-1));
				probaMine = Math.max(probaMine, dd);
				dd = (getValue(grid, x+1, y-1)-countFlag(grid, x+1, y-1)) == 0 ? 1 : 0;
				probaVide = Math.max(probaVide, dd);
			}
			if (isNumber(grid, x-1, y)) {
				let dd=getValue(grid, x-1, y) / (countClickable(grid, x-1, y) + countFlag(grid, x-1, y));
				probaMine = Math.max(probaMine, dd);
				dd = (getValue(grid, x-1, y)-countFlag(grid, x-1, y)) == 0 ? 1 : 0;
				probaVide = Math.max(probaVide, dd);
			}
			if (isNumber(grid, x+1, y)) {
				let dd=getValue(grid, x+1, y) / (countClickable(grid, x+1, y) + countFlag(grid, x+1, y));
				probaMine = Math.max(probaMine, dd);
				dd = (getValue(grid, x+1, y)-countFlag(grid, x+1, y)) == 0 ? 1 : 0;
				probaVide = Math.max(probaVide, dd);
			}
			if (isNumber(grid, x-1, y+1)) {
				let dd=getValue(grid, x-1, y+1) / (countClickable(grid, x-1, y+1) + countFlag(grid, x-1, y+1));
				probaMine = Math.max(probaMine, dd);
				dd = (getValue(grid, x-1, y+1)-countFlag(grid, x-1, y+1)) == 0 ? 1 : 0;
				probaVide = Math.max(probaVide, dd);
			}
			if (isNumber(grid, x, y+1)) {
				let dd=getValue(grid, x, y+1) / (countClickable(grid, x, y+1) + countFlag(grid, x, y+1));
				probaMine = Math.max(probaMine, dd);
				dd = (getValue(grid, x, y+1)-countFlag(grid, x, y+1)) == 0 ? 1 : 0;
				probaVide = Math.max(probaVide, dd);
			}
			if (isNumber(grid, x+1, y+1)) {
				let dd=getValue(grid, x+1, y+1) / (countClickable(grid, x+1, y+1) + countFlag(grid, x+1, y+1));
				probaMine = Math.max(probaMine, dd);
				dd = (getValue(grid, x+1, y+1)-countFlag(grid, x+1, y+1)) == 0 ? 1 : 0;
				probaVide = Math.max(probaVide, dd);
			}
			//if (proba == 1) proba = 99;
		}
		return { "probaMine": probaMine, "probaVide": probaVide };
	}

	function getProbaGrid(grid) {
		let cases = [];
		for (let y=0; y<16; y++) {
			cases[y] = Array(16).fill(UNKNOWN);
			for (let x=0; x<16; x++) {
				let pro = getProba(grid, x, y);
				cases[y][x] = { "probaMine": Math.round(pro.probaMine*100)/100 , "probaVide": Math.round(pro.probaVide*100)/100  };
			}
		}
		return cases;
	}

	function findBestMine(grid, probaGrid) {
		let cases = [];
		for (let y=0; y<16; y++) {
			for (let x=0; x<16; x++) {
				cases.push( { "x": x, "y": y, "value": grid[y][x], "probaMine": probaGrid[y][x].probaMine, "probaVide": probaGrid[y][x].probaVide} );
			}
		}
		cases.sort(function(a, b){return b.probaMine - a.probaMine});
		return cases;
	}

	function findBestVide(grid, probaGrid) {
		let cases = [];
		for (let y=0; y<16; y++) {
			for (let x=0; x<16; x++) {
				cases.push( { "x": x, "y": y, "value": grid[y][x], "probaMine": probaGrid[y][x].probaMine, "probaVide": probaGrid[y][x].probaVide} );
			}
		}
		cases.sort(function(a, b){return b.probaVide - a.probaVide});
		return cases;
	}

	function getColor(img, x, y) {
		var color = img.colorAt(x+8, y+8);
		if (color == "c0c0c0") {
			color = img.colorAt(x+9, y+9);
		}
		if (color == "c0c0c0") {
			color = img.colorAt(x+5, y+4);
		}
		return color;
	}

	function getKind(img, x, y) {
		var hex = getColor(img, x, y);
		if (hex == "c0c0c0") {
			hex = img.colorAt(x+1, y+3);
			if (hex == "c0c0c0") {
				return CLICKED; //non clickable
			}
			return 0; //clickable
		} else if (hex == "0000ff") {
			return 1;
		} else if (hex == "008000") {
			return 2;
		} else if (hex == "ff0000") {
			hex = img.colorAt(x+8+1, y+8+3);
			if (hex == "000000") {
				return FLAG; //flag
			}
			return 3;
		} else if (hex == "000080") {
			return 4;
		} else if (hex == "800000") {
			return 5;
		} else if (hex == "008080") {
			return 6;
		} else if (hex == "000000") {
			hex = img.colorAt(x+2, y+2);
			if (hex == "ff0000") {
				return FAILMINE; //noir et rouge
			}
			hex = img.colorAt(x+7, y+7);
			if (hex == "ffffff") {
				return MINE; //noir et blanc
			}
			return 7;
		} else if (hex == "808080") {
			return 8;
		}
		return UNKNOWN;
	}
	//

	function perdu(grid) {
		for (let y=0; y<16; y++) {
			for (let x=0; x<16; x++) {
				if (grid[y][x]==10) {
					return true;
				}
			}
		}
		return false;
	}

	let grid = getGrid();
	console.log(grid);

	//robot.moveMouse(22, 100);
	//robot.mouseClick(); //focus
	let previousClick = {x: -1, y: -1};
	let yyy = 0;
	for (let ttt = 0; ttt<16*16; ttt++) {
		
		let grid = getGrid();
		if (grid.length==0) {
			break;
		}
		if (perdu(grid)) {
			break;
		}
		console.log();
		console.log(grid);
		//
		let probaGrid = getProbaGrid(grid)
		console.log();
		console.log(" ");

		let where = findBestVide(grid, getProbaGrid(grid));
		//console.log(where);
		let val = where[0];
		if (val.probaVide==1) {
			robot.moveMouseSmooth(winpos.TopLeft.X+22+val.x*16, winpos.TopLeft.Y+110+val.y*16);
			robot.mouseClick();
			
		} else {
			where = findBestMine(grid, getProbaGrid(grid));
			val = where[0];

			robot.moveMouseSmooth(winpos.TopLeft.X+22+val.x*16, winpos.TopLeft.Y+110+val.y*16);
			robot.mouseClick("right");

			
			if (val.x == previousClick.x && val.y == previousClick.y) {
				if (yyy == 5) {
					console.log("same click 1");
					console.log(previousClick);
					console.log(val);
					break;
				} else {
					yyy++;
				}
			}
		}
		previousClick = {x: val.x, y: val.y};
	}

	mouse = robot.getMousePos();
	hex = robot.getPixelColor(mouse.x, mouse.y);
	console.log("#" + hex + " at x:" + mouse.x + " y:" + mouse.y);

});

