/**
* Read content of a single file
*/
function readFile(file, callback){
	var reader = new FileReader();
	var fileData = {path: file.webkitRelativePath, content: null}
	var replacements = {"ð":"ğ", "ý":"ı", "þ":"ş", "Ý":"İ","Þ":"Ş"};
	reader.onloadend = function(event){
		fileData.content = event.target.result.toLowerCase().
						       replace(/ý|þ|ð|Ý/g, function(char){ return replacements[char]});
        	callback(fileData);
	};
	reader.readAsText(file, 'ISO-8859-15');
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
	//var i = 0;
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
* Set global vocabulary on authors according to words in training dataset
*/
function setWordCounts(authors, corpus){
	var result = new Object();
	//set global vocabulary
	vocabulary = new Object();
	for(var author in authors){
		authors[author].totalWordCount = 0;
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
				authors[author].totalWordCount++;
				vocabulary[docTokenized[j]] = 1; //Set occurence of vocabulary
			}
		}
		authors[author].uniqueWordCount = Object.keys(authors[author]["wordProbs"]).length;		
	}
	corpus.vocabulary = new Array();
	for(var voc in vocabulary)
		corpus.vocabulary.push(voc);
}

/**
* Update word counts with word probabilities
* Word prob = count of word w in all docs of author a / count of all words in all docs of author a
* One additive laplace smoothing
*/
function setWordProbs(authors){
	for(var author in authors){
		for(var word in authors[author]["wordProbs"]){
			authors[author]["wordProbs"][word] = (authors[author]["wordProbs"][word] + 1) / (authors[author].totalWordCount + 10);
		}
		authors[author].getWordProb = function(word){ //Function to return word prob of author
			if(typeof this.wordProbs[word] == "undefined" || this.wordProbs[word] == "")
				return 1/(this.totalWordCount + 10);
			else
				return parseFloat(this.wordProbs[word]);
		}
	}
	

}

/**
* Predict author of inputDocument
*/
function naiveBayes(inputDocument, authors){
	var docTokenized = tokenizer(inputDocument.content);
	var maxTotal = 0;
	var maxAuthor = "";
	for(var author in authors){
		var total = 0;
		for(var j=0; j<docTokenized.length; j++){ 
			if(typeof docTokenized[j] == "undefined" || docTokenized[j] == "")
				continue;
			total += authors[author].getWordProb(docTokenized[j]);			
		}
		if(total >= maxTotal){
			maxTotal = total;
			maxAuthor = author;
		}
	}
	inputDocument.predictedAuthor = maxAuthor;
}

function runNaiveTest(corpus, authors){
	var suc = 0;
	for(var i=0; i<corpus.test.length; i++){
		naiveBayes(corpus.test[i], authors);
		if(corpus.test[i].author == corpus.test[i].predictedAuthor)
			suc++;
	}
	console.log("Num of accurate prediction: ",suc);

}


function init(){
	//If new folder is uploaded, regenerate model
	document.getElementById('authorFiles').addEventListener('change', function(event){
		readFolder(event, function(response){ //folder is read
			//console.log("Uploaded folder is read: ", response);
			var authors = splitTrainData(response);	
			var corpus = getCorpus(authors);
			console.log("Corpus: ", corpus);
			download(JSON.stringify(corpus),"corpus.txt","text/plain", "downloadCorpus");
			localStorage.setItem("authors", JSON.stringify(authors)); //Save read data to localstorage for further use
			init();
		});
	}, false);

	var authors = JSON.parse(localStorage.getItem("authors"));
	var corpus = getCorpus(authors);
	setWordCounts(authors, corpus);
	setWordProbs(authors)
	download(JSON.stringify(authors),"authors.txt","text/plain", "downloadAuthors");
	download(JSON.stringify(corpus.vocabulary),"vocabulary.txt","text/plain", "downloadVocabulary");
	console.log("Authors: ", authors);
	//runNaiveTest(corpus, authors);
	console.log("Corpus: ", corpus);
	naiveBayes(corpus.test[0], authors);
	console.log(corpus.test[0]);
	document.getElementById("result").innerHTML = "";
}









