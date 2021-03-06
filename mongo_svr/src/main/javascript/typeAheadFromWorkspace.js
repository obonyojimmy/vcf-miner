var numberReducers = 1;  //the number of concurent reducer tasks (we don't actually run them concurently)
var globalEmit = [];     //all of the json documents that come out of the map

function emit(key, value){
	var pair = {"key":key,"value":value}
	globalEmit.push(pair)
	//console.log(pair)
}


function map( that ){
	var next = that;  //in mongodb tjis is called this, but this is a reserved word in javascript :( - map it to the variable next so that the rest of the code can transfer over.
	for(var p in next.INFO){
		//todo: need an if statement here to check if the field we are mapping is a field... this if statement needs to be dynamically generated by java based on what is in the metadata collection
		var stats = {"key":p,"value":next.INFO[p],"count":1 }
		emit("INFO_" + p, [stats]);  //I think the keys need to be based on how one wants the values to be summed by the reducers...
	}
	return next;
}

//MongoDB will not call the reduce function for a key that has only a single value. The values argument is an array whose elements are the value objects that are “mapped” to the key.
//MongoDB can invoke the reduce function more than once for the same key. In this case, the previous output from the reduce function for that key will become one of the input values to the next reduce function invocation for that key.
// http://docs.mongodb.org/manual/reference/command/mapReduce/#mapreduce-map-cmd
function reduce(key,value){
	//note that value is an array!
	for ( var i=0; i<value.length; i++  ){
		var next = value[i];
		console.log("key: " + next.key + " value: " + next.value + " count: " + next.count);		
	}
	//reducedVal = {key : "", count : 0};
}


//we need a finalize function to reformat the reduce output into mongodb documents the API understands!

var fs = require('fs'),
	    readline = require('readline');

var rd = readline.createInterface({
	    input: fs.createReadStream('./variants.json'),
	    output: process.stdout,
	    terminal: false
});


//stitch together the Map-Reduce steps.
rd.on('line', function(line) {
	    var noid = line.replace(/"_id".*\),/g,"");
	    console.log(noid);
		map(JSON.parse(noid));
		//for now leave out the complexity of calling reduce multiple times
		for(var count in globalEmit){
			var next = globalEmit[count]
	    	//console.log(next);
			reduce(next.key, next.value.valueOf());
		}
});

console.log('Script Complete!');
