# file-essentials

a fast set of commonly used functions for processing files

* Latest Release: [![Build Status](https://travis-ci.org/cepharum/file-essentials.svg?branch=master)](https://travis-ci.org/cepharum/file-essentials)

## License

MIT

## Installation

```
npm i -S file-essentials
``` 

## API

### FileEssentials.stat( pathName ) : Promise\<Stats>

Inspects given file system element promising information on it. This method is a simple promisified version of `require( "fs" ).stat()`.

### FileEssentials.read( pathName ) : Promise\<Buffer>

Reads content from file and returns promise delivering content. This method is a simple promisified version of `require( "fs" ).readFile()`.

### FileEssentials.write( pathName, content ) : Promise\<(string|Buffer)>

Writes content to file promising content written to file. The content is promised as given. This method is a simple promisified version of `require( "fs" ).writeFile()`.

### FileEssentials.find( baseFolder, [ options ] ) : Promise\<string[]>

Finds all elements in a folder. Supported options are

* **depthFirst**: Set true for resulting list ordered with deeper elements preceding more shallow elements. This is useful e.g. on removing elements.
* **qualified**: Set true to get absolute path names of all matching elements. Otherwise the resulting list contains path names related to given base folder.
* **filter**: Provide a function invoked on every element for deciding whether to include in resulting list or not. The function is invoked with

   * any basically found element's path name relative to base folder,
   * its absolute path name,
   * the `Stats` instance retrieved on calling `fs.stat()` on element and
   * the depth of current element (0 is selected folder, 1 is all its children, etc.)

  The function is expected to return boolean with true deciding to include the element with resulting list and false to ignore it. It also may promise that result value. 
* **converter** may be callback function invoked with equivalent signature as described on **filter** before. The callback is mapping all found elements to some data eventually collected and included with promised result list. Any return value is collected in resulting list instead of either element's relative or absolute path name. Returning promise is okay, but doesn't defer processing further elements implicitly.
* **minDepth**: Sets minimum depth level to be matched by any element included with returned list. Default is 0.
* **maxDepth**: Sets maximum depth level to be matched by any element included with returned list. Default is `+Infinity`.

### FileEssentials.mkdir( baseFolder, subFolder ) : Promise\<string>

Ensures some given folder exists by successively creating all segments of a given path name in context of provided base folder. Second argument is either string providing path name relative to base folder to create. It may be array explicitly listing segments of that local path name, too.

The method promises resulting absolute path name of eventually created.

### FileEssentials.mkfile( baseFolder, [ options ] ) : Promise\<string>

Creates uniquely named file in a given folder. This method is generating random UUIDv4 to be used for naming file to be created. Supported options are:

* **suffix** is an additional string that is appended to the file's name. On using **uuidToPath** below, the suffix is appended after mapping UUIDv4 to file name there.
* **maxAttempts** is an integer selecting number of retries on finding a unique name. The default ist 30.
* **uuidToPath** is a callback function invoked to convert a given UUIDv4 into the file name to use. This function may return path name relative to given base folder. Make sure to use proper separator e.g. by working with `require( "path " ).join()`, only. Returning promise is supported, here.

This method promises object containing these properties on exclusive creation of new file:

* **name** is the absolute path name of created file.
* **uuid** is the unmapped UUIDv4 used.
* **fd** is the handle to open file for writing data.

### FileEssentials.rmdir( baseFolder ) : Promise\<string[]>

Removes a given element. If the element is a folder all subordinated files and folders are removed, too. The method promises list of all removed elements on success.
