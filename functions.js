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
	for(var author in authors){
		var authorFiles = authors[author];
		var testFilesCount = Math.floor(authorFiles.train.length*0.4); //Num of test files = 40% of all files of an author
		for(var i=0; i<testFilesCount; i++){
			var rand = Math.floor(Math.random()*authorFiles.train.length);
			var selected = authors[author].train.splice(rand, 1); //Randomly selected document of author, put it to test data
			authors[author].test.push(selected[0]);
		}			
	}
	return authors;
}

/**
* Returns global train & test documents
*/
function getCorpus(authors){
	var corpus = {train: new Array(), test: new Array(), authorList: new Array()}; //Global train & test documents, collection of all authors
	for(var author in authors){
		corpus.test = corpus.test.concat(authors[author].test);
		corpus.train = corpus.train.concat(authors[author].train);
		corpus.authorList.push(author);
	}	
	return corpus;
}

/**
* Replace new lines with spaces and
* Punctuations are also tokenized
* Simple tokenizer; divide by spaces
*/
function tokenizer(data){
	return data.
		replace(/(~|`|!|@|#|$|%|^|&|\*|\(|\)|{|}|\[|\]|;|:|\"|'|<|,|\.|>|\?|\/|\\|\||-|_|\+|=)/g,' $1 ').
		replace(/\s\s+/g, ' '). //Replace new lines, whitespaces into single whitespace
		split(' ');
}

//Temporary 
function download(text, name, type, id){
	var a = document.getElementById(id);
	var file = new Blob([text], {type: type});
	a.href = URL.createObjectURL(file);
	a.download = name;
}

/**
* Train data is parsed to set word probabilities
* Set word probabilities & word counts to given authors object
* authors[author][wordProbs][word] = how many times "word" is used by "author"
* authors[author].wordCount = number of distinct words used by "author"
*/
function setWordCounts(authors){
	var result = new Object();
	for(var author in authors){
		if(typeof authors[author]["wordProbs"] == "undefined")
			authors[author]["wordProbs"] = new Object();
		for(var i=0; i<authors[author].train.length; i++){ //handle all docs of author
			var docTokenized = tokenizer(authors[author].train[i].content);
			for(var j=0; j<docTokenized.length; j++){ 
				if(typeof docTokenized[j] == "undefined" || docTokenized[j] == "")
					continue;
				if(typeof authors[author]["wordProbs"][docTokenized[j]] == "undefined")
					authors[author]["wordProbs"][docTokenized[j]] = 1;
				else
					authors[author]["wordProbs"][docTokenized[j]]++;
			}
		}
		authors[author].wordCount = Object.keys(authors[author]["wordProbs"]).length;		
	}
}

/**
* Update word counts with word probabilities
* Word prob = count of word w in all docs of author a / count of all words in all docs of author a
* TODO: Implement Laplace smoothing!!!!!!
*/
function setWordProbs(authors){
	for(var author in authors){
		for(var word in authors[author]["wordProbs"]){
			authors[author]["wordProbs"][word] /= authors[author].wordCount;
		}
	}
}

function init(){
  	document.getElementById('authorFiles').addEventListener('change', function(event){
		readFolder(event, function(response){ //folder is read
			//console.log("Uploaded folder is read: ", response);
			var authors = splitTrainData(response);	
			var corpus = getCorpus(authors);
			console.log("Corpus: ", corpus);
			download(JSON.stringify(corpus),"corpus.txt","text/plain", "downloadCorpus");
			//localStorage.setItem("authors", JSON.stringify(authors));
			setWordCounts(authors);
			setWordProbs(authors)
			download(JSON.stringify(authors),"authors.txt","text/plain", "downloadAuthors");
			console.log("Authors:", authors);
		});
	}, false);	
	/*var authors = JSON.parse(localStorage.getItem("authors"));
	setWordCounts(authors);
	setWordProbs(authors)
	download(JSON.stringify(authors),"authors.txt","text/plain", "downloadAuthors");
	console.log("Authors by localstorage:", authors);*/
	document.getElementById("result").innerHTML = "";
}









