/**
* Read content of a single file
*/
function readFile(file, callback){
	var reader = new FileReader();
	var fileData = {path: file.webkitRelativePath, content: null}
	reader.onloadend = function(event){
		fileData.content = event.target.result;
        	callback(fileData);
	};
	reader.readAsText(file);
}

/**
* Read authors folder into authors data structure
* returns authors object as callback parameter
* Temporarly put all files as train data, splitTrainData function will
* divide train data into test data 
*/
function readFolder(event, callback){
	var authors = new Object();
	var files = event.target.files;
	var allDone = files.length; //trigger callback function when all files are read
	for(var i=0; i<files.length; i++){
		readFile(files[i], function(fileData){ //Read each file
			var fileInfo = fileData.path.split("/"); //fileInfo[1] = author, fileInfo[2] = fileName
			fileData.author = fileInfo[1];
			if(typeof authors[fileInfo[1]] == "undefined")
				authors[fileInfo[1]] = {train: new Array(), test: new Array()}; //set author
			authors[fileInfo[1]].train.push(fileData); //Temporarly put all files of an author into train data
			allDone--;
			if(allDone <= 0)
				callback(authors);
		});
	}
}

/**
* Divide documents of each author into 
* train and test data sets
* each author has %60 train data, %40 test data
*/
function splitTrainData(authors){
	var corpus = {train: new Array(), test: new Array()}; //Global train & test documents, collection of all authors
	for(var author in authors){
		var authorFiles = authors[author];
		var testFilesCount = Math.floor(authorFiles.train.length*0.4); //Num of test files = 40% of all files of an author
		for(var i=0; i<testFilesCount; i++){
			var rand = Math.floor(Math.random()*authorFiles.train.length);
			var selected = authors[author].train.splice(rand, 1); //Randomly selected document of author, put it to test data
			authors[author].test.push(selected[0]);
		}
		corpus.test = corpus.test.concat(authors[author].test);
		corpus.train = corpus.train.concat(authors[author].train);				
	}
	return corpus;
}

//Simple tokenizer; divide by spaces
function tokenizer(data){
	return data.split(" ");
}

//Temporary 
function download(text, name, type) {
	var a = document.getElementById("downloadResult");
	var file = new Blob([text], {type: type});
	a.href = URL.createObjectURL(file);
	a.download = name;
}


function init(){
  	document.getElementById('authorFiles').addEventListener('change', function(event){
		readFolder(event, function(response){ //folder is read
			console.log("Uploaded folder is read: ", response);
			//localStorage.setItem("authors", JSON.stringify(response));
			var res = splitTrainData(response);	
			console.log("Corpus: ", res);
			download(JSON.stringify(res),"ihi.txt","text/plain");
		});
	}, false);	
	document.getElementById("result").innerHTML = "";
}









