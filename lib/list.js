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

const { readdir } = require( "fs" );


/**
 * Lists elements directly subordinated to a given folder.
 *
 * @alias list
 * @param {string} pathName path name of folder to be enumerated
 * @returns {Promise<string[]>} promises names of elements in folder
 */
module.exports = function listFile( pathName = "." ) {
	return new Promise( ( resolve, reject ) => {
		readdir( pathName, ( error, entries ) => {
			if ( error ) {
				reject( error );
			} else {
				const length = entries.length;
				const filtered = new Array( length );
				let write = 0;

				for ( let read = 0; read < length; read++ ) {
					const entry = entries[read];
					switch ( entry ) {
						case "." :
						case ".." :
							break;

						default :
							filtered[write++] = entry;
					}
				}

				filtered.splice( write, length - write );

				resolve( filtered );
			}
		} );
	} );
};
