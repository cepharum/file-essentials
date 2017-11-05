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

	setup( function() {
		process.chdir( __dirname );
	} );

	test( "is a function", function() {
		Should( find ).be.a.Function().which.has.length( 1 );
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
		return find( "..", { filter: localName => localName.startsWith( "index.js" ) } )
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
				list.should.containEql( "" );
				list.should.containEql( "node_modules/eslint-config-cepharum" );
				list.should.containEql( "node_modules" );
			} );
	} );
} );
