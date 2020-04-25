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
const { stat, readdir } = require( "fs" );
const { PassThrough } = require( "stream" );


/**
 * Implements pass-through stream exposing opportunities to track if stream is
 * paused due to reaching high water mark or not.
 */
class Stream extends PassThrough {
	/**
	 * @param {object} options options passed to underlying PassThrough stream
	 */
	constructor( options = {} ) {
		options.objectMode = true;

		super( options );

		/**
		 * Marks if stream has a full buffer.
		 *
		 * @property {boolean}
		 * @name Stream#isFull
		 */
		this.isFull = false;
	}

	/** @inheritDoc */
	write( data ) {
		const written = super.write( data );
		if ( !this.isFull && !written ) {
			this.isFull = true;
			this.emit( "full" );
		}

		return written;
	}
}


/**
 * @typedef {object} IterationContext
 * @property function() cancel enables callback to request cancellation of iteration
 */

/**
 * Finds elements of file system matching several criteria.
 *
 * @param {string} pathName path name of base folder to start finding at
 * @param {function(this:IterationContext, localPath:string, fullPath:string, stat:Stats, depth:int):boolean} filter
 *        gets invoked per found element for deciding whether to include or not
 * @param {function(this:IterationContext, localPath:string, fullPath:string, stat:Stats, depth:int):*} converter
 *        maps information to eventually collected information
 * @param {boolean} depthFirst set true to get list ordered deeper elements first
 * @param {int} minDepth minimum depth of elements to return
 * @param {int} maxDepth maximum depth of elements to return
 * @param {boolean} qualified set true to get list of absolute path names
 * @param {boolean} skipFilteredFolder set false to descend into directories that have been filtered
 * @param {boolean} stream set true to get stream of found files and folders instead promise
 * @param {boolean} filterSelf set true to force invocation of filter callback on provided base folder, too
 * @param {boolean} waitForConverter set true to enable support for promise returned from converter delaying iteration
 * @returns {Promise<string[]>|Readable} promises path names of matching files and folders or provides them in a stream
 */
module.exports = function find( pathName = ".", {
	filter = null,
	depthFirst = false,
	qualified = false,
	minDepth = 0,
	maxDepth = Number( Infinity ),
	converter = null,
	skipFilteredFolder = true,
	stream = false,
	filterSelf = false,
	waitForConverter = false,
} = {} ) {

	if ( typeof filter !== "function" ) {
		filter = null; // eslint-disable-line no-param-reassign
	}

	if ( typeof converter !== "function" ) {
		converter = null; // eslint-disable-line no-param-reassign
	}

	const _pathName = Path.resolve( pathName );

	minDepth = parseInt( minDepth ) || 0; // eslint-disable-line no-param-reassign
	maxDepth = parseInt( maxDepth ) || Number( Infinity ); // eslint-disable-line no-param-reassign

	if ( maxDepth < 1 ) {
		return Promise.resolve( [] );
	}

	const sep = Path.sep;

	const result = stream ? new Stream() : [];

	const promise = new Promise( ( resolve, reject ) => {
		let cancelled = false;

		if ( stream ) {
			result.on( "cancel", onError => {
				result.pause();

				if ( onError ) {
					reject( onError instanceof Error ? onError : new Error( "stream cancelled by receiver" ) );
				} else {
					resolve();
				}
			} );
		}

		collect( _pathName, "", result, 0, resolve, true );

		/**
		 * Recursively collects elements in given folder into list.
		 *
		 * @param {string} baseFolder path name of folder to start at
		 * @param {string} subFolder relative path name of element to collect
		 * @param {string[]|Stream} foundNames collects resulting path names
		 * @param {int} level current depth on enumerating sub-folders
		 * @param {function(string[])} done callback invoked with resulting list when done
		 * @param {boolean} isRoot true on initial invocation to mark processing selected root folder
		 * @returns {void}
		 */
		function collect( baseFolder, subFolder, foundNames, level, done, isRoot = false ) {
			const folder = baseFolder + ( subFolder.length ? sep + subFolder : "" );

			stat( folder, ( error, stats ) => {
				if ( error ) {
					if ( error.code === "ENOENT" ) {
						done( foundNames );
						return;
					}

					reject( error );
					return;
				}


				const isDeepEnough = level >= minDepth;
				const isDirectory = stats.isDirectory();

				const context = Object.create( { cancel: cancelIteration } );

				let include = isDeepEnough;

				if ( include && filter && ( filterSelf || !isRoot ) ) {
					try {
						include = filter.call( context, subFolder.length > 0 ? subFolder : ".", folder, stats, level );
					} catch ( e ) {
						reject( e );
						return;
					}

					if ( include instanceof Promise ) {
						include.then( handleInclusion ).catch( reject );
						return;
					}
				}

				handleInclusion( include );


				/**
				 * Handles result of detecting whether current file or folder
				 * shall be part of resulting list or not.
				 *
				 * @param {boolean} toBeCollected true if file/folder is part of result
				 * @returns {void}
				 */
				function handleInclusion( toBeCollected ) {
					if ( isDirectory ) {
						if ( cancelled || ( !toBeCollected && isDeepEnough && skipFilteredFolder ) ) {
							done( foundNames );
						} else {
							processFolder( toBeCollected );
						}
					} else {
						if ( toBeCollected ) {
							const localName = subFolder.length > 0 ? subFolder : ".";
							let converted;

							try {
								converted = converter ? converter.call( context, localName, folder, stats, level ) : qualified ? folder : localName;
							} catch ( e ) {
								reject( e );
								return;
							}

							if ( converted != null && converted !== "" ) {
								if ( converted instanceof Promise && waitForConverter ) {
									converted.then( data => {
										if ( data != null && data !== "" ) {
											if ( stream ) {
												if ( !foundNames.write( data ) ) {
													foundNames.once( "drain", () => done( foundNames ) );
													return;
												}
											} else {
												foundNames.push( data );
											}
										}

										done( foundNames );
									} )
										.catch( reject );

									return;
								}

								if ( stream ) {
									if ( !foundNames.write( converted ) ) {
										foundNames.once( "drain", () => done( foundNames ) );
										return;
									}
								} else {
									foundNames.push( converted );
								}
							}
						}

						done( foundNames );
					}
				}

				/**
				 * Fetches entries of sub-folder for recursive iterating.
				 *
				 * @param {boolean} folderIncluded true if current folder shall be part of resulting list
				 * @returns {void}
				 */
				function processFolder( folderIncluded ) {
					if ( level === maxDepth ) {
						// met requested maximum depth -> process containg folder, only
						checkSub( [""], 0, 1 );
					} else {
						readdir( folder, ( readError, entries ) => {
							if ( readError ) {
								reject( readError );
								return;
							}

							if ( depthFirst ) {
								entries.push( "" );
							} else {
								entries.unshift( "" );
							}

							checkSub( entries, 0, entries.length );
						} );
					}


					/**
					 * Checks another sub-ordinated item.
					 *
					 * @param {string[]} list list all entry in current subFolder to test
					 * @param {int} next index of next item in list to check
					 * @param {int} stopAt index to stop at
					 * @returns {void}
					 */
					function checkSub( list, next, stopAt ) {
						if ( cancelled ) {
							done( foundNames );
							return;
						}

						let _next = next;

						while ( _next < stopAt ) {
							const entry = list[_next++];
							switch ( entry ) {
								case "." :
								case ".." :
									break;

								case "" :
									if ( folderIncluded ) {
										const localName = subFolder.length > 0 ? subFolder : ".";
										let converted;

										try {
											converted = converter ? converter.call( context, localName, folder, stats, level ) : qualified ? folder : localName;
										} catch ( e ) {
											reject( e );
											return;
										}

										if ( converted != null && converted !== "" ) {
											if ( converted instanceof Promise && waitForConverter ) {
												converted.then( data => {
													if ( data != null && data !== "" ) {
														if ( stream ) {
															if ( !foundNames.write( data ) ) {
																foundNames.once( "drain", () => {
																	checkSub( list, _next, stopAt );
																} );

																return;
															}
														} else {
															foundNames.push( data );
														}
													}

													process.nextTick( checkSub, list, _next, stopAt );
												} )
													.catch( reject );

												return;
											}

											if ( stream ) {
												if ( !foundNames.write( converted ) ) {
													foundNames.once( "drain", () => {
														checkSub( list, _next, stopAt );
													} );

													return;
												}
											} else {
												foundNames.push( converted );
											}
										}
									}
									break;

								default :
									if ( cancelled ) {
										break;
									}

									process.nextTick( collect, baseFolder, ( subFolder.length ? subFolder + sep : "" ) + entry, foundNames, level + 1, () => {
										checkSub( list, _next, stopAt );
									} );
									return;
							}
						}

						// regularly met end of list
						done( foundNames );
					}
				}
			} );
		}

		/**
		 * Sets mark requesting cancellation of iteration.
		 *
		 * @returns {void}
		 */
		function cancelIteration() {
			cancelled = true;
		}
	} );

	if ( stream ) {
		promise
			.catch( error => {
				result.emit( "error", error );
			} )
			.then( () => {
				result.end();
			} )
			.catch( error => {
				console.error( "ending stream failed unexpectedly:", error ); // eslint-disable-line no-console
			} );

		return result;
	}

	return promise;
};
