/**
 * (c) 2017 cepharum GmbH, Berlin, http://cepharum.de
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 cepharum GmbH
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @author: cepharum
 */

"use strict";

const File = require( "fs" );

const Find = require( "./find" );


/**
 * Recursively removes a folder all contained elements.
 *
 * @note This method detects if pathname is not selecting directory but some
 *       file and removes it nonetheless.
 *
 * @name rmdir
 * @param {string} pathName path name of element to remove
 * @param {boolean} subsOnly set true to remove all elements in folder but keep selected folder itself
 * @returns {Promise} promises path successful removal of file or folder
 */
module.exports = function rmdir( pathName, { subsOnly = false } = {} ) {
	return Find( pathName, {
		depthFirst: true,
		qualified: true,
		minDepth: subsOnly ? 1 : 0,
	} )
		.then( entries => new Promise( ( resolve, reject ) => {
			_removeElements( entries, 0, entries.length, resolve, reject );
		} ) );
};

/**
 * Checks element and triggers its removal accordingly.
 *
 * @param {string[]} pathNames list of path names of elements to remove
 * @param {int} index index of next item in list to remove
 * @param {int} stopAt index to stop at
 * @param {function(pathnames:string[])} resolve callback to invoke when finished creating all folders in desired pathname
 * @param {function(error:Error)} reject callback to invoke on encountering error
 * @private
 */
function _removeElements( pathNames, index, stopAt, resolve, reject ) {
	if ( index >= stopAt ) {
		resolve( pathNames );
	} else {
		File.unlink( pathNames[index], error => {
			if ( error ) {
				return reject( error );
			}

			process.nextTick( _removeElements, pathNames, index + 1, stopAt, resolve, reject );
		} );
	}
}
