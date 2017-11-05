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

const { suite, test } = require( "mocha" );
const Should = require( "should" );

const { mkfile, mkdir, read, rmdir } = require( "../" );


const dataDir = Path.resolve( __dirname, "../data" );


suite( "require( 'file-essentials' ).mkfile", function() {
	suiteSetup( function() {
		process.chdir( __dirname );

		return rmdir( dataDir, { subsOnly: true } )
			.then( () => mkdir( "..", "data" ) );
	} );

	test( "is a function", function() {
		Should( mkfile ).be.a.Function().which.has.length( 1 );
	} );

	test( "does not throw on invocation", function() {
		let promise;

		( () => ( promise = mkfile( dataDir ) ) ).should.not.throw();

		return promise.then( ( { fd } ) => File.closeSync( fd ) );
	} );

	test( "returns promise resolved on having created unique file in desired path name", function() {
		const promise = mkfile( dataDir );

		promise.should.be.Promise().which.is.resolved();

		return promise.then( ( { fd } ) => File.closeSync( fd ) );
	} );

	test( "returns promise resolved with full pathname of created folder", function() {
		return mkfile( dataDir )
			.then( result => {
				Should( result ).be.Object().and.be.ok();

				result.should.have.property( "name" ).which.is.a.String();
				result.should.have.property( "uuid" ).which.is.a.String();
				result.should.have.property( "fd" ).which.is.ok();

				result.name.should.equal( Path.join( dataDir, result.uuid ) );

				File.closeSync( result.fd );
			} );
	} );

	test( "promises created file's descriptor in property fd available for writing to file", function() {
		return mkfile( dataDir )
			.then( result => {
				( () => File.writeSync( result.fd, "some content" ) ).should.not.throw();
				( () => File.closeSync( result.fd ) ).should.not.throw();

				return read( result.name )
					.then( content => {
						content.toString().should.equal( "some content" );
					} );
			} );
	} );

	test( "supports callback for mapping UUIDv4 into arbitrary relative path name", function() {
		return mkfile( dataDir, {
			uuidToPath: uuid => Path.join( "this/is my/extra.path", uuid ),
		} )
			.then( result => {
				Should( result ).be.Object().and.be.ok();

				File.closeSync( result.fd );

				result.name.should.equal( Path.join( dataDir, "this/is my/extra.path", result.uuid ) );
			} );
	} );

	test( "appends desired suffix to file name", function() {
		return mkfile( dataDir, {
			suffix: "mysuffix",
		} )
			.then( result => {
				Should( result ).be.Object().and.be.ok();

				File.closeSync( result.fd );

				result.name.should.equal( Path.join( dataDir, result.uuid + "mysuffix" ) );
			} );
	} );

	test( "appends desired suffix to mapped file name", function() {
		return mkfile( dataDir, {
			uuidToPath: uuid => Path.join( "this/is my/extra.path", uuid ),
			suffix: "mysuffix",
		} )
			.then( result => {
				Should( result ).be.Object().and.be.ok();

				File.closeSync( result.fd );

				result.name.should.equal( Path.join( dataDir, "this/is my/extra.path", result.uuid + "mysuffix" ) );
			} );
	} );

	test( "fails if no new file can be created", function() {
		return mkfile( dataDir, {
			uuidToPath: () => Path.join( "this/is my/fix-name" ),
		} )
			.then( ( { fd } ) => {
				File.closeSync( fd );

				return mkfile( dataDir, {
					uuidToPath: () => Path.join( "this/is my/fix-name" ),
				} ).should.be.rejected();
			} );
	} );
} );
