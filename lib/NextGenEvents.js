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



// Create the object && export it
function NextGenEvents() { return Object.create( NextGenEvents.prototype ) ; }
module.exports = NextGenEvents ;





			/* Basic features, more or less compatible with Node.js */



// Not part of the prototype, because it should not pollute userland's prototype.
// It has an eventEmitter as 'this' anyway (always called using call()).
NextGenEvents.init = function init()
{
	this.__ngev = {
		nice: NextGenEvents.SYNC ,
		contexts: {} ,
		events: {
			// Special events
			error: [] ,
			newListener: [] ,
			removeListener: []
		}
	} ;
} ;



NextGenEvents.prototype.addListener = function addListener( eventName , options )
{
	var listener = {} ;
	
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! this.__ngev.events[ eventName ] ) { this.__ngev.events[ eventName ] = [] ; }
	
	if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( "[nextgen-events] .addListener(): argument #0 should be a non-empty string" ) ; }
	
	if ( typeof options === 'function' )
	{
		// The user provided a simple function listener
		listener.id = options ;
		listener.fn = options ;
		listener.nice = NextGenEvents.SYNC ;
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
		listener.nice = options.nice !== undefined ? Math.floor( options.nice ) : NextGenEvents.SYNC ;
		listener.context = typeof options.context === 'string' ? options.context : null ;
		
		// Implicit context creation
		if ( listener.context && typeof listener.context === 'string' && ! this.__ngev.contexts[ listener.context ] )
		{
			this.addListenerContext( listener.context ) ;
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
	
	return this ;
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



NextGenEvents.SYNC = -3 ;
NextGenEvents.NEXT_TICK = -2 ;
NextGenEvents.IMMEDIATE = -1 ;
NextGenEvents.TIMEOUT = 0 ;



/*
	emit( [nice] , eventName , [arg1] , [arg2] , [...] )
		nice: 
*/
NextGenEvents.prototype.emit = function emit()
{
	var nice , eventName , args ,
		i , listener , context , currentNice , turnReadyOff , count = 0 ,
		newListeners , removedListeners = [] ;
	
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	
	// Arguments handling
	if ( typeof arguments[ 0 ] === 'number' )
	{
		nice = Math.floor( arguments[ 0 ] ) ;
		eventName = arguments[ 1 ] ;
		if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( "[nextgen-events] .emit(): when argument #0 is a number, argument #1 should be a non-empty string" ) ; }
		args = Array.prototype.slice.call( arguments , 2 ) ;
	}
	else
	{
		nice = this.__ngev.nice ;
		eventName = arguments[ 0 ] ;
		if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( "[nextgen-events] .emit(): argument #0 should be an number or a non-empty string" ) ; }
		args = Array.prototype.slice.call( arguments , 1 ) ;
	}
	
	
	if ( ! this.__ngev.events[ eventName ] ) { this.__ngev.events[ eventName ] = [] ; }
	
	
	for ( i = 0 ; i < this.__ngev.events[ eventName ].length ; i ++ )
	{
		count ++ ;
		listener = this.__ngev.events[ eventName ][ i ] ;
		context = listener.context && this.__ngev.contexts[ listener.context ] ;
		currentArgs = args ;
		turnReadyOff = false ;
		
		// If the listener context is disabled...
		if ( context && context.status === NextGenEvents.CONTEXT_DISABLED ) { continue ; }
		
		// The nice value for this listener...
		if ( context ) { currentNice = Math.max( nice , listener.nice , context.nice ) ; }
		else { currentNice = Math.max( nice , listener.nice ) ; }
		
		
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
		
		if ( listener.async )
		{
			if ( context && context.serial )
			{
				currentArgs = args.concat( NextGenEvents.processQueue.bind( this , listener.context , true ) ) ;
				turnReadyOff = true ;
			}
			else
			{
				currentArgs = args.concat( NextGenEvents.noop ) ;
			}
		}
		
		if ( context && ( context.status === NextGenEvents.CONTEXT_QUEUED || ! context.ready ) )
		{
			// Almost all works should be done by .emit(), and little few should be done by .processQueue()
			context.queue.push( { listener: listener , nice: currentNice , args: currentArgs } ) ;
		}
		else
		{
			if ( turnReadyOff ) { context.ready = false ; }
			
			switch ( currentNice )
			{
				case NextGenEvents.SYNC :
					listener.fn.apply( this , currentArgs ) ;
					break ;
				case NextGenEvents.NEXT_TICK :
					process.nextTick( listener.fn.bind( this , currentArgs ) ) ;
					break ;
				case NextGenEvents.IMMEDIATE :
					setImmediate( listener.fn.bind( this , currentArgs ) ) ;
					break ;
				default :
					if ( nice < NextGenEvents.SYNC ) { listener.fn.apply( this , currentArgs ) ; }
					else { setTimeout( listener.fn.bind( this , currentArgs ) , currentNice * 10 ) ; }
					break ;
			}
		}
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



NextGenEvents.prototype.setNice = function setNice( nice )
{
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( typeof nice !== 'number' ) { throw new TypeError( "[nextgen-events] .setNice(): argument #0 should be a number" ) ; }
	
	this.__ngev.nice = Math.floor( nice ) ;
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
	
	if ( ! contextName || typeof contextName !== 'string' ) { throw new TypeError( "[nextgen-events] .addListenerContext(): argument #0 should be a non-empty string" ) ; }
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
	if ( ! contextName || typeof contextName !== 'string' ) { throw new TypeError( "[nextgen-events] .disableListenerContext(): argument #0 should be a non-empty string" ) ; }
	if ( ! this.__ngev.contexts[ contextName ] ) { this.addListenerContext( contextName ) ; }
	
	this.__ngev.contexts[ contextName ].status = NextGenEvents.CONTEXT_DISABLED ;
	
	return this ;
} ;



NextGenEvents.prototype.enableListenerContext = function enableListenerContext( contextName )
{
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! contextName || typeof contextName !== 'string' ) { throw new TypeError( "[nextgen-events] .disableListenerContext(): argument #0 should be a non-empty string" ) ; }
	if ( ! this.__ngev.contexts[ contextName ] ) { this.addListenerContext( contextName ) ; }
	
	this.__ngev.contexts[ contextName ].status = NextGenEvents.CONTEXT_ENABLED ;
	
	if ( this.__ngev.contexts[ contextName ].queue.length > 0 ) { NextGenEvents.processQueue.call( this , contextName ) ; }
	
	return this ;
} ;



NextGenEvents.prototype.queueListenerContext = function queueListenerContext( contextName )
{
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! contextName || typeof contextName !== 'string' ) { throw new TypeError( "[nextgen-events] .disableListenerContext(): argument #0 should be a non-empty string" ) ; }
	if ( ! this.__ngev.contexts[ contextName ] ) { this.addListenerContext( contextName ) ; }
	
	this.__ngev.contexts[ contextName ].status = NextGenEvents.CONTEXT_QUEUED ;
	
	return this ;
} ;



NextGenEvents.prototype.serializeListenerContext = function serializeListenerContext( contextName , value )
{
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! contextName || typeof contextName !== 'string' ) { throw new TypeError( "[nextgen-events] .disableListenerContext(): argument #0 should be a non-empty string" ) ; }
	if ( ! this.__ngev.contexts[ contextName ] ) { this.addListenerContext( contextName ) ; }
	
	this.__ngev.contexts[ contextName ].serial = value === undefined ? true : !! value ;
	
	return this ;
} ;



NextGenEvents.prototype.destroyListenerContext = function destroyListenerContext( contextName )
{
	var i , length , eventName , newListeners , removedListeners = [] ;
	
	if ( ! contextName || typeof contextName !== 'string' ) { throw new TypeError( "[nextgen-events] .disableListenerContext(): argument #0 should be a non-empty string" ) ; }
	
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
NextGenEvents.processQueue = function processQueue( contextName , ready )
{
	var context , job ;
	
	if ( ! this.__ngev.contexts[ contextName ] ) { return ; }
	
	context = this.__ngev.contexts[ contextName ] ;
	
	if ( ready ) { context.ready = true ; }
	else if ( ! context.ready ) { return ; }
	
	// Should work on serialization here
	
	while ( context.queue.length )
	{
		job = context.queue.shift() ;
		
		switch ( job.nice )
		{
			case NextGenEvents.SYNC :
				job.listener.fn.apply( this , job.args ) ;
				break ;
			case NextGenEvents.NEXT_TICK :
				process.nextTick( job.listener.fn.bind( this , job.args ) ) ;
				break ;
			case NextGenEvents.IMMEDIATE :
				setImmediate( job.listener.fn.bind( this , job.args ) ) ;
				break ;
			default :
				if ( job.nice < NextGenEvents.SYNC ) { job.listener.fn.apply( this , job.args ) ; }
				else { setTimeout( job.listener.fn.bind( this , job.args ) , job.nice * 10 ) ; }
				break ;
		}
	}
} ;






