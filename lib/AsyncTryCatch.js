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

"use strict" ;



var CoreEvents = require( 'events' ) ;



function AsyncTryCatch() { throw new Error( "Use AsyncTryCatch.try() instead." ) ; }
module.exports = AsyncTryCatch ;



AsyncTryCatch.stack = [] ;
AsyncTryCatch.substituted = false ;



AsyncTryCatch.try = function try_( fn )
{
	var self = Object.create( AsyncTryCatch.prototype , {
		fn: { value: fn , enumerable: true }
	} ) ;
	
	return self ;
} ;



AsyncTryCatch.prototype.catch = function catch_( catchFn )
{
	Object.defineProperties( this , {
		catchFn: { value: catchFn , enumerable: true }
	} ) ;
	
	if ( ! AsyncTryCatch.substituted ) { AsyncTryCatch.substitute() ; }
	
	AsyncTryCatch.stack.push( this ) ;
	
	try {
		this.fn() ;
	}
	catch ( error ) {
		catchFn( error ) ;
	}
	
	AsyncTryCatch.stack.pop() ;
} ;



// First, backup everything
if ( ! global.Vanilla )
{
	global.Vanilla = {} ;
	
	if ( ! global.Vanilla.setTimeout ) { global.Vanilla.setTimeout = setTimeout ; }
	if ( ! global.Vanilla.setImmediate ) { global.Vanilla.setImmediate = setImmediate ; }
	if ( ! global.Vanilla.nextTick ) { global.Vanilla.nextTick = process.nextTick ; }
	
	if ( ! global.Vanilla.Error ) { global.Vanilla.Error = Error ; }
	
	//if ( ! global.Vanilla.emit ) { global.Vanilla.Emit = CoreEvents.prototype.emit ; }
	if ( ! global.Vanilla.on ) { global.Vanilla.on = CoreEvents.prototype.on ; }
}



AsyncTryCatch.substitute = function substitute()
{
	if ( AsyncTryCatch.substituted ) { return ; }
	AsyncTryCatch.substituted = true ;
	
	global.setTimeout = AsyncTryCatch.setTimeout ;
	
	global.Error = AsyncTryCatch.Error ;
	// Should do that for all error types, cause they will not inherit from the substituted constructor
	
	CoreEvents.prototype.on = AsyncTryCatch.on ;
	CoreEvents.prototype.addListener = AsyncTryCatch.on ;
} ;



AsyncTryCatch.restore = function restore()
{
	if ( ! AsyncTryCatch.substituted ) { return ; }
	AsyncTryCatch.substituted = false ;
	
	global.setTimeout = global.Vanilla.setTimeout ;
	global.Error = global.Vanilla.Error ;
	
	CoreEvents.prototype.on = global.Vanilla.on ;
	CoreEvents.prototype.addListener = global.Vanilla.on ;
} ;



AsyncTryCatch.Error = function Error( message )
{
	global.Vanilla.Error.call( this ) ;
	global.Vanilla.Error.captureStackTrace && global.Vanilla.Error.captureStackTrace( this , this.constructor ) ; // jshint ignore:line
	
	Object.defineProperties( this , {
		message: { value: message , writable: true } ,
		id: { value: '' + Math.floor( Math.random( 1000000 ) ) }
	} ) ;
} ;

AsyncTryCatch.Error.prototype = Object.create( global.Vanilla.Error.prototype ) ;
AsyncTryCatch.Error.prototype.constructor = AsyncTryCatch.Error ;



AsyncTryCatch.setTimeout = function setTimeout( fn , time )
{
	if ( ! AsyncTryCatch.stack.length )
	{
		global.Vanilla.setTimeout( fn , time ) ;
		return ;
	}
	
	var atc = AsyncTryCatch.stack[ AsyncTryCatch.stack.length - 1 ] ;
	
	global.Vanilla.setTimeout( function() {
		try {
			AsyncTryCatch.stack.push( atc ) ;
			fn() ;
			AsyncTryCatch.stack.pop() ;
		}
		catch ( error ) {
			atc.catchFn( error ) ;
		}
	} , time ) ;
} ;



AsyncTryCatch.on = function on( event , fn )
{
	var self = this ;
	
	if ( ! AsyncTryCatch.stack.length )
	{
		global.Vanilla.on.call( self , event , fn ) ;
		return ;
	}
	
	var atc = AsyncTryCatch.stack[ AsyncTryCatch.stack.length - 1 ] ;
	
	global.Vanilla.on.call( self , event , function() {
		try {
			AsyncTryCatch.stack.push( atc ) ;
			fn.apply( this , arguments ) ;
			AsyncTryCatch.stack.pop() ;
		}
		catch ( error ) {
			atc.catchFn( error ) ;
		}
	} ) ;
} ;




