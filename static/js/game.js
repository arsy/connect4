var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var body = document.getElementById("body");
var u = document.getElementById("g");
var c = document.getElementById("r");

var tilesize = 100;
var mousetile;
var animtile;
var intervalID;
var animID;
var board = new Array(7);
for (var i = 0 ; i < 7 ; i++){
	board[i]= new Array();
}

var animboard = board.map(function(arr){
	return arr.slice();
});

var turn;

var track = 0;

var socket = io.connect('http://' + document.domain + ':' + location.port);
socket.on('connect', function() {
    socket.emit('my event', {data: 'I\'m connected!'});
});
socket.on('my response', function(msg) {
    console.log(msg);
    if (msg == "new highscore"){
    	document.getElementById("space").innerHTML="<h2>New highscore</h2>";
    }
});


function newgame(firstplayer){
	document.getElementById("newgame").style.display="none";

	//check if computer plays first
	if (firstplayer == 'C'){
		turn = 'c';
		var chance = Math.floor(Math.random() * 3);
		if (chance == 0){
			board[2].push("c");
			animtile = 2;
		}
		else if (chance == 3){
			board[4].push("c");
			animtile = 4;
		}
		else{
			board[3].push("c");
			animtile = 3;
		}

		animID = setInterval(animplay);
	}
	else {
		turn = "u";
		drawgame();
		game();
	}
	canvas.addEventListener('mousemove', mouseMoveHandler , false);
}



function endgame(winner,i){
	canvas.removeEventListener('mousemove', mouseMoveHandler , false);
	canvas.removeEventListener('click', clickHandler , false);

	if (i != undefined){
		ctx.arc((i*tilesize)+(tilesize/2),((7-board[i].length)*tilesize)+(tilesize/2),35,0,2*Math.PI);
		ctx.strokeStyle="#FFD700";
		ctx.lineWidth=2;
		ctx.shadowBlur=30;
		ctx.shadowColor="white";
		ctx.stroke();
	}

	ctx.fillStyle="#3A485A";
	ctx.fillRect(0,0,tilesize*7,tilesize);
	ctx.save();

	var font = "60px Futura, Helvetica, sans-serif";
	ctx.fillStyle = "#EEF";
	ctx.font = font;

	var text;
	var score = 0;
	score += (track * 1000);

	var win = 0;
	var lose = 0;
	if (winner == 'c'){
		lose+=1;
		text = "I won MuHaHaHa"
		ctx.fillText(text, 125,50);

	} else if (winner=='u'){
		win+=1;
		score += 10000;
		for(var i = 0 ; i < 7 ; i ++){
			score += ((6-board[i].length)*100);
		}
		text = "you won so what";
		ctx.fillText(text, 125,50);
	} else {
		text = "draw"
		ctx.fillText(text, 300,50);
	}
	
	font = "50px Futura, Helvetica, sans-serif";
	ctx.font = font;
	ctx.fillText('score '+score, 250, 90);
	ctx.save();

	
    
    socket.emit('savegame', {score : score, win: win, lose:lose});
}
function game(){
	var empty = 0;
	for(var i = 0 ; i < 7 ; i ++){
		empty += (6-board[i].length);
	}
	if(empty == 0){endgame();return;}

	if(turn == 'u'){
		intervalID = setInterval(animateloc, 10);
		canvas.addEventListener('click', clickHandler , false);
	} else if(turn == 'c'){
		var Tboard = board.map(function(arr){
			return arr.slice();
		});
		animboard = board.map(function(arr){
			return arr.slice();
		});
		var move = think(Tboard);
		board[move].push("c");

		animtile = move;
		animID = setInterval(animplay, 10);
	}
}

function mouseMoveHandler (e) {
    var relativeX = e.clientX - canvas.offsetLeft;
    if(relativeX > 0 && relativeX < canvas.width) {
    	mousetile = Math.floor(relativeX/tilesize);
    }
}
function clickHandler(e){
	if (board[mousetile].length < 6){
		canvas.removeEventListener('click', clickHandler , false);
		clearInterval(intervalID);
		animboard = board.map(function(arr){
			return arr.slice();
		});
		board[mousetile].push("u");
		
		animtile= mousetile;
		
		animID = setInterval(animplay, 10);
	}
}



function checkwin(Cboard,col){
	var row = (Cboard[col].length)-1;
	if ( (checkconnected(Cboard,col,row,1,0) + checkconnected(Cboard,col,row,-1,0))>2 ){
		return true;
	}
	else if (checkconnected(Cboard,col,row,0,-1)>2 ){
		return true;
	}
	else if ( (checkconnected(Cboard,col,row,1,-1) + checkconnected(Cboard,col,row,-1,1))>2 ){
		return true;
	}
	else if ( (checkconnected(Cboard,col,row,1,1) + checkconnected(Cboard,col,row,-1,-1))>2 ){
		return true;
	}

	return false;
}

function valid(Cboard, col, row, p){
	if ((((col < 7) && (col >= 0) && ((row < 6)&&(row >= 0)))) && ((Cboard[col][row] == p) || (Cboard[col][row] == undefined))){
		return true;
	}
	return false;
}

function streak(Cboard,col){
	var row = (Cboard[col].length)-1;
	var p = Cboard[col][row];
	var s;
	var s1;
	if (((s=checkconnected(Cboard,col,row,1,1))+(s1=checkconnected(Cboard,col,row,-1,-1)))>1){
		if (valid(Cboard,col+s+1,row+s+1,p)||(valid(Cboard,col-s1-1,row-s1-1,p))){
			return true;
		}
	}
	else if (((s=checkconnected(Cboard,col,row,1,0))+(s1=checkconnected(Cboard,col,row,-1,0)))>1 ){
		if (valid(Cboard,col+s+1,row,p)||(valid(Cboard,col-s1-1,row,p))){
			return true;
		}
	}
	else if (((s1=checkconnected(Cboard,col,row,1,-1))+(s1=checkconnected(Cboard,col,row,-1,1)))>1 ){
		if (valid(Cboard,col+s+1,row-s-1,p)||(valid(Cboard,col-s1-1,row+s1+1,p))){
			return true;
		}
	}
	else if ((s=checkconnected(Cboard,col,row,0,-1))>1 ){
		if (valid(Cboard,col,row+1,p)){
			return true;
		}
	}
	return false;
}


function checkconnected(Cboard, col, row, col_inc, row_inc){
	if (chipvalue(Cboard,col,row) == chipvalue(Cboard,col+col_inc,row+row_inc)){
		return 1 + checkconnected(Cboard,col+col_inc,row+row_inc,col_inc, row_inc);
	} else {
		return 0;
	}
}



function chipvalue(Cboard,col,row){
	if(Cboard[col] == undefined || Cboard[col][row] == undefined){
		return 0;
	} else {
		return Cboard[col][row];
	}
}

function play(Cboard, col, P){
	Cboard[col].push(P);
}

function think(Cboard){
	//check for winning
	for (var i = 0; i< 7; i++){
		if (Cboard[i].length < 6){
			//clone the board
			var Tboard = Cboard.map(function(arr){
				return arr.slice();
			});
			play(Tboard, i, 'c');
			if (checkwin(Tboard,i)){
				return i;
			}
		}
	}

	//block opp winning
	for (var i = 0; i< 7; i++){
		if (Cboard[i].length < 6){
			//clone the board
			var Tboard = Cboard.map(function(arr){
				return arr.slice();
			});
			play(Tboard, i, 'u');
			if (checkwin(Tboard,i)){
				track++;
				return i;
			}
		}
	}

	//block opp winnable streaks and make sure i dont make him win
	for (var i = 0; i< 7; i++){
		if (Cboard[i].length < 6){
			//clone the board
			var Tboard = Cboard.map(function(arr){
				return arr.slice();
			});
			play(Tboard, i, 'u');
			
			//check if makes streak
			if (streak(Tboard,i)){
				Tboard[i][Tboard[i].length-1]='c';
				if(Tboard[i].length <6 ){
					play(Tboard, i, 'u')
					if(!checkwin(Tboard,i)){
						return i;
					}	
				}
				else {
					return i;
				}
			}
		}
	}

	//make a winnable streak without making his next move win
	for (var i = 0; i< 7; i++){
		if (Cboard[i].length < 6){
			//clone the board
			var Tboard = Cboard.map(function(arr){
				return arr.slice();
			});
			play(Tboard, i, 'c');
			
			//check if makes streak
			if (streak(Tboard,i)){
				if(Tboard[i].length <6 ){
					play(Tboard, i, 'u')
					if(!checkwin(Tboard,i)){
						return i;
					}	
				}
				else {
					return i;
				}
			}
		}
	}
	//make a random choice that doesn't make him win
	var avail = new Array();
	for (var i = 0; i< 7; i++){
		if (Cboard[i].length < 6){
			//clone the board
			var Tboard = Cboard.map(function(arr){
				return arr.slice();
			});
			play(Tboard, i, 'c');
			if(Tboard[i].length <6 ){
				play(Tboard, i, 'u')

				if(!checkwin(Tboard,i)){
					avail.push(i);
				}	
			}
			else {
				avail.push(i);
			}
		}
	}
	if (avail.length > 0){
		return avail[Math.floor(Math.random() * avail.length)];
	}

	
	//if all that fails
	for (var i = 0; i< 7; i++){
		if (Cboard[i].length < 6){
			return i;
		}
	}
}

//drawing functions


function drawboard(){
	for (var x = 0; x<7 ; x++){
		for (var y = 1; y<7 ; y++){
			ctx.drawImage(body , x*tilesize , y*tilesize , tilesize , tilesize);
		}
	}
	
}
function wchip(w){
	if (w=='u'){
		return u;
	}
	else{
		return c;
	}
}
function drawchips(board){
	for (var i = 0 ; i < 7 ; i++){
		for (var j = 0 ; j < board[i].length ; j++){
			ctx.drawImage(wchip(board[i][j]), (i*tilesize),(tilesize*(6-j)),100,100);
		}
	}
}

function animateloc(){
	if(turn == 'u'){
		ctx.clearRect(0, 0, canvas.width, tilesize);
		ctx.drawImage(u , (mousetile*tilesize)+10, 10, 80 , 80);
	}
}


var curloc=10;
function animplay(){
	
	ctx.clearRect(0,0,canvas.width,canvas.height);
	if (curloc<((6-animboard[animtile].length)*tilesize)){
		if (turn == "u"){
			ctx.drawImage(u,(animtile*tilesize)+10,curloc,80,80);
		} else {
			ctx.drawImage(c,(animtile*tilesize)+10,curloc,80,80);
		}
		drawchips(animboard);
		drawboard();
		curloc+=25;
	}
	else {
		curloc = 10;
		clearInterval(animID);
		drawgame();
		if(checkwin(board,animtile)){
			endgame(turn == "c" ? "c" : "u",animtile);
			return;
		}
		turn = turn == "c" ? "u" : "c";

		game();
	}
}


function drawgame(){
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawchips(board);
	drawboard();
}
