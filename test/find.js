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
const { Readable } = require( "stream" );

const { suite, test } = require( "mocha" );
const Should = require( "should" );

const { find } = require( "../" );


suite( "require( 'file-essentials' ).find", function() {
	this.timeout( 10000 );

	suiteSetup( function() {
		process.chdir( __dirname );
	} );

	test( "is a function", function() {
		Should( find ).be.a.Function().which.has.length( 0 );
	} );

	test( "does not throw on invocation", function() {
		let promise;

		( () => ( promise = find() ) ).should.not.throw();

		return promise;
	} );

	suite( "returns promise by default which", function() {
		test( "is resolved on having enumerated all elements of given folder", function() {
			return find( ".." ).should.be.Promise().which.is.resolved()
				.then( list => {
					list.should.be.Array().which.is.not.empty();
				} );
		} );

		test( "is resolved with path names of all found elements", function() {
			return find( ".." )
				.then( list => {
					list = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

					list.should.containEql( "lib/find.js" );
					list.should.containEql( "test/.setup.js" );
					list.should.containEql( "index.js" );
					list.should.containEql( "node_modules/eslint-config-cepharum/index.js" );
				} );
		} );

		test( "is resolved with path names of all found elements in depth-last order by default", function() {
			return find( ".." )
				.then( list => {
					list = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

					const a = list.indexOf( "lib" );
					const b = list.indexOf( "lib/find.js" );

					( a < b ).should.be.true();
				} );
		} );

		test( "is resolved with path names of all found elements in depth-first order on demand", function() {
			return find( "..", { depthFirst: true } )
				.then( list => {
					list.should.be.Array().which.is.not.empty();

					list = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

					const a = list.indexOf( "lib" );
					const b = list.indexOf( "lib/find.js" );

					( a < b ).should.be.false();
				} );
		} );

		test( "is resolved with absolute path names of all found elements on demand", function() {
			return find( "..", { qualified: true } )
				.then( list => {
					list.should.be.Array().which.is.not.empty();

					list = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

					list.should.not.containEql( "lib/find.js" );
					list.should.containEql( Path.resolve( "..", "lib/find.js" ).replace( /\\/g, Path.posix.sep ) );
				} );
		} );

		test( "is resolved with path names of found elements satisfying custom filter", function() {
			return find( "..", {
				filter: localName => localName.startsWith( "index.js" ),
				skipFilteredFolder: false,
			} )
				.then( list => {
					list.should.be.Array().which.is.not.empty();

					list = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

					list.should.not.containEql( "lib/find.js" );
					list.should.not.containEql( "test/.setup.js" );
					list.should.containEql( "index.js" );
					list.should.not.containEql( "node_modules/eslint-config-cepharum/index.js" );
				} );
		} );

		test( "is rejected cancelling iteration when filter callback is throwing", function() {
			let matchCount = 0;

			return find( "..", {
				filter: () => {
					throw new Error( "!!EXCEPTION!!" );
				},
				converter: name => {
					matchCount++;
					return name;
				},
			} )
				.should.be.rejectedWith( new Error( "!!EXCEPTION!!" ) )
				.then( () => matchCount.should.be.equal( 1 ) ); // due to invoking converter on base folder "..", but not invoking filter on it
		} );

		test( "is rejected cancelling iteration when converter callback is throwing", function() {
			let matchCount = 0;

			return find( "..", {
				filter: () => {
					matchCount++;
					return true;
				},
				converter: () => {
					throw new Error( "!!EXCEPTION!!" );
				},
			} )
				.should.be.rejectedWith( new Error( "!!EXCEPTION!!" ) )
				.then( () => matchCount.should.be.equal( 0 ) ); // due to invoking converter on base folder prior to invoking filter for the first time
		} );
	} );

	suite( "returns readable stream instead of promise on demand which", function() {
		test( "is readable", function() {
			return new Promise( resolve => {
				const stream = find( "..", { stream: true } );

				stream.should.not.be.Promise().and.be.instanceOf( Readable );

				stream.once( "end", resolve );
				stream.resume();
			} );
		} );

		test( "is exposing path names of found elements one by one", function() {
			return new Promise( resolve => {
				const stream = find( "..", { stream: true } );
				const list = [];

				stream.should.not.be.Promise().and.be.instanceOf( Readable );

				stream.once( "end", () => {
					const normalized = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

					normalized.should.containEql( "lib/find.js" );
					normalized.should.containEql( "test/.setup.js" );
					normalized.should.containEql( "index.js" );
					normalized.should.containEql( "node_modules/eslint-config-cepharum/index.js" );

					resolve();
				} );

				stream.on( "data", name => {
					name.should.be.String().which.is.not.empty();
					list.push( name );
				} );
			} );
		} );

		test( "is exposing path names in depth-last order by default", function() {
			return new Promise( resolve => {
				const stream = find( "..", { stream: true } );
				const list = [];

				stream.should.not.be.Promise().and.be.instanceOf( Readable );

				stream.once( "end", () => {
					const normalized = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

					const a = normalized.indexOf( "lib" );
					const b = normalized.indexOf( "lib/find.js" );

					( a < b ).should.be.true();

					resolve();
				} );

				stream.on( "data", name => {
					name.should.be.String().which.is.not.empty();
					list.push( name );
				} );
			} );
		} );

		test( "is exposing path names in depth-first order on demand", function() {
			return new Promise( resolve => {
				const stream = find( "..", { stream: true, depthFirst: true } );
				const list = [];

				stream.should.not.be.Promise().and.be.instanceOf( Readable );

				stream.once( "end", () => {
					const normalized = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

					const a = normalized.indexOf( "lib" );
					const b = normalized.indexOf( "lib/find.js" );

					( a < b ).should.be.false();

					resolve();
				} );

				stream.on( "data", name => {
					name.should.be.String().which.is.not.empty();
					list.push( name );
				} );
			} );
		} );

		test( "is exposing absolute path names of all found elements on demand", function() {
			return new Promise( resolve => {
				const stream = find( "..", { stream: true, qualified: true } );
				const list = [];

				stream.should.not.be.Promise().and.be.instanceOf( Readable );

				stream.once( "end", () => {
					const normalized = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

					normalized.should.not.containEql( "lib/find.js" );
					normalized.should.containEql( Path.resolve( "..", "lib/find.js" ).replace( /\\/g, Path.posix.sep ) );

					resolve();
				} );

				stream.on( "data", name => {
					name.should.be.String().which.is.not.empty();
					list.push( name );
				} );
			} );
		} );

		test( "is exposing path names of found elements satisfying custom filter, only", function() {
			return new Promise( resolve => {
				const stream = find( "..", {
					stream: true,
					filter: localName => localName.startsWith( "index.js" ),
					skipFilteredFolder: false,
				} );
				const list = [];

				stream.should.not.be.Promise().and.be.instanceOf( Readable );

				stream.once( "end", () => {
					const normalized = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

					normalized.should.not.containEql( "lib/find.js" );
					normalized.should.not.containEql( "test/.setup.js" );
					normalized.should.containEql( "index.js" );
					normalized.should.not.containEql( "node_modules/eslint-config-cepharum/index.js" );

					resolve();
				} );

				stream.on( "data", name => {
					name.should.be.String().which.is.not.empty();
					list.push( name );
				} );
			} );
		} );

		test( "can be paused resulting in paused iteration, too", function() {
			return new Promise( resolve => {
				const list = [];
				let pausedBefore = false;

				const stream = find( "..", {
					stream: true,
					filter: name => {
						list.push( { type: "filter", name } );
						return true;
					},
					converter: name => {
						list.push( { type: "converter", name } );
						return name;
					},
				} );

				stream.on( "data", name => {
					list.push( { type: "data", name } );

					if ( !pausedBefore ) {
						pausedBefore = true;

						stream.pause();
						setTimeout( () => {
							list.should.be.Array().which.is.not.empty();
							list[list.length - 1].type.should.be.equal( "full" );

							stream.resume();
						}, 1000 );
					}
				} );

				stream.on( "full", () => {
					list.push( { type: "full" } );
				} );

				stream.once( "end", () => {
					list.should.be.Array().which.is.not.empty();
					list[list.length - 1].type.should.not.be.equal( "full" );

					resolve();
				} );
			} );
		} );

		test( "exposes same set of element in same order no matter stream was paused or not", function() {
			let pausedCounter = 0;

			return Promise.all( [
				new Promise( resolve => {
					const matches = [];
					const stream = find( "..", { stream: true } );

					stream.on( "data", name => {
						matches.push( name );

						if ( matches.length % 50 === 0 ) {
							stream.pause();
							pausedCounter++;
							setTimeout( () => stream.resume(), 10 );
						}
					} );

					stream.once( "end", () => resolve( matches ) );
				} ),
				new Promise( resolve => {
					const matches = [];
					const stream = find( "..", { stream: true } );

					stream.on( "data", name => matches.push( name ) );
					stream.once( "end", () => resolve( matches ) );
				} ),
			] )
				.then( ( [ paused, unpaused ] ) => {
					pausedCounter.should.be.above( 10 );

					paused.should.be.Array();
					unpaused.should.be.Array();

					paused.length.should.be.equal( unpaused.length );

					paused.should.be.eql( unpaused );
				} );
		} );

		test( "instantly ends on cancelling iteration in filter", function() {
			return new Promise( resolve => {
				const matches = [];
				let counter = 0;

				const stream = find( "..", {
					stream: true,
					filter: function() {
						if ( ++counter === 3 ) {
							this.cancel();
						}

						return true;
					},
				} );

				stream.on( "data", name => matches.push( name ) );
				stream.once( "end", () => resolve( matches ) );
			} )
				.then( list => {
					list.should.be.Array().which.has.length( 4 ); // additional record due to filter not invoked on base folder
				} );
		} );

		test( "instantly ends on cancelling iteration in converter", function() {
			return new Promise( resolve => {
				const matches = [];
				let counter = 0;

				const stream = find( "..", {
					stream: true,
					converter: function() {
						if ( ++counter === 3 ) {
							this.cancel();
						}

						return true;
					},
				} );

				stream.on( "data", name => matches.push( name ) );
				stream.once( "end", () => resolve( matches ) );
			} )
				.then( list => {
					list.should.be.Array().which.has.length( 3 ); // due to converter invoked even on base folder
				} );
		} );

		test( "emits error and cancels iteration when filter callback is throwing", function() {
			return new Promise( resolve => {
				let error = null;
				const stream = find( "..", {
					stream: true,
					filter: function() {
						throw new Error( "!!EXCEPTION!!" );
					},
				} );

				let matchCount = 0;

				stream.on( "data", () => matchCount++ );
				stream.on( "error", e => { error = e; } );
				stream.on( "end", () => {
					matchCount.should.be.equal( 1 ); // due to matching base folder w/o invoking filter callback on it

					resolve( error );
				} );
			} )
				.then( error => {
					error.should.be.instanceOf( Error );
				} );
		} );

		test( "emits error and cancels iteration when converter callback is throwing", function() {
			return new Promise( resolve => {
				let error = null;
				const stream = find( "..", {
					stream: true,
					converter: function() {
						throw new Error( "!!EXCEPTION!!" );
					},
				} );

				let matchCount = 0;

				stream.on( "data", () => matchCount++ );
				stream.on( "error", e => { error = e; } );
				stream.on( "end", () => {
					matchCount.should.be.equal( 0 ); // due to invoking converter callback instantly on selected base folder

					resolve( error );
				} );

				stream.resume();
			} )
				.then( error => {
					error.should.be.instanceOf( Error );
				} );
		} );
	} );

	test( "provides local path name to filter callback on finding absolute path names, too", function() {
		return find( "..", {
			filter: localName => localName.startsWith( "index.js" ),
			qualified: true,
			skipFilteredFolder: false,
		} )
			.then( list => {
				list.should.be.Array().which.is.not.empty();

				list = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

				list.should.not.containEql( Path.resolve( "..", "lib/find.js" ).replace( /\\/g, Path.posix.sep ) );
				list.should.not.containEql( Path.resolve( "..", "test/.setup.js" ).replace( /\\/g, Path.posix.sep ) );
				list.should.containEql( Path.resolve( "..", "index.js" ).replace( /\\/g, Path.posix.sep ) );
				list.should.not.containEql( Path.resolve( "..", "node_modules/eslint-config-cepharum/index.js" ).replace( /\\/g, Path.posix.sep ) );
			} );
	} );

	test( "provides absolute path name to filter callback on finding local path names, too", function() {
		return find( "..", {
			filter: ( localName, absoluteName ) => Path.relative( Path.resolve( ".." ), absoluteName ).startsWith( "index.js" ),
			skipFilteredFolder: false,
		} )
			.then( list => {
				list.should.be.Array().which.is.not.empty();

				list = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

				list.should.not.containEql( "lib/find.js" );
				list.should.not.containEql( "test/.setup.js" );
				list.should.containEql( "index.js" );
				list.should.not.containEql( "node_modules/eslint-config-cepharum/index.js" );
			} );
	} );

	test( "does not check filter on provided pathname itself by default", function() {
		let found = 0;

		return find( "..", {
			filter: localName => {
				localName.should.be.String().which.is.not.empty();

				if ( localName === "." ) {
					found++;
				}

				return true;
			},
		} )
			.then( () => {
				found.should.be.equal( 0 );

				found = 0;

				return find( "..", {
					filter: localName => {
						localName.should.be.String().which.is.not.empty();

						if ( localName === "." ) {
							found++;
						}
					},
					skipFilteredFolder: false,
				} );
			} )
			.then( () => {
				found.should.be.equal( 0 );
			} );
	} );

	test( "checks filter on provided pathname itself on demand", function() {
		let found = 0;

		return find( "..", {
			filter: localName => {
				localName.should.be.String().which.is.not.empty();

				if ( localName === "." ) {
					found++;
				}

				return true;
			},
			filterSelf: true,
		} )
			.then( () => {
				found.should.be.equal( 1 );

				found = 0;

				return find( "..", {
					filter: localName => {
						localName.should.be.String().which.is.not.empty();

						if ( localName === "." ) {
							found++;
						}
					},
					skipFilteredFolder: false,
					filterSelf: true,
				} );
			} )
			.then( () => {
				found.should.be.equal( 1 );
			} );
	} );

	test( "ignores request for filtering provided pathname itself due to minimum depth", function() {
		let found = 0;

		return find( "..", {
			filter: localName => {
				localName.should.be.String().which.is.not.empty();

				if ( localName === "." ) {
					found++;
				}

				return true;
			},
			filterSelf: true,
			minDepth: 1,
		} )
			.then( () => {
				found.should.be.equal( 0 );

				found = 0;

				return find( "..", {
					filter: localName => {
						localName.should.be.String().which.is.not.empty();

						if ( localName === "." ) {
							found++;
						}
					},
					skipFilteredFolder: false,
					filterSelf: true,
					minDepth: 1,
				} );
			} )
			.then( () => {
				found.should.be.equal( 0 );
			} );
	} );

	test( "does not descend into provided base folder if explicitly enabled filter requests it", function() {
		return find( "..", {
			filter: localName => localName !== ".",
			filterSelf: true,
		} )
			.then( list => {
				list.length.should.be.equal( 0 );

				return find( "..", {
					filter: localName => localName !== ".",
					skipFilteredFolder: false,
					filterSelf: true,
				} );
			} )
			.then( list => {
				list.length.should.be.above( 1 );
			} );
	} );

	test( "provides stats on every file to filter callback, too", function() {
		return find( "..", {
			filter: ( localName, absoluteName, stat ) => stat.isDirectory(),
		} )
			.then( list => {
				list.should.be.Array().which.is.not.empty();

				list = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

				list.should.not.containEql( "lib/find.js" );
				list.should.not.containEql( "test/.setup.js" );
				list.should.not.containEql( "index.js" );
				list.should.not.containEql( "node_modules/eslint-config-cepharum/index.js" );

				list.should.containEql( "lib" );
				list.should.containEql( "test" );
				list.should.containEql( "." );
				list.should.containEql( "node_modules/eslint-config-cepharum" );
				list.should.containEql( "node_modules" );
			} );
	} );

	test( "does not descend into filtered folders by default", function() {
		return find( "..", {
			filter: ( localName, absoluteName, stat ) => {
				if ( stat.isDirectory() ) {
					return localName === "lib";
				}

				return localName.endsWith( "rmdir.js" );
			},
		} )
			.then( list => {
				list.should.be.Array().which.has.length( 3 );

				list = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

				list.should.containEql( "." );
				list.should.containEql( "lib" );
				list.should.containEql( "lib/rmdir.js" );
			} );
	} );

	test( "descends into filtered folders on explicit demand", function() {
		return find( "..", {
			filter: ( localName, absoluteName, stat ) => {
				if ( stat.isDirectory() ) {
					return localName === "lib";
				}

				return localName.endsWith( "rmdir.js" );
			},
			skipFilteredFolder: false,
		} )
			.then( list => {
				list.should.be.Array().which.has.length( 4 );

				list = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

				list.should.containEql( "." );
				list.should.containEql( "lib" );
				list.should.containEql( "lib/rmdir.js" );
				list.should.containEql( "test/rmdir.js" );
			} );
	} );

	test( "provides depth level on every file to filter callback, too", function() {
		return find( "..", {
			filter: ( localName, absoluteName, stat, depth ) => depth < 2,
		} )
			.then( list => {
				list.should.be.Array().which.is.not.empty();

				list = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

				list.should.not.containEql( "lib/find.js" );
				list.should.not.containEql( "test/.setup.js" );
				list.should.containEql( "index.js" );
				list.should.not.containEql( "node_modules/eslint-config-cepharum/index.js" );

				list.should.containEql( "lib" );
				list.should.containEql( "test" );
				list.should.containEql( "." );
				list.should.not.containEql( "node_modules/eslint-config-cepharum" );
				list.should.containEql( "node_modules" );
			} );
	} );

	test( "optionally limits result to minimum depth", function() {
		return find( "..", {
			minDepth: 2,
		} )
			.then( list => {
				list.should.be.Array().which.is.not.empty();

				list = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

				list.should.containEql( "lib/find.js" );
				list.should.containEql( "test/.setup.js" );
				list.should.not.containEql( "index.js" );
				list.should.containEql( "node_modules/eslint-config-cepharum/index.js" );

				list.should.not.containEql( "lib" );
				list.should.not.containEql( "test" );
				list.should.not.containEql( "." );
				list.should.containEql( "node_modules/eslint-config-cepharum" );
				list.should.not.containEql( "node_modules" );
			} );
	} );

	test( "optionally limits result to maximum depth", function() {
		return find( "..", {
			maxDepth: 2,
		} )
			.then( list => {
				list.should.be.Array().which.is.not.empty();

				list = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

				list.should.containEql( "lib/find.js" );
				list.should.containEql( "test/.setup.js" );
				list.should.containEql( "index.js" );
				list.should.not.containEql( "node_modules/eslint-config-cepharum/index.js" );

				list.should.containEql( "lib" );
				list.should.containEql( "test" );
				list.should.containEql( "." );
				list.should.containEql( "node_modules/eslint-config-cepharum" );
				list.should.containEql( "node_modules" );
			} );
	} );

	test( "optionally limits result to minimum and maximum depth", function() {
		return find( "..", {
			minDepth: 1,
			maxDepth: 1,
		} )
			.then( list => {
				list.should.be.Array().which.is.not.empty();

				list = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

				list.should.not.containEql( "lib/find.js" );
				list.should.not.containEql( "test/.setup.js" );
				list.should.containEql( "index.js" );
				list.should.not.containEql( "node_modules/eslint-config-cepharum/index.js" );

				list.should.containEql( "lib" );
				list.should.containEql( "test" );
				list.should.not.containEql( "." );
				list.should.not.containEql( "node_modules/eslint-config-cepharum" );
				list.should.containEql( "node_modules" );
			} );
	} );

	test( "never descends beyond selected maxDepth", function() {
		return find( "..", {
			filter: ( localName, absoluteName, stat, level ) => {
				level.should.be.belowOrEqual( 1 );
			},
			skipFilteredFolder: false,
			maxDepth: 1,
		} )
			.then( () => {
				return find( "..", {
					filter: ( localName, absoluteName, stat, level ) => {
						level.should.be.belowOrEqual( 1 );
						return true;
					},
					maxDepth: 1,
				} );
			} );
	} );

	test( "supports optional converter for describing actually resulting elements", function() {
		return find( "..", {
			minDepth: 1,
			maxDepth: 1,
		} )
			.then( list => {
				list.should.be.Array().which.is.not.empty();

				list
					.forEach( result => {
						result.should.be.String()
							.and.not.match( /^\d+:\s+\S.+$/ );
					} );
			} )
			.then( () => find( "..", {
				minDepth: 1,
				maxDepth: 1,
				converter: ( local, full, stat, depth ) => `${depth}: ${stat.isDirectory() ? local.split( "" ).reverse().join( "" ) : local}`,
			} ) )
			.then( list => {
				list.should.be.Array().which.is.not.empty();

				list
					.forEach( result => {
						result.should.be.String()
							.and.match( /^\d+:\s+\S.+$/ );
					} );
			} );
	} );

	test( "supports optional converter preventing matches from being collected as results", function() {
		return find( "..", {
			minDepth: 1,
			maxDepth: 3,
			filter: localName => !localName.startsWith( "node_modules" ),
			converter: ( local, full, stat, depth ) => `${depth}`,
		} )
			.then( allMatches => {
				allMatches.should.be.Array().which.is.not.empty();

				allMatches
					.forEach( result => {
						result.should.be.String().and.match( /^[1-3]$/ );
					} );

				allMatches.should.containEql( "2" );
				allMatches.should.containEql( "3" );

				return find( "..", {
					minDepth: 1,
					maxDepth: 3,
					filter: localName => !localName.startsWith( "node_modules" ),
					converter: ( local, full, stat, depth ) => ( depth > 1 ? null : `${depth}` ),
				} )
					.then( reducedMatches => {
						reducedMatches.should.be.Array().which.is.not.empty();

						reducedMatches
							.forEach( result => {
								result.should.be.String().and.match( /^[1-3]$/ );
							} );

						reducedMatches.should.not.containEql( "2" );
						reducedMatches.should.not.containEql( "3" );

						reducedMatches.length.should.be.below( allMatches.length );
					} );
			} );
	} );

	test( "exposes fresh context to every invocation of filter", function() {
		return find( "..", {
			minDepth: 1,
			maxDepth: 3,
			filter: function( localName ) {
				this.should.be.Object().which.is.empty();

				this.cached = localName;
			},
		} );
	} );

	test( "exposes same context to invocations of filter and converter regarding same file/folder", function() {
		return find( "..", {
			minDepth: 1,
			maxDepth: 3,
			filter: function( localName ) {
				this.cached = localName.toUpperCase();
			},
			converter: function( localName ) {
				this.cached.should.be.String().which.is.equal( localName.toUpperCase() );
			},
		} );
	} );

	test( "exposes method `cancel()` in context provided on invoking filter or converter for cancelling iteration", function() {
		// don't cancel iteration
		return find( "..", {
			minDepth: 1,
			maxDepth: 3,
			filter: function() {
				this.cancel.should.be.Function().which.has.length( 0 );
				return true;
			},
			converter: function( localName ) {
				this.cancel.should.be.Function().which.has.length( 0 );
				return localName;
			},
		} )
			.then( list => {
				list.should.be.Array();
				list.length.should.be.above( 3 );

				let count = 0;

				// cancel iteration in filter callback
				return find( "..", {
					minDepth: 1,
					maxDepth: 3,
					filter: function() {
						if ( ++count === 3 ) {
							this.cancel();
						}

						return true;
					},
				} );
			} )
			.then( list => {
				list.should.be.Array();
				list.length.should.be.equal( 3 );

				let count = 0;

				// cancel iteration in converter callback
				return find( "..", {
					minDepth: 1,
					maxDepth: 3,
					converter: function( localName ) {
						if ( ++count === 3 ) {
							this.cancel();
						}

						return localName;
					},
				} );
			} )
			.then( list => {
				list.should.be.Array();
				list.length.should.be.equal( 3 );
			} );
	} );

	test( "does not process any further matches after `cancel()` has been invoked by filter and/or converter callback", function() {
		// cancel iteration in filter
		let count = 0;

		return find( "..", {
			minDepth: 1,
			maxDepth: 3,
			filter: function() {
				count.should.not.be.aboveOrEqual( 3 );

				if ( ++count === 3 ) {
					this.cancel();
				}

				return true;
			},
			converter: function( name ) {
				count.should.not.be.above( 3 );

				return name;
			},
		} )
			.then( list => {
				list.should.be.Array();
				list.length.should.be.equal( 3 );

				let count = 0; // eslint-disable-line no-shadow

				// cancel iteration in converter callback
				return find( "..", {
					minDepth: 1,
					maxDepth: 3,
					filter: function() {
						count.should.not.be.aboveOrEqual( 3 );

						return true;
					},
					converter: function( name ) {
						count.should.not.be.aboveOrEqual( 3 );

						if ( ++count === 3 ) {
							this.cancel();
						}

						return name;
					},
				} );
			} )
			.then( list => {
				list.should.be.Array();
				list.length.should.be.equal( 3 );
			} );
	} );
} );
