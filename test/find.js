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

	test( "returns promise resolved on having enumerated all elements of given folder", function() {
		return find( ".." ).should.be.Promise().which.is.resolved();
	} );

	test( "promises path names of all found elements", function() {
		return find( ".." )
			.then( list => {
				list.should.be.Array().which.is.not.empty();

				list = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

				list.should.containEql( "lib/find.js" );
				list.should.containEql( "test/.setup.js" );
				list.should.containEql( "index.js" );
				list.should.containEql( "node_modules/eslint-config-cepharum/index.js" );
			} );
	} );

	test( "promises path names of all found elements in depth-last order by default", function() {
		return find( ".." )
			.then( list => {
				list.should.be.Array().which.is.not.empty();

				list = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

				const a = list.indexOf( "lib" );
				const b = list.indexOf( "lib/find.js" );

				( a < b ).should.be.true();
			} );
	} );

	test( "promises path names of all found elements in depth-first order on demand", function() {
		return find( "..", { depthFirst: true } )
			.then( list => {
				list.should.be.Array().which.is.not.empty();

				list = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

				const a = list.indexOf( "lib" );
				const b = list.indexOf( "lib/find.js" );

				( a < b ).should.be.false();
			} );
	} );

	test( "promises absolute path names of all found elements on demand", function() {
		return find( "..", { qualified: true } )
			.then( list => {
				list.should.be.Array().which.is.not.empty();

				list = list.map( i => i.replace( /\\/g, Path.posix.sep ) );

				list.should.not.containEql( "lib/find.js" );
				list.should.containEql( Path.resolve( "..", "lib/find.js" ).replace( /\\/g, Path.posix.sep ) );
			} );
	} );

	test( "promises path names of found elements satisfying custom filter", function() {
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

	test( "does not check filter on provided pathname itself", function() {
		return find( "..", {
			filter: localName => {
				localName.should.be.String().which.is.not.empty();
				return true;
			},
		} )
			.then( () => {
				return find( "..", {
					filter: localName => {
						localName.should.be.String().which.is.not.empty();
					},
					skipFilteredFolder: false,
				} );
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
			filter: ( localName, absoluteName, stat ) => stat.isDirectory() ? localName === "lib" : localName.endsWith( "rmdir.js" ),
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
			filter: ( localName, absoluteName, stat ) => stat.isDirectory() ? localName === "lib" : localName.endsWith( "rmdir.js" ),
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
					converter: ( local, full, stat, depth ) => depth > 1 ? null : `${depth}`,
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
} );
