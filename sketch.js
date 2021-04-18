function heuristic(a, b) {
	return dist(a.i, a.j, b.i, b.j);
}
let cols = 25,
	rows = cols;
let w, h;

let currentCreating;
let stack = [];
let mazeCreated = false;
let solvingStarted = false;
let grid = new Array(cols);
let openSet = [];
let closedSet = [];
let start, end, current;
let path = [];
let solution = true;

function removeWalls(a, b) {
	let x = a.i - b.i;
	let y = a.j - b.j;
	if (x === 1) {
		a.walls[3] = false;
		b.walls[1] = false;
	} else if (x === -1) {
		a.walls[1] = false;
		b.walls[3] = false;
	} else if (y === 1) {
		a.walls[0] = false;
		b.walls[2] = false;
	} else if (y === -1) {
		a.walls[2] = false;
		b.walls[0] = false;
	}
}

class Cell {
	constructor(i, j) {
		this.i = i;
		this.j = j;
		this.walls = [true, true, true, true];
		//T,R,B,L
		this.visited = false;

		//solver
		this.f = 0;
		this.g = 0;
		this.h = 0;
		this.x = this.i * w + w / 2;
		this.y = this.j * h + h / 2;
		this.neighbors = [];
		this.prev = undefined;
	}

	show() {
		let x = this.i * w;
		let y = this.j * h;
		stroke(25);
		strokeWeight(2);
		this.walls[0] && line(x, y, x + w, y);
		this.walls[1] && line(x + w, y, x + w, y + h);
		this.walls[2] && line(x, y + h, x + w, y + h);
		this.walls[3] && line(x, y, x, y + w);

		fill(0, 0);
		this.visited && fill("#51f4d3");
		noStroke();
		rect(x, y, w, h);
	}
	highlight() {
		let x = this.i * w + 2;
		let y = this.j * h + 2;
		fill("#f164ff");
		noStroke();
		rect(x, y, w - 4, h - 4);
	}
	checkNeighbors() {
		//for creater
		let neighbors = [];
		let i = this.i;
		let j = this.j;
		i < cols - 1 && !grid[i + 1][j].visited && neighbors.push(grid[i + 1][j]);
		i > 0 && !grid[i - 1][j].visited && neighbors.push(grid[i - 1][j]);
		j < rows - 1 && !grid[i][j + 1].visited && neighbors.push(grid[i][j + 1]);
		j > 0 && !grid[i][j - 1].visited && neighbors.push(grid[i][j - 1]);

		if (neighbors.length > 0) {
			return random(neighbors);
		} else {
			return undefined;
		}
	}

	addNeighbors(grid) {
		//for solver
		let i = this.i;
		let j = this.j;
		!this.walls[1] && i < cols - 1 && this.neighbors.push(grid[i + 1][j]);
		!this.walls[3] && i > 0 && this.neighbors.push(grid[i - 1][j]);
		!this.walls[2] && j < rows - 1 && this.neighbors.push(grid[i][j + 1]);
		!this.walls[0] && j > 0 && this.neighbors.push(grid[i][j - 1]);
	}
}

function setup() {
	let winSize = min(windowHeight, windowWidth);
	createCanvas(min(1000, winSize), min(1000, winSize));

	w = floor(width / cols);
	h = floor(height / rows);

	strokeWeight(1);
	strokeCap(SQUARE);

	//creating 2D grid
	for (let i = 0; i < cols; i++) {
		grid[i] = new Array(rows);
	}
	//adding cell to grid
	for (let i = 0; i < cols; i++) {
		for (let j = 0; j < rows; j++) {
			grid[i][j] = new Cell(i, j);
		}
	}
	//making first cell as starting state
	currentCreating = grid[0][0];
}

function draw() {
	background(50);

	for (let i = 0; i < cols; i++) {
		for (let j = 0; j < rows; j++) {
			grid[i][j].show();
		}
	}
	currentCreating.visited = true;
	currentCreating.highlight();

	if (!mazeCreated) {
		// while (!mazeCreated) {
		let next = currentCreating.checkNeighbors();
		if (next) {
			next.visited = true;
			stack.push(currentCreating);
			removeWalls(currentCreating, next);
			currentCreating = next;
		} else {
			if (stack.length > 0) {
				currentCreating = stack.pop();
			} else {
				mazeCreated = true;
				// frameRate(20);
			}
		}
		// }
	} else {
		//solver here
		if (!solvingStarted) {
			//adding neighbors
			for (let i = 0; i < cols; i++) {
				for (let j = 0; j < rows; j++) {
					grid[i][j].addNeighbors(grid);
				}
			}

			start = grid[0][0];
			end = grid[cols - 1][rows - 1];
			// start.wall = false;
			// end.wall = false;

			openSet.push(start);

			solvingStarted = true;
		} else {
			if (openSet.length > 0) {
				let winner = 0;
				for (let i = 0; i < openSet.length; i++) {
					if (openSet[i].f < openSet[winner].f) {
						winner = i;
					}
				}
				current = openSet[winner];
				if (openSet[winner] === end) {
					console.log("DONE!!!!");
					noLoop();
				}
				closedSet.push(current);
				openSet.splice(winner, 1);

				let neighbors = current.neighbors;
				for (let i = 0; i < neighbors.length; i++) {
					let neighbor = neighbors[i];
					if (!closedSet.includes(neighbor)) {
						let tempg = current.g + 1;
						let newPath = false;
						if (openSet.includes(neighbor)) {
							if (tempg < neighbor.g) {
								neighbor.g = tempg;
								newPath = true;
							}
						} else {
							neighbor.g = tempg;
							openSet.push(neighbor);
							newPath = true;
						}
						if (newPath) {
							neighbor.h = heuristic(neighbor, end);
							neighbor.f = neighbor.g + neighbor.h;
							neighbor.prev = current;
						}
					}
				}
			} else {
				console.log("NO SOLUTION");
				solution = false;
				noLoop();
				//no solution
			}
			if (solution) {
				path = [];
				let temp = current;
				path.push(current);
				while (temp.prev) {
					path.push(temp.prev);
					temp = temp.prev;
				}
			}
			noFill();
			stroke(255, 0, 255);
			strokeWeight(w / 4);
			beginShape();
			for (let i = 0; i < path.length; i++) {
				vertex(path[i].x, path[i].y);
			}
			endShape();
		}
	}
}

function keyPressed() {
	if (keyCode == 32) {
		saveCanvas(canvas, `maze${cols}x${rows}solved`, "png");
	}
}
