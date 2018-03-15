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

const { mkdir, rmdir, write } = require( "../" );

const createDataDir = require( "./.setup" );


const dataDir = Path.resolve( __dirname, "../data" );


suite( "require( 'file-essentials' ).mkdir", function() {
	suiteSetup( function( done ) {
		createDataDir( dataDir, done );
	} );

	suiteTeardown( function() {
		return rmdir( "../data" );
	} );

	test( "is a function", function() {
		Should( mkdir ).be.a.Function().which.has.length( 1 );
	} );

	test( "does not throw on invocation w/o second argument", function() {
		let promise;

		( () => ( promise = mkdir( dataDir ) ) ).should.not.throw();

		return promise;
	} );

	test( "does not throw on invocation w/ second argument", function() {
		let promise;

		( () => ( promise = mkdir( dataDir, [] ) ) ).should.not.throw();

		return promise;
	} );

	test( "returns promise resolved on having created all folders of solely provided path name", function() {
		const solePath = Path.resolve( dataDir, "some", "sole", "sub", "folder" );

		return mkdir( solePath ).should.be.Promise().which.is.resolvedWith( solePath );
	} );

	test( "returns promise resolved on having created all subfolders in desired path name", function() {
		return mkdir( dataDir, [ "some", "further", "subfolder" ] ).should.be.Promise().which.is.resolvedWith( Path.resolve( dataDir, "some", "further", "subfolder" ) );
	} );

	test( "returns promise resolved with full pathname of created folder", function() {
		return mkdir( dataDir, ["test"] ).should.be.Promise().which.is.resolvedWith( Path.resolve( dataDir, "test" ) );
	} );

	test( "succeeds on creating multiple levels", function() {
		return mkdir( dataDir, [ "some", "deep", "folder-structure", "to.be", "cre ated" ] ).should.be.Promise().which.is.resolvedWith( Path.resolve( dataDir, "some/deep/folder-structure/to.be/cre ated" ) );
	} );

	test( "succeeds on request for creating existing directory", function() {
		return mkdir( dataDir, [ "another", "deep", "folder-structure", "to.be", "cre ated" ] )
			.then( () => {
				return mkdir( dataDir, [ "another", "deep", "folder-structure", "to.be", "cre ated" ] )
					.should.be.Promise()
					.which.is.resolvedWith( Path.resolve( dataDir, "another/deep/folder-structure/to.be/cre ated" ) );
			} )
			.then( () => {
				return mkdir( dataDir, "another/deep/folder-structure/to.be/cre ated" )
					.should.be.Promise()
					.which.is.resolvedWith( Path.resolve( dataDir, "another/deep/folder-structure/to.be/cre ated" ) );
			} )
			.then( () => {
				return mkdir( dataDir, "another\\deep\\folder-structure\\to.be\\cre ated" )
					.should.be.Promise()
					.which.is.resolvedWith( Path.resolve( dataDir, "another/deep/folder-structure/to.be/cre ated" ) );
			} );
	} );

	test( "fails on request for creating directory due to found existing non-directory at start of path to subfolder", function() {
		return write( Path.resolve( dataDir, "file" ), "" )
			.then( () => {
				return mkdir( dataDir, [ "file", "deep", "folder-structure", "to.be", "cre ated" ] )
					.should.be.a.Promise().which.is.rejected();
			} );
	} );

	test( "fails on request for creating directory due to found existing non-directory at end of path to subfolder", function() {
		return mkdir( dataDir, [ "yet", "another", "deep", "folder-structure", "to.be" ] )
			.then( folder => write( Path.resolve( folder, "failing" ), "" ) )
			.then( () => {
				return mkdir( dataDir, [ "yet", "another", "deep", "folder-structure", "to.be", "failing" ] )
					.should.be.a.Promise().which.is.rejected();
			} );
	} );

	test( "fails on request for creating directory due to found existing non-directory at inner segment of path to subfolder", function() {
		return mkdir( dataDir, [ "yet", "another", "deep" ] )
			.then( folder => write( Path.resolve( folder, "folder" ), "" ) )
			.then( () => {
				return mkdir( dataDir, [ "yet", "another", "deep", "folder", "to.be", "failing" ] )
					.should.be.a.Promise().which.is.rejected();
			} );
	} );

	test( "fails on creating multiple levels with segment containing path separator", function() {
		return mkdir( dataDir, [ "some", "deep", `folder${Path.sep}structure`, "to.be", "cre ated" ] ).should.be.Promise().which.is.rejected();
	} );

	test( "fails on creating multiple levels with segment consisting of period, only", function() {
		return mkdir( dataDir, [ "some", "deep", "folder-structure", ".", "cre ated" ] ).should.be.Promise().which.is.rejected();
	} );

	test( "fails on creating multiple levels with segment consisting of two periods, only", function() {
		return mkdir( dataDir, [ "some", "deep", "folder-structure", "..", "cre ated" ] ).should.be.Promise().which.is.rejected();
	} );
} );
