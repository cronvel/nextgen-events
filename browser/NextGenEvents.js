(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.NextGenEvents = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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



// Create the object && export it
function NextGenEvents() { return Object.create( NextGenEvents.prototype ) ; }
module.exports = NextGenEvents ;





			/* Basic features, more or less compatible with Node.js */



NextGenEvents.SYNC = -Infinity ;

// Not part of the prototype, because it should not pollute userland's prototype.
// It has an eventEmitter as 'this' anyway (always called using call()).
NextGenEvents.init = function init()
{
	Object.defineProperty( this , '__ngev' , { value: {
		nice: NextGenEvents.SYNC ,
		interruptible: false ,
		recursion: 0 ,
		contexts: {} ,
		events: {
			// Special events
			error: [] ,
			interrupt: [] ,
			newListener: [] ,
			removeListener: []
		}
	} } ) ;
} ;



// Use it with .bind()
NextGenEvents.filterOutCallback = function( what , currentElement ) { return what !== currentElement ; } ;



// .addListener( eventName , [fn] , [options] )
NextGenEvents.prototype.addListener = function addListener( eventName , fn , options )
{
	var listener = {} ;
	
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! this.__ngev.events[ eventName ] ) { this.__ngev.events[ eventName ] = [] ; }
	
	if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( ".addListener(): argument #0 should be a non-empty string" ) ; }
	
	if ( typeof fn !== 'function' )
	{
		options = fn ;
		fn = undefined ;
	}
	
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	listener.fn = fn || options.fn ;
	listener.id = typeof options.id === 'string' ? options.id : listener.fn ;
	listener.once = !! options.once ;
	listener.async = !! options.async ;
	listener.nice = options.nice !== undefined ? Math.floor( options.nice ) : NextGenEvents.SYNC ;
	listener.context = typeof options.context === 'string' ? options.context : null ;
	
	if ( typeof listener.fn !== 'function' )
	{
		throw new TypeError( ".addListener(): a function or an object with a 'fn' property which value is a function should be provided" ) ;
	}
	
	// Implicit context creation
	if ( listener.context && typeof listener.context === 'string' && ! this.__ngev.contexts[ listener.context ] )
	{
		this.addListenerContext( listener.context ) ;
	}
	
	// Note: 'newListener' and 'removeListener' event return an array of listener, but not the event name.
	// So the event's name can be retrieved in the listener itself.
	listener.event = eventName ;
	
	// We should emit 'newListener' first, before adding it to the listeners,
	// to avoid recursion in the case that eventName === 'newListener'
	if ( this.__ngev.events.newListener.length )
	{
		// Return an array, because .addListener() may support multiple event addition at once
		// e.g.: .addListener( { request: onRequest, close: onClose, error: onError } ) ;
		this.emit( 'newListener' , [ listener ] ) ;
	}
	
	this.__ngev.events[ eventName ].push( listener ) ;
	
	return this ;
} ;

NextGenEvents.prototype.on = NextGenEvents.prototype.addListener ;



// Shortcut
NextGenEvents.prototype.once = function once( eventName , fn , options )
{
	if ( fn && typeof fn === 'object' ) { fn.once = true ; }
	else if ( options && typeof options === 'object' ) { options.once = true ; }
	else { options = { once: true } ; }
	
	return this.addListener( eventName , fn , options ) ;
} ;



NextGenEvents.prototype.removeListener = function removeListener( eventName , id )
{
	var i , length , newListeners = [] , removedListeners = [] ;
	
	if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( ".removeListener(): argument #0 should be a non-empty string" ) ; }
	
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! this.__ngev.events[ eventName ] ) { this.__ngev.events[ eventName ] = [] ; }
	
	length = this.__ngev.events[ eventName ].length ;
	
	// It's probably faster to create a new array of listeners
	for ( i = 0 ; i < length ; i ++ )
	{
		if ( this.__ngev.events[ eventName ][ i ].id === id )
		{
			removedListeners.push( this.__ngev.events[ eventName ][ i ] ) ;
		}
		else
		{
			newListeners.push( this.__ngev.events[ eventName ][ i ] ) ;
		}
	}
	
	this.__ngev.events[ eventName ] = newListeners ;
	
	if ( removedListeners.length && this.__ngev.events.removeListener.length )
	{
		this.emit( 'removeListener' , removedListeners ) ;
	}
	
	return this ;
} ;

NextGenEvents.prototype.off = NextGenEvents.prototype.removeListener ;



NextGenEvents.prototype.removeAllListeners = function removeAllListeners( eventName )
{
	var removedListeners ;
	
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	
	if ( eventName )
	{
		// Remove all listeners for a particular event
		
		if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( ".removeAllListener(): argument #0 should be undefined or a non-empty string" ) ; }
		
		if ( ! this.__ngev.events[ eventName ] ) { this.__ngev.events[ eventName ] = [] ; }
		
		removedListeners = this.__ngev.events[ eventName ] ;
		this.__ngev.events[ eventName ] = [] ;
		
		if ( removedListeners.length && this.__ngev.events.removeListener.length )
		{
			this.emit( 'removeListener' , removedListeners ) ;
		}
	}
	else
	{
		// Remove all listeners for any events
		// 'removeListener' listeners cannot be triggered: they are already deleted
		this.__ngev.events = {} ;
	}
	
	return this ;
} ;



NextGenEvents.listenerWrapper = function listenerWrapper( listener , event , context )
{
	var returnValue , serial ;
	
	if ( event.interrupt ) { return ; }
	
	if ( listener.async )
	{
		//serial = context && context.serial ;
		if ( context )
		{
			serial = context.serial ;
			context.ready = ! serial ;
		}
		
		returnValue = listener.fn.apply( undefined , event.args.concat( function( arg ) {
			
			event.listenersDone ++ ;
			
			// Async interrupt
			if ( arg && event.emitter.__ngev.interruptible && ! event.interrupt && event.name !== 'interrupt' )
			{
				event.interrupt = arg ;
				
				if ( event.callback )
				{
					event.callback( event.interrupt , event ) ;
					delete event.callback ;
				}
				
				event.emitter.emit( 'interrupt' , event.interrupt ) ;
			}
			else if ( event.listenersDone >= event.listeners && event.callback )
			{
				event.callback( undefined , event ) ;
				delete event.callback ;
			}
			
			// Process the queue if serialized
			if ( serial ) { NextGenEvents.processQueue.call( event.emitter , listener.context , true ) ; }
			
		} ) ) ;
	}
	else
	{
		returnValue = listener.fn.apply( undefined , event.args ) ;
		event.listenersDone ++ ;
	}
	
	// Interrupt if non-falsy return value, if the emitter is interruptible, not already interrupted (emit once),
	// and not within an 'interrupt' event.
	if ( returnValue && event.emitter.__ngev.interruptible && ! event.interrupt && event.name !== 'interrupt' )
	{
		event.interrupt = returnValue ;
		
		if ( event.callback )
		{
			event.callback( event.interrupt , event ) ;
			delete event.callback ;
		}
		
		event.emitter.emit( 'interrupt' , event.interrupt ) ;
	}
	else if ( event.listenersDone >= event.listeners && event.callback )
	{
		event.callback( undefined , event ) ;
		delete event.callback ;
	}
} ;



// A unique event ID
var nextEventId = 0 ;



/*
	emit( [nice] , eventName , [arg1] , [arg2] , [...] , [emitCallback] )
*/
NextGenEvents.prototype.emit = function emit()
{
	var i , iMax , count = 0 ,
		event , listener , context , currentNice ,
		listeners , removedListeners = [] ;
	
	event = {
		emitter: this ,
		id: nextEventId ++ ,
		name: null ,
		args: null ,
		nice: null ,
		interrupt: null ,
		listeners: null ,
		listenersDone: 0 ,
		callback: null ,
	} ;
	
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	
	// Arguments handling
	if ( typeof arguments[ 0 ] === 'number' )
	{
		event.nice = Math.floor( arguments[ 0 ] ) ;
		event.name = arguments[ 1 ] ;
		if ( ! event.name || typeof event.name !== 'string' ) { throw new TypeError( ".emit(): when argument #0 is a number, argument #1 should be a non-empty string" ) ; }
		
		if ( typeof arguments[ arguments.length - 1 ] === 'function' )
		{
			event.callback = arguments[ arguments.length - 1 ] ;
			event.args = Array.prototype.slice.call( arguments , 2 , -1 ) ;
		}
		else
		{
			event.args = Array.prototype.slice.call( arguments , 2 ) ;
		}
	}
	else
	{
		event.nice = this.__ngev.nice ;
		event.name = arguments[ 0 ] ;
		if ( ! event.name || typeof event.name !== 'string' ) { throw new TypeError( ".emit(): argument #0 should be an number or a non-empty string" ) ; }
		event.args = Array.prototype.slice.call( arguments , 1 ) ;
		
		if ( typeof arguments[ arguments.length - 1 ] === 'function' )
		{
			event.callback = arguments[ arguments.length - 1 ] ;
			event.args = Array.prototype.slice.call( arguments , 1 , -1 ) ;
		}
		else
		{
			event.args = Array.prototype.slice.call( arguments , 1 ) ;
		}
	}
	
	
	if ( ! this.__ngev.events[ event.name ] ) { this.__ngev.events[ event.name ] = [] ; }
	
	// Increment this.__ngev.recursion
	event.listeners = this.__ngev.events[ event.name ].length ;
	this.__ngev.recursion ++ ;
	
	// Trouble arise when a listener is removed from another listener, while we are still in the loop.
	// So we have to COPY the listener array right now!
	listeners = this.__ngev.events[ event.name ].slice() ;
	
	for ( i = 0 , iMax = listeners.length ; i < iMax ; i ++ )
	{
		count ++ ;
		listener = listeners[ i ] ;
		context = listener.context && this.__ngev.contexts[ listener.context ] ;
		
		// If the listener context is disabled...
		if ( context && context.status === NextGenEvents.CONTEXT_DISABLED ) { continue ; }
		
		// The nice value for this listener...
		if ( context ) { currentNice = Math.max( event.nice , listener.nice , context.nice ) ; }
		else { currentNice = Math.max( event.nice , listener.nice ) ; }
		
		
		if ( listener.once )
		{
			// We should remove the current listener RIGHT NOW because of recursive .emit() issues:
			// one listener may eventually fire this very same event synchronously during the current loop.
			this.__ngev.events[ event.name ] = this.__ngev.events[ event.name ].filter(
				NextGenEvents.filterOutCallback.bind( undefined , listener )
			) ;
			
			removedListeners.push( listener ) ;
		}
		
		if ( context && ( context.status === NextGenEvents.CONTEXT_QUEUED || ! context.ready ) )
		{
			// Almost all works should be done by .emit(), and little few should be done by .processQueue()
			context.queue.push( { event: event , listener: listener , nice: currentNice } ) ;
		}
		else
		{
			try {
				if ( currentNice < 0 )
				{
					if ( this.__ngev.recursion >= - currentNice )
					{
						setImmediate( NextGenEvents.listenerWrapper.bind( this , listener , event , context ) ) ;
					}
					else
					{
						NextGenEvents.listenerWrapper.call( this , listener , event , context ) ;
					}
				}
				else
				{
					setTimeout( NextGenEvents.listenerWrapper.bind( this , listener , event , context ) , currentNice ) ;
				}
			}
			catch ( error ) {
				// Catch error, just to decrement this.__ngev.recursion, re-throw after that...
				this.__ngev.recursion -- ;
				throw error ;
			}
		}
	}
	
	// Decrement recursion
	this.__ngev.recursion -- ;
	
	// Emit 'removeListener' after calling listeners
	if ( removedListeners.length && this.__ngev.events.removeListener.length )
	{
		this.emit( 'removeListener' , removedListeners ) ;
	}
	
	
	// 'error' event is a special case: it should be listened for, or it will throw an error
	if ( ! count )
	{
		if ( event.name === 'error' )
		{
			if ( arguments[ 1 ] ) { throw arguments[ 1 ] ; }
			else { throw Error( "Uncaught, unspecified 'error' event." ) ; }
		}
		
		if ( event.callback )
		{
			event.callback( undefined , event ) ;
			delete event.callback ;
		}
	}
	
	return event ;
} ;



NextGenEvents.prototype.listeners = function listeners( eventName )
{
	if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( ".listeners(): argument #0 should be a non-empty string" ) ; }
	
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! this.__ngev.events[ eventName ] ) { this.__ngev.events[ eventName ] = [] ; }
	
	// Do not return the array, shallow copy it
	return this.__ngev.events[ eventName ].slice() ;
} ;



NextGenEvents.listenerCount = function( emitter , eventName )
{
	if ( ! emitter || ! ( emitter instanceof NextGenEvents ) ) { throw new TypeError( ".listenerCount(): argument #0 should be an instance of NextGenEvents" ) ; }
	return emitter.listenerCount( eventName ) ;
} ;



NextGenEvents.prototype.listenerCount = function( eventName )
{
	if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( ".listenerCount(): argument #1 should be a non-empty string" ) ; }
	
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! this.__ngev.events[ eventName ] ) { this.__ngev.events[ eventName ] = [] ; }
	
	return this.__ngev.events[ eventName ].length ;
} ;



NextGenEvents.prototype.setNice = function setNice( nice )
{
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	//if ( typeof nice !== 'number' ) { throw new TypeError( ".setNice(): argument #0 should be a number" ) ; }
	
	this.__ngev.nice = Math.floor( +nice || 0 ) ;
} ;



NextGenEvents.prototype.setInterruptible = function setInterruptible( value )
{
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	//if ( typeof nice !== 'number' ) { throw new TypeError( ".setNice(): argument #0 should be a number" ) ; }
	
	this.__ngev.interruptible = !! value ;
} ;



// There is no such thing in NextGenEvents, however, we need to be compatible with node.js events at best
NextGenEvents.prototype.setMaxListeners = function() {} ;

// Sometime useful as a no-op callback...
NextGenEvents.noop = function() {} ;





			/* Next Gen feature: contexts! */



NextGenEvents.CONTEXT_ENABLED = 0 ;
NextGenEvents.CONTEXT_DISABLED = 1 ;
NextGenEvents.CONTEXT_QUEUED = 2 ;



NextGenEvents.prototype.addListenerContext = function addListenerContext( contextName , options )
{
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	
	if ( ! contextName || typeof contextName !== 'string' ) { throw new TypeError( ".addListenerContext(): argument #0 should be a non-empty string" ) ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	if ( ! this.__ngev.contexts[ contextName ] )
	{
		// A context IS an event emitter too!
		this.__ngev.contexts[ contextName ] = Object.create( NextGenEvents.prototype ) ;
		this.__ngev.contexts[ contextName ].nice = NextGenEvents.SYNC ;
		this.__ngev.contexts[ contextName ].ready = true ;
		this.__ngev.contexts[ contextName ].status = NextGenEvents.CONTEXT_ENABLED ;
		this.__ngev.contexts[ contextName ].serial = false ;
		this.__ngev.contexts[ contextName ].queue = [] ;
	}
	
	if ( options.nice !== undefined ) { this.__ngev.contexts[ contextName ].nice = Math.floor( options.nice ) ; }
	if ( options.status !== undefined ) { this.__ngev.contexts[ contextName ].status = options.status ; }
	if ( options.serial !== undefined ) { this.__ngev.contexts[ contextName ].serial = !! options.serial ; }
	
	return this ;
} ;



NextGenEvents.prototype.disableListenerContext = function disableListenerContext( contextName )
{
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! contextName || typeof contextName !== 'string' ) { throw new TypeError( ".disableListenerContext(): argument #0 should be a non-empty string" ) ; }
	if ( ! this.__ngev.contexts[ contextName ] ) { this.addListenerContext( contextName ) ; }
	
	this.__ngev.contexts[ contextName ].status = NextGenEvents.CONTEXT_DISABLED ;
	
	return this ;
} ;



NextGenEvents.prototype.enableListenerContext = function enableListenerContext( contextName )
{
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! contextName || typeof contextName !== 'string' ) { throw new TypeError( ".enableListenerContext(): argument #0 should be a non-empty string" ) ; }
	if ( ! this.__ngev.contexts[ contextName ] ) { this.addListenerContext( contextName ) ; }
	
	this.__ngev.contexts[ contextName ].status = NextGenEvents.CONTEXT_ENABLED ;
	
	if ( this.__ngev.contexts[ contextName ].queue.length > 0 ) { NextGenEvents.processQueue.call( this , contextName ) ; }
	
	return this ;
} ;



NextGenEvents.prototype.queueListenerContext = function queueListenerContext( contextName )
{
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! contextName || typeof contextName !== 'string' ) { throw new TypeError( ".queueListenerContext(): argument #0 should be a non-empty string" ) ; }
	if ( ! this.__ngev.contexts[ contextName ] ) { this.addListenerContext( contextName ) ; }
	
	this.__ngev.contexts[ contextName ].status = NextGenEvents.CONTEXT_QUEUED ;
	
	return this ;
} ;



NextGenEvents.prototype.serializeListenerContext = function serializeListenerContext( contextName , value )
{
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! contextName || typeof contextName !== 'string' ) { throw new TypeError( ".serializeListenerContext(): argument #0 should be a non-empty string" ) ; }
	if ( ! this.__ngev.contexts[ contextName ] ) { this.addListenerContext( contextName ) ; }
	
	this.__ngev.contexts[ contextName ].serial = value === undefined ? true : !! value ;
	
	return this ;
} ;



NextGenEvents.prototype.setListenerContextNice = function setListenerContextNice( contextName , nice )
{
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! contextName || typeof contextName !== 'string' ) { throw new TypeError( ".setListenerContextNice(): argument #0 should be a non-empty string" ) ; }
	if ( ! this.__ngev.contexts[ contextName ] ) { this.addListenerContext( contextName ) ; }
	
	this.__ngev.contexts[ contextName ].nice = Math.floor( nice ) ;
	
	return this ;
} ;



NextGenEvents.prototype.destroyListenerContext = function destroyListenerContext( contextName )
{
	var i , length , eventName , newListeners , removedListeners = [] ;
	
	if ( ! contextName || typeof contextName !== 'string' ) { throw new TypeError( ".disableListenerContext(): argument #0 should be a non-empty string" ) ; }
	
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	
	// We don't care if a context actually exists, all listeners tied to that contextName will be removed
	
	for ( eventName in this.__ngev.events )
	{
		newListeners = null ;
		length = this.__ngev.events[ eventName ].length ;
		
		for ( i = 0 ; i < length ; i ++ )
		{
			if ( this.__ngev.events[ eventName ][ i ].context === contextName )
			{
				newListeners = [] ;
				removedListeners.push( this.__ngev.events[ eventName ][ i ] ) ;
			}
			else if ( newListeners )
			{
				newListeners.push( this.__ngev.events[ eventName ][ i ] ) ;
			}
		}
		
		if ( newListeners ) { this.__ngev.events[ eventName ] = newListeners ; }
	}
	
	if ( this.__ngev.contexts[ contextName ] ) { delete this.__ngev.contexts[ contextName ] ; }
	
	if ( removedListeners.length && this.__ngev.events.removeListener.length )
	{
		this.emit( 'removeListener' , removedListeners ) ;
	}
	
	return this ;
} ;



// To be used with .call(), it should not pollute the prototype
NextGenEvents.processQueue = function processQueue( contextName , isCompletionCallback )
{
	var context , job ;
	
	// The context doesn't exist anymore, so just abort now
	if ( ! this.__ngev.contexts[ contextName ] ) { return ; }
	
	context = this.__ngev.contexts[ contextName ] ;
	
	if ( isCompletionCallback ) { context.ready = true ; }
	
	// Should work on serialization here
	
	//console.log( ">>> " , context ) ;
	
	// Increment recursion
	this.__ngev.recursion ++ ;
	
	while ( context.ready && context.queue.length )
	{
		job = context.queue.shift() ;
		
		// This event has been interrupted, drop it now!
		if ( job.event.interrupt ) { continue ; }
		
		try {
			if ( job.nice < 0 )
			{
				if ( this.__ngev.recursion >= - job.nice )
				{
					setImmediate( NextGenEvents.listenerWrapper.bind( this , job.listener , job.event , context ) ) ;
				}
				else
				{
					NextGenEvents.listenerWrapper.call( this , job.listener , job.event , context ) ;
				}
			}
			else
			{
				setTimeout( NextGenEvents.listenerWrapper.bind( this , job.listener , job.event , context ) , job.nice ) ;
			}
		}
		catch ( error ) {
			// Catch error, just to decrement this.__ngev.recursion, re-throw after that...
			this.__ngev.recursion -- ;
			throw error ;
		}
	}
	
	// Decrement recursion
	this.__ngev.recursion -- ;
} ;



// Backup for the AsyncTryCatch
NextGenEvents.on = NextGenEvents.prototype.on ;
NextGenEvents.once = NextGenEvents.prototype.once ;
NextGenEvents.off = NextGenEvents.prototype.off ;



},{}],2:[function(require,module,exports){
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

/* global window */



if ( typeof window.setImmediate !== 'function' )
{
	window.setImmediate = function setImmediate( fn ) {
		setTimeout( fn , 0 ) ;
	} ;
}

module.exports = require( './NextGenEvents.js' ) ;
module.exports.isBrowser = true ;

},{"./NextGenEvents.js":1}]},{},[2])(2)
});