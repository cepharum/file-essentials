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

const Path = require( "path" );
const File = require( "fs" );


/**
 * Finds elements in a given filter matching some optionally provided filter
 * function.
 *
 * @param {string} pathName path name of base folder to start finding at
 * @param {function(localPath:string, fullPath:string, stat:Stats, depth:int):boolean} filter gets invoked per found element for deciding whether to include or not
 * @param {boolean} depthFirst set true to get list ordered deeper elements first
 * @param {int} minDepth minimum depth of elements to return
 * @param {int} maxDepth maximum depth of elements to return
 * @param {boolean} qualified set true to get list of absolute path names
 * @returns {Promise<string[]>} promises list of path names of all elements in folder optionally matching given filter
 */
module.exports = function find( pathName, { filter = null, depthFirst = false, qualified = false, minDepth = 0, maxDepth = Infinity } = {} ) {
	if ( typeof filter !== "function" ) {
		filter = null;
	}

	pathName = Path.resolve( pathName );
	const sep = Path.sep;

	return new Promise( ( resolve, reject ) => {
		collect( pathName, "", [], 0, resolve );

		/**
		 * Recursively collects elements in given folder into list.
		 *
		 * @param {string} baseFolder path name of folder to start at
		 * @param {string} subFolder relative path name of element to collect
		 * @param {string[]} result collects resulting path names
		 * @param {int} level current depth on enumerating sub-folders
		 * @param {function(string[])} done callback invoked with resulting list when done
		 */
		function collect( baseFolder, subFolder, result, level, done ) {
			const folder = baseFolder + sep + subFolder;

			File.stat( folder, ( error, stat ) => {
				if ( error ) {
					return reject( error );
				}

				if ( !stat.isDirectory() ) {
					let include = ( level >= minDepth && level <= maxDepth );

					if ( include && filter ) {
						include = filter( subFolder, folder, stat, level );
						if ( include instanceof Promise ) {
							return include.then( state => {
								if ( state ) {
									result.push( qualified ? folder : subFolder );
								}

								done( result );
							}, reject );
						}
					}

					if ( include ) {
						result.push( qualified ? folder : subFolder );
					}

					return done( result );
				}


				File.readdir( folder, ( error, entries ) => {
					if ( error ) {
						return reject( error );
					}

					if ( depthFirst ) {
						entries.push( "" );
					} else {
						entries.unshift( "" );
					}

					checkSub( entries, 0, entries.length );

					/**
					 * Checks another sub-ordinated item.
					 *
					 * @param {string[]} list list all entry in current subFolder to test
					 * @param {int} next index of next item in list to check
					 * @param {int} stopAt index to stop at
					 * @returns {*}
					 */
					function checkSub( list, next, stopAt ) {
						while ( next < stopAt ) {
							const entry = list[next++];
							switch ( entry ) {
								case "." :
								case ".." :
									break;

								case "" :
									let include = ( level >= minDepth && level <= maxDepth );

									if ( include && filter ) {
										include = filter( subFolder, folder, stat, level );
										if ( include instanceof Promise ) {
											return include.then( state => {
												if ( state ) {
													result.push( qualified ? folder : subFolder );
												}

												checkSub( list, next, stopAt );
											}, reject );
										}
									}

									if ( include ) {
										result.push( qualified ? folder : subFolder );
									}
									break;

								default :
									if ( level >= maxDepth ) {
										return process.nextTick( checkSub, list, next, stopAt );
									}

									return process.nextTick( collect, baseFolder, ( subFolder.length ? subFolder + sep : "" ) + entry, result, level + 1, () => {
										checkSub( list, next, stopAt );
									} );
							}
						}

						if ( next >= stopAt ) {
							// regularly met end of list
							done( result );
						}
					}
				} );
			} );
		}
	} );
};
