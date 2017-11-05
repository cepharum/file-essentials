# file-essentials

a fast set of commonly used functions for processing files

## License

MIT

## Installation

```
npm i -S file-essentials
``` 

## API

### FileEssentials.find( baseFolder, [ options ] ) : Promise<string[]>

Finds all elements in a folder. Supported options are

* **depthFirst**: Set true for resulting list ordered with deeper elements preceding more shallow elements. This is useful e.g. on removing elements.
* **qualified**: Set true to get absolute path names of all matching elements. Otherwise the resulting list contains path names related to given base folder.
* **filter**: Provide a function invoked on every element for deciding whether to include in resulting list or not. The function is invoked with

   * any basically found element's path name relative to base folder,
   * its absolute path name and
   * the `Stats` instance retrieved on calling `fs.stat()` on element.

  The function is expected to return boolean with true deciding to include the element with resulting list and false to ignore it. It also may promise that result value. 

### FileEssentials.mkdir( baseFolder, subFolder ) : Promise<string>

Ensures some given folder exists by successively creating all segments of a given path name in context of provided base folder. Second argument is either string providing path name relative to base folder to create. It may be array explicitly listing segments of that local path name, too.

The method promises resulting absolute path name of eventually created.

### FileEssentials.mkfile( baseFolder, subFolder ) : Promise<string>

tbd.

### FileEssentials.rmdir( baseFolder ) : Promise<string[]>

tbd.
