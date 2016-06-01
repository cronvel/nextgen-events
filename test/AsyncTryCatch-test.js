/*
	Next Gen Events
	
	Copyright (c) 2015 - 2016 Cédric Ronvel
	
	The MIT License (MIT)
	
	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:
	
	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.
	
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

/* jshint unused:false */
/* global describe, it, before, after */



var atc = require( '../lib/AsyncTryCatch.js' ) ;
var expect = require( 'expect.js' ) ;





			/* Tests */



describe( "..." , function() {
	
	it( "Sync" , function() {
		
		atc.try( function() {
			throw new Error( 'sync error' ) ;
		} )
		.catch( function( error ) {
			expect( error.message ).to.be( 'sync error' ) ;
		} ) ;
	} ) ;
	
	it( "Async: setTimeout" , function( done ) {
		
		atc.try( function() {
			setTimeout( function() {
				throw new Error( 'setTimeout error' ) ;
			} , 0 ) ;
		} )
		.catch( function( error ) {
			expect( error.message ).to.be( 'setTimeout error' ) ;
			done() ;
		} ) ;
	} ) ;
	
	it( "Async: double setTimeout" , function( done ) {
		
		atc.try( function() {
			setTimeout( function() {
				setTimeout( function() {
					throw new Error( 'double setTimeout error' ) ;
				} , 0 ) ;
			} , 0 ) ;
		} )
		.catch( function( error ) {
			expect( error.message ).to.be( 'double setTimeout error' ) ;
			done() ;
		} ) ;
	} ) ;
	
	it( "Async: quintuple setTimeout" , function( done ) {
		
		atc.try( function() {
			setTimeout( function() {
				setTimeout( function() {
					setTimeout( function() {
						setTimeout( function() {
							setTimeout( function() {
								throw new Error( 'quintuple setTimeout error' ) ;
							} , 0 ) ;
						} , 0 ) ;
					} , 0 ) ;
				} , 0 ) ;
			} , 0 ) ;
		} )
		.catch( function( error ) {
			expect( error.message ).to.be( 'quintuple setTimeout error' ) ;
			done() ;
		} ) ;
	} ) ;
} ) ;

