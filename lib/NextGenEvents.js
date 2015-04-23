/*
	The Cedric's Swiss Knife (CSK) - CSK NextGen Events
	
	Copyright (c) 2015 Cédric Ronvel 
	
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



// Modules


// Create the object && export it
function NextGenEvents() { return Object.create( NextGenEvents.prototype ) ; }
module.exports = NextGenEvents ;



// Not part of the prototype, because it should not pollute userland's prototype.
// It has an eventEmitter as 'this' anyway (always called using call()).
NextGenEvents.init = function init()
{
	this.__ngev = {
		contexts: {} ,
		events: {
			// Special events
			error: [] ,
			newListener: [] ,
			removeListener: []
		}
	} ;
} ;



NextGenEvents.createListener = function createListener()
{
} ;

NextGenEvents.CONTEXT_DISABLED = 0 ;
NextGenEvents.CONTEXT_QUEUED = 1 ;
NextGenEvents.CONTEXT_ENABLED = 2 ;



NextGenEvents.prototype.addListener = function addListener( eventName , options )
{
	var listener = {} , context ;
	
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! this.__ngev.events[ eventName ] ) { this.__ngev.events[ eventName ] = [] ; }
	
	if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( "[nextgen-events] .addListener(): argument #0 should be a non-empty string" ) ; }
	
	if ( typeof options === 'function' )
	{
		// The user provided a simple function listener
		listener.id = options ;
		listener.fn = options ;
	}
	else if ( ! options || typeof options !== 'object' || typeof options.fn !== 'function' )
	{
		throw new TypeError( "[nextgen-events] .addListener(): argument #1 should be a function or an object with a 'fn' property which value is a function" ) ;
	}
	else
	{
		listener.fn = options.fn ;
		listener.id = typeof options.id === 'string' ? options.id : options.fn ;
		listener.once = !! options.once ;
		listener.async = !! options.async ;
		listener.context = typeof options.context === 'string' ? options.context : null ;
		
		// Implicit context creation
		if ( typeof listener.context === 'string' && ! this.__ngev.contexts[ listener.context ] )
		{
			context = this.__ngev.contexts[ listener.context ] = Object.create( NextGenEvents.prototype ) ;
			context.status = NextGenEvents.CONTEXT_ENABLED ;
			context.ready = true ;
			context.series = true ;
		}
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
	
	return this;
} ;



NextGenEvents.prototype.on = NextGenEvents.prototype.addListener ;



// Shortcut
NextGenEvents.prototype.once = function once( eventName , options )
{
	if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( "[nextgen-events] .once(): argument #0 should be a non-empty string" ) ; }
	
	if ( typeof options === 'function' )
	{
		options = { id: options , fn: options } ;
	}
	else if ( ! options || typeof options !== 'object' || typeof options.fn !== 'function' )
	{
		throw new TypeError( "[nextgen-events] .once(): argument #1 should be a function or an object with a 'fn' property which value is a function" ) ;
	}
	
	options.once = true ;
	
	return this.addListener( eventName , options ) ;
} ;



NextGenEvents.prototype.removeListener = function removeListener( eventName , id )
{
	var i , length , newListeners = [] , removedListeners = [] ;
	
	if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( "[nextgen-events] .removeListener(): argument #0 should be a non-empty string" ) ; }
	
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
		
		if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( "[nextgen-events] .removeAllListener(): argument #0 should be undefined or a non-empty string" ) ; }
		
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



NextGenEvents.prototype.emit = function emit( eventName )
{
	var i , args , listener , count = 0 , newListeners , removedListeners = [] ;
	
	if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( "[nextgen-events] .emit(): argument #0 should be a non-empty string" ) ; }
	
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! this.__ngev.events[ eventName ] ) { this.__ngev.events[ eventName ] = [] ; }
	
	// Prepare arguments
	// /!\ done even if there is no listener ATM
	args = Array.prototype.slice.call( arguments , 1 ) ;
	
	for ( i = 0 ; i < this.__ngev.events[ eventName ].length ; i ++ )
	{
		count ++ ;
		listener = this.__ngev.events[ eventName ][ i ] ;
		
		if ( listener.once )
		{
			if ( ! newListeners )
			{
				// So create a newListeners array containing all registered listener before this index
				newListeners = this.__ngev.events[ eventName ].slice( 0 , i ) ;
			}
			
			removedListeners.push( listener ) ;
		}
		else if ( newListeners )
		{
			newListeners.push( listener ) ;
		}
		
		listener.fn.apply( this , args ) ;
	}
	
	// If some one time listener where triggered, we should replace the old listener array by the new
	if ( newListeners )
	{
		this.__ngev.events[ eventName ] = newListeners ;
	}
	
	// Emit 'removeListener' after calling listeners
	if ( removedListeners.length && this.__ngev.events.removeListener.length )
	{
		this.emit( 'removeListener' , removedListeners ) ;
	}
	
	
	// 'error' event is a special case: it should be listened for, or it will throw an error
	if ( ! count && eventName === 'error' )
	{
		if ( arguments[ 1 ] ) { throw arguments[ 1 ] ; }
		else { throw Error( "[nextgen-events] Uncaught, unspecified 'error' event." ) ; }
	}
} ;



NextGenEvents.prototype.listeners = function listeners( eventName )
{
	if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( "[nextgen-events] .listeners(): argument #0 should be a non-empty string" ) ; }
	
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! this.__ngev.events[ eventName ] ) { this.__ngev.events[ eventName ] = [] ; }
	
	// Do not return the array, shallow copy it
	return this.__ngev.events[ eventName ].slice() ;
} ;



NextGenEvents.listenerCount = function( emitter , eventName )
{
	if ( ! emitter || ! ( emitter instanceof NextGenEvents ) ) { throw new TypeError( "[nextgen-events] .listenerCount(): argument #0 should be an instance of NextGenEvents" ) ; }
	if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( "[nextgen-events] .listenerCount(): argument #1 should be a non-empty string" ) ; }
	
	if ( ! emitter.__ngev ) { NextGenEvents.init.call( emitter ) ; }
	if ( ! emitter.__ngev.events[ eventName ] ) { emitter.__ngev.events[ eventName ] = [] ; }
	
	return emitter.__ngev.events[ eventName ].length ;
} ;



// Should be implemented later
//NextGenEvents.prototype.listeners = function listeners(type) {} ;
//NextGenEvents.listenerCount = function(emitter, type) {} ;



// There is no such thing in nextGen emit, however, we need to be compatible for drop-in replacement of node.js events
NextGenEvents.prototype.setMaxListeners = function() {} ;





