// define all variables needed

// folder for imageset
const testFolder = './imageset/';

// def
const fs = require('fs');
var convert = require('xml-js');
var argv = require('minimist')(process.argv.slice(2));

// check if set is done, not optional
if (!argv.set) {
	console.log("you have to define --set, eg --set myfirstset")
	return;
}


// define the csv writers for test and normal records
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
    path: 'readyset/'+argv.set+'/'+argv.set+'.csv',
    header: [
        {id: 'filename', title: 'filename'},
        {id: 'width', title: 'width'},
        {id: 'height', title: 'height'},
        {id: 'class', title: 'class'},
        {id: 'xmin', title: 'xmin'},
        {id: 'ymin', title: 'ymin'},
        {id: 'xmax', title: 'xmax'},
        {id: 'ymax', title: 'ymax'}
    ]
});
const csvWriterTest = createCsvWriter({
    path: 'readyset/'+argv.set+'/'+argv.set+'-test.csv',
    header: [
        {id: 'filename', title: 'filename'},
        {id: 'width', title: 'width'},
        {id: 'height', title: 'height'},
        {id: 'class', title: 'class'},
        {id: 'xmin', title: 'xmin'},
        {id: 'ymin', title: 'ymin'},
        {id: 'xmax', title: 'xmax'},
        {id: 'ymax', title: 'ymax'}
    ]
});

// import for reading input while executing
const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

// classes for labels, records for csv turn to record
var classes = []
const records = [
];
const recordsTest = [
];
var index = 0;

// check if readyset is popuplated with subfolder
ensureDirectoryExistence('readyset/'+argv.set)




 // csv splitting from ready xml 
fs.readdir(testFolder, (err, folder) => {
	// only look for folders
	folder = folder.filter(e => e.indexOf('.')==-1);
	if (folder.indexOf('.')==-1)
		folder.forEach(fileFolder => {
			// run through each image and before check if templatesystem is activated
			fs.readdir(testFolder+ fileFolder , (err,files) => {
				var checkIfBatchForSameSizeWithoutXMLinTop = files.indexOf('template.xml');
				if (checkIfBatchForSameSizeWithoutXMLinTop>-1) {
					var indexJsonForThisRun = 1;
				} 
				files.forEach(file => {
					if (indexJsonForThisRun != undefined ) {
						filenameXML=fileFolder+'/template.xml'
					} else 
					var filenameXML = file.slice(0,file.indexOf('.')) + '.xml'
					// read the xml for the image
					if (file!='template.xml') 
						fs.readFile('./imageset/'+filenameXML, (err,data)=>{
							// convert xml to csv 
							index++;
							var className = fileFolder.replace(/[0-9]/g, '');
							var options = {compact: true, ignoreComment: true, alwaysChildren: true, spaces: 4};
							var json = convert.xml2json(data, options); // or convert.xml2json(xml, options)
							var tmpJson = json;
							// console.log(json)
							var tmpJsonToEdit = JSON.stringify(tmpJson)
							var json = JSON.parse(json)
							var item = json.annotation;
							if (Array.isArray(item.object)) {
								console.log(file, item.object.length)
								for (var i = 0; i < item.object.length;i++ ) {
									var obj = {
										filename: file,
										width: item.size.width._text,
										height: item.size.height._text,
										class: item.object[i].name._text,
										xmin: item.object[i].bndbox.xmin._text,
										ymin: item.object[i].bndbox.ymin._text,
										xmax: item.object[i].bndbox.xmax._text,
										ymax: item.object[i].bndbox.ymax._text
									}
									if (classes.indexOf(item.object[i].name._text)==-1) {
										classes.push(item.object[i].name._text)
										console.log("push class", item.object[i].name._text, file)
									}
									if (index%10==0) {
										recordsTest.push(obj)

									} else {
										records.push(obj)
										
									}
								}
							} else {
								var obj = {
									filename: file,
									width: item.size.width._text,
									height: item.size.height._text,
									class: item.object.name._text,
									xmin: item.object.bndbox.xmin._text,
									ymin: item.object.bndbox.ymin._text,
									xmax: item.object.bndbox.xmax._text,
									ymax: item.object.bndbox.ymax._text
								}
								if (classes.indexOf(item.object.name._text)==-1) {
									classes.push(item.object.name._text)
									console.log("push class", item.object.name._text, file)
								}

								if (index%10==0) {
									recordsTest.push(obj)

								} else {
									records.push(obj)
									
								}
								
							}

							// copy image to readyset, not necessary but id like to keep it together for archiving
							if (index%10==0) {
								var inStr2 = fs.createReadStream('imageset/'+fileFolder+'/'+file);
								var outStr2 = fs.createWriteStream('readyset/'+argv.set+'/test/Images/'+file);
								inStr2.pipe(outStr2);
							} else {	
								var inStr = fs.createReadStream('imageset/'+fileFolder+'/'+file);
								var outStr = fs.createWriteStream('readyset/'+argv.set+'/Images/'+file);
								inStr.pipe(outStr);
							}
						})
				})
			})
		});

})

// now read for keypress s to initialize save, better way would be to wait for finish but i didnt wanted to rewrite the code because it worked
const { exec } = require('child_process');
process.stdin.on('keypress', (str, key) => {
  if (key.ctrl && key.name === 'c') {
    process.exit();
  } else {
  	if (key.name==='s') {
  		console.log(records[0])
	csvWriter.writeRecords(records)       // returns a promise
	    .then(() => {
	        console.log('...Done');
	    });
	csvWriterTest.writeRecords(recordsTest)       // returns a promise
	    .then(() => {
	        console.log('...Done');
	    });
	    writeClasses(classes);
  		console.log("save")
  		exec('python readyset/generate.py '+ argv.set,  (err, stdout, stderr) => {
		  // the *entire* stdout and stderr (buffered)
		  console.log("if stderr is empty all good > normal record is done")
		  console.log(`stderr: ${stderr}`);
		  console.log(`stdout: ${stdout}`);
		})
  		exec('python readyset/generate-test.py '+ argv.set,  (err, stdout, stderr) => {

		  // the *entire* stdout and stderr (buffered)
		  console.log("if stderr is empty all good > test is done")
		  console.log(`stderr: ${stderr}`);
		})
  	}
    console.log(`You pressed the "${str}" key`);
  }
});
	

// helper for checking directory
function ensureDirectoryExistence(filePath) {
var path = require('path');
	console.log(filePath)
	dir = __dirname+'/'+filePath;
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
    fs.mkdir('readyset/'+argv.set+'/test')
    fs.mkdir('readyset/'+argv.set+'/test/Images')
    fs.mkdir('readyset/'+argv.set+'/Images')
  }
}

//  helper write classes to label pbtxt
function writeClasses(array) {
	console.log(array)
	var str = '';
	var emptyArray = {
		array:[]
	}
	var x = 1;
	for (var i=0;i<array.length;i++) {
		emptyArray.array.push({
			name: array[i],
			id: x
		})
		str = str + `
item {
	name: "`+array[i]+`"
	\
id: `+x+`
}
\
`;
	x++;
	}
	fs.writeFile('readyset/'+argv.set+'/labels-'+argv.set+'.pbtxt', str, function(err) {
		if (err) console.log('error writeClasses')
	});
	fs.writeFile('readyset/'+argv.set+'/labels-'+argv.set+'.json', JSON.stringify(emptyArray, "   ", 2), function(err) {
		if (err) console.log('error writeClasses')
	});
}