# file-essentials

a fast set of commonly used functions for processing files

* Latest Release: [![Build Status](https://travis-ci.org/cepharum/file-essentials.svg?branch=master)](https://travis-ci.org/cepharum/file-essentials)
* Current Development: [![Build Status](https://travis-ci.org/cepharum/file-essentials.svg?branch=develop)](https://travis-ci.org/cepharum/file-essentials)

## License

MIT

## Installation

```
npm i -S file-essentials
``` 

## API

### FileEssentials.stat( pathName ) : Promise\<Stats>

Inspects given file system element promising information on it. This method is a simple promisified version of `require( "fs" ).stat()`.

> In opposition to the genuine function `require( "fs" ).stat()` this method is resolving without object (value `null`) on inspecting a missing file instead of rejecting on error.

This method is also exposed as `Stat`.

> Every method is available via alias exposed for conveniently accessing it w/o clashing with local variables named equivalently, e.g.
>
> ```javascript
> const { Stat } = require( "file-essentials" );
> 
> Stat( "some/folder" )
>     .then( stat => stat.isDirectory() && Stat( "some/folder/file" ) )
>     .then( stat => { } );
> ```

### FileEssentials.list( [ pathName ] ) : Promise\<string[]>

Enumerates names of elements in current or explicitly selected folder. This method is a simple promisified version of `require( "fs" ).readdir()`.

> In opposition to the original function this method never retrieves `.` and `..`.

The method supports options for customizing enumeration:

* **noHidden** may be set true to exclude elements with leading period in name for being considered hidden.

This method is also exposed as `List`.

### FileEssentials.read( pathName ) : Promise\<Buffer>

Reads content from file and returns promise delivering content. This method is a simple promisified version of `require( "fs" ).readFile()`.

This method is also exposed as `Read`.

### FileEssentials.write( pathName, content ) : Promise\<(string|Buffer)>

Writes content to file promising content written to file. The content is promised as given. This method is a simple promisified version of `require( "fs" ).writeFile()`.

This method is also exposed as `Write`.

### FileEssentials.find( baseFolder, [ options ] ) : Promise\<string[]>

Finds all elements in a folder. Supported options are

* **depthFirst**: Set true for resulting list ordered with deeper elements preceding more shallow elements. This is useful e.g. on removing elements.

* **qualified**: Set true to get absolute path names of all matching elements. Otherwise the resulting list contains path names related to given base folder.

* **filter**: Provide a function invoked on every element for deciding whether to include in resulting list or not. The function is invoked with

   * any basically found element's path name relative to base folder,
   
   * its absolute path name,
   
   * the `Stats` instance retrieved on calling `fs.stat()` on element and
   
   * the depth of current element (0 is selected folder, 1 is all its children, etc.)

  The function is expected to return boolean with `true` or `false`. It also may promise that result value. By returning or promising `true` the tested file or folder is considered match and gets collected in resulting list. By returning or promising `false` the tested file or folder is not collected. In addition, **find()**'s iteration isn't descending into any tested folder **filter** is returning `false` on and unless **skipFilteredFolder** is set `false` explicitly.
  
  > **Important:** The callback provided in **filter** is not invoked on base folder unless setting option **filterSelf**, too. See there for further information.
  
  > **Important:** The **filter** callback is invoked on folders prior to descending into them for enumerating contained elements. Thus, invocation per element may happen in different order than **converter** callback with the latter properly obeying option **depthFirst**, only.
  
* **converter** may be callback function invoked with equivalent signature as described on **filter** before. The callback is mapping all found elements to some data eventually collected and included with promised result list. The return value is collected in resulting list instead of element's relative or absolute path name. By returning `null`, `undefined` or empty string here, no data is collected in result list on related file or folder.

  Returning promise is okay, but in opposition to **filter** this doesn't defer processing of further elements implicitly unless option **waitForConverter** is set.
  
  Also in opposition to **filter** any callback provided here is always invoked on base folder provided in first argument of `find()`, too.
  
  > By combining **filter** and **converter** it is possible to control what folders to descend into with **filter** and select files or folders to be part of resulting list with **converter**.

* **minDepth**: Sets minimum depth level to be matched by any element included with returned list. Default is 0.

* **maxDepth**: Sets maximum depth level to be matched by any element included with returned list. Default is `+Infinity`.

* **skipFilteredFolders**: This option is set by default to prevent **FileEssentials.find()** from descending into subfolders dropped by **filter** described before. It may be cleared explicitly to force descending into such subfolders even though excluding the subfolder from result itself.

* **stream**: By setting this option `find()` isn't returning promise but readable stream providing path name of every matching file or folder one by one. The stream may be paused resulting in paused iteration.

* **filterSelf**: By default **filter** callback isn't invoked on selected base folder itself for performance reasons. `find()` assumes caller's implicit interest in descending into selected base folder by using `find()` in the first place. Setting this option `true` this assumption is disabled and **filter** callback is invoked on base folder, too.

* **waitForConverter**: By default promises returned by **converter** callback are collected in output w/o delaying further iteration. Set this option to switch this behaviour and wait for any promise returned by **converter** callback eventually collecting the promised value instead.

#### Passing Data From Callback to Callback
 
> Any callback provided as **filter** or **converter** is invoked with some context object exposed as `this`, which
>
>  * is different for every tested file or folder
>
>  * is the same on calling **filter** and **converter** on same file or folder
>
>  * provides method `cancel()` to be called if either callback requests to cancel whole iteration of file system.
 
This method is also exposed as `Find`.

### FileEssentials.mkdir( baseFolder, subFolder ) : Promise\<string>

Ensures some given folder exists by successively creating all segments of a given path name in context of provided base folder. Second argument is either string providing path name relative to base folder to create. It may be array explicitly listing segments of that local path name, too.

The method promises resulting absolute path name of eventually created.

This method is also exposed as `MkDir`.

### FileEssentials.mkfile( baseFolder, [ options ] ) : Promise\<string>

Creates uniquely named file in a given folder. This method is generating random UUIDv4 to be used for naming file to be created. Supported options are:

* **suffix** is an additional string that is appended to the file's name. On using **uuidToPath** below, the suffix is appended after mapping UUIDv4 to file name there.
* **maxAttempts** is an integer selecting number of retries on finding a unique name. The default ist 30.
* **uuidToPath** is a callback function invoked to convert a given UUIDv4 into the file name to use. This function may return path name relative to given base folder. Make sure to use proper separator e.g. by working with `require( "path " ).join()`, only. Returning promise is supported, here.

This method promises object containing these properties on exclusive creation of new file:

* **name** is the absolute path name of created file.
* **uuid** is the unmapped UUIDv4 used.
* **fd** is the handle to open file for writing data.

This method is also exposed as `MkFile`.

### FileEssentials.rmdir( baseFolder ) : Promise\<string[]>

Removes a given element. If the element is a folder all subordinated files and folders are removed, too. The method promises list of all removed elements on success.

This method is also exposed as `RmDir`.
