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

const { suite, test } = require( "mocha" );
const Should = require( "should" );

const { list } = require( "../" );


suite( "require( 'file-essentials' ).list", function() {
	suiteSetup( function() {
		process.chdir( __dirname );
	} );

	test( "is a function", function() {
		Should( list ).be.a.Function().which.has.length( 0 );
	} );

	test( "does not throw on invocation", function() {
		let promise;

		( () => ( promise = list() ) ).should.not.throw();

		return promise;
	} );

	test( "promises names of elements in current folder", function() {
		return list().should.be.Promise().which.is.resolved()
			.then( entries => {
				Should( entries ).be.ok().and.an.Array().which.is.not.empty();

				entries.should.not.containEql( "." );
				entries.should.not.containEql( ".." );
				entries.should.containEql( ".setup.js" );
				entries.should.containEql( "list.js" );
			} );
	} );

	test( "promises names of elements in a selected folder", function() {
		return list( ".." ).should.be.Promise().which.is.resolved()
			.then( entries => {
				Should( entries ).be.ok().and.an.Array().which.is.not.empty();

				entries.should.not.containEql( "." );
				entries.should.not.containEql( ".." );
				entries.should.containEql( "index.js" );
				entries.should.containEql( "package.json" );
			} );
	} );

	test( "rejects to list elements of a missing folder", function() {
		return list( "../not-found" ).should.be.Promise().which.is.rejected();
	} );
} );
