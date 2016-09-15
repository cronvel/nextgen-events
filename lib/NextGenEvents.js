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



function NextGenEvents() { return Object.create( NextGenEvents.prototype ) ; }
module.exports = NextGenEvents ;
NextGenEvents.prototype.__prototypeUID__ = 'nextgen-events/NextGenEvents' ;
NextGenEvents.prototype.__prototypeVersion__ = require( '../package.json' ).version ;

			/* Basic features, more or less compatible with Node.js */



NextGenEvents.SYNC = -Infinity ;

// Not part of the prototype, because it should not pollute userland's prototype.
// It has an eventEmitter as 'this' anyway (always called using call()).
NextGenEvents.init = function init()
{
	Object.defineProperty( this , '__ngev' , {
		configurable: true ,
		value: {
			nice: NextGenEvents.SYNC ,
			interruptible: false ,
			recursion: 0 ,
			contexts: {} ,
			
			// States by events
			states: {} ,
			
			// State groups by events
			stateGroups: {} ,
			
			// Listeners by events
			listeners: {
				// Special events
				error: [] ,
				interrupt: [] ,
				newListener: [] ,
				removeListener: []
			}
		}
	} ) ;
} ;



// Use it with .bind()
NextGenEvents.filterOutCallback = function( what , currentElement ) { return what !== currentElement ; } ;



// .addListener( eventName , [fn] , [options] )
NextGenEvents.prototype.addListener = function addListener( eventName , fn , options )
{
	var listener = {} , newListenerListeners ;
	
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! this.__ngev.listeners[ eventName ] ) { this.__ngev.listeners[ eventName ] = [] ; }
	
	if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( ".addListener(): argument #0 should be a non-empty string" ) ; }
	if ( typeof fn !== 'function' ) { options = fn ; fn = undefined ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	listener.fn = fn || options.fn ;
	listener.id = options.id !== undefined ? options.id : listener.fn ;
	listener.once = !! options.once ;
	listener.async = !! options.async ;
	listener.eventObject = !! options.eventObject ;
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
	
	if ( this.__ngev.listeners.newListener.length )
	{
		// Extra care should be taken with the 'newListener' event, we should avoid recursion
		// in the case that eventName === 'newListener', but inside a 'newListener' listener,
		// .listenerCount() should report correctly
		newListenerListeners = this.__ngev.listeners.newListener.slice() ;
		
		this.__ngev.listeners[ eventName ].push( listener ) ;
		
		// Return an array, because one day, .addListener() may support multiple event addition at once,
		// e.g.: .addListener( { request: onRequest, close: onClose, error: onError } ) ;
		NextGenEvents.emitEvent( {
			emitter: this ,
			name: 'newListener' ,
			args: [ [ listener ] ] ,
			listeners: newListenerListeners
		} ) ;
		
		if ( this.__ngev.states[ eventName ] ) { NextGenEvents.emitToOneListener( this.__ngev.states[ eventName ] , listener ) ; }
		
		return this ;
	}
	
	this.__ngev.listeners[ eventName ].push( listener ) ;
	
	if ( this.__ngev.states[ eventName ] ) { NextGenEvents.emitToOneListener( this.__ngev.states[ eventName ] , listener ) ; }
	
	return this ;
} ;

NextGenEvents.prototype.on = NextGenEvents.prototype.addListener ;



// Shortcut
// .once( eventName , [fn] , [options] )
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
	if ( ! this.__ngev.listeners[ eventName ] ) { this.__ngev.listeners[ eventName ] = [] ; }
	
	length = this.__ngev.listeners[ eventName ].length ;
	
	// It's probably faster to create a new array of listeners
	for ( i = 0 ; i < length ; i ++ )
	{
		if ( this.__ngev.listeners[ eventName ][ i ].id === id )
		{
			removedListeners.push( this.__ngev.listeners[ eventName ][ i ] ) ;
		}
		else
		{
			newListeners.push( this.__ngev.listeners[ eventName ][ i ] ) ;
		}
	}
	
	this.__ngev.listeners[ eventName ] = newListeners ;
	
	if ( removedListeners.length && this.__ngev.listeners.removeListener.length )
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
		
		if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( ".removeAllListeners(): argument #0 should be undefined or a non-empty string" ) ; }
		
		if ( ! this.__ngev.listeners[ eventName ] ) { this.__ngev.listeners[ eventName ] = [] ; }
		
		removedListeners = this.__ngev.listeners[ eventName ] ;
		this.__ngev.listeners[ eventName ] = [] ;
		
		if ( removedListeners.length && this.__ngev.listeners.removeListener.length )
		{
			this.emit( 'removeListener' , removedListeners ) ;
		}
	}
	else
	{
		// Remove all listeners for any events
		// 'removeListener' listeners cannot be triggered: they are already deleted
		this.__ngev.listeners = {} ;
	}
	
	return this ;
} ;



NextGenEvents.listenerWrapper = function listenerWrapper( listener , event , context )
{
	var returnValue , serial , listenerCallback ;
	
	if ( event.interrupt ) { return ; }
	
	if ( listener.async )
	{
		//serial = context && context.serial ;
		if ( context )
		{
			serial = context.serial ;
			context.ready = ! serial ;
		}
		
		listenerCallback = function( arg ) {
			
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
			else if ( event.listenersDone >= event.listeners.length && event.callback )
			{
				event.callback( undefined , event ) ;
				delete event.callback ;
			}
			
			// Process the queue if serialized
			if ( serial ) { NextGenEvents.processQueue.call( event.emitter , listener.context , true ) ; }
			
		} ;
		
		if ( listener.eventObject ) { listener.fn( event , listenerCallback ) ; }
		else { returnValue = listener.fn.apply( undefined , event.args.concat( listenerCallback ) ) ; }
	}
	else
	{
		if ( listener.eventObject ) { listener.fn( event ) ; }
		else { returnValue = listener.fn.apply( undefined , event.args ) ; }
		
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
	else if ( event.listenersDone >= event.listeners.length && event.callback )
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
	var event ;
	
	event = { emitter: this } ;
	
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
		//event.nice = this.__ngev.nice ;
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
	
	return NextGenEvents.emitEvent( event ) ;
} ;



/*
	At this stage, 'event' should be an object having those properties:
		* emitter: the event emitter
		* name: the event name
		* args: array, the arguments of the event
		* nice: (optional) nice value
		* callback: (optional) a callback for emit
		* listeners: (optional) override the listeners array stored in __ngev
*/
NextGenEvents.emitEvent = function emitEvent( event )
{
	var self = event.emitter ,
		i , iMax , count = 0 , state , removedListeners ;
	
	if ( ! self.__ngev ) { NextGenEvents.init.call( self ) ; }
	
	state = self.__ngev.states[ event.name ] ;
	
	// This is a state event, register it now!
	if ( state !== undefined )
	{
		
		if ( state && event.args.length === state.args.length &&
			event.args.every( function( arg , index ) { return arg === state.args[ index ] ; } ) )
		{
			// The emitter is already in this exact state, skip it now!
			return ;
		}
		
		// Unset all states of that group
		self.__ngev.stateGroups[ event.name ].forEach( function( eventName ) {
			self.__ngev.states[ eventName ] = null ;
		} ) ;
		
		self.__ngev.states[ event.name ] = event ;
	}
	
	if ( ! self.__ngev.listeners[ event.name ] ) { self.__ngev.listeners[ event.name ] = [] ; }
	
	event.id = nextEventId ++ ;
	event.listenersDone = 0 ;
	event.once = !! event.once ;
	
	if ( event.nice === undefined || event.nice === null ) { event.nice = self.__ngev.nice ; }
	
	// Trouble arise when a listener is removed from another listener, while we are still in the loop.
	// So we have to COPY the listener array right now!
	if ( ! event.listeners ) { event.listeners = self.__ngev.listeners[ event.name ].slice() ; }
	
	// Increment self.__ngev.recursion
	self.__ngev.recursion ++ ;
	removedListeners = [] ;
	
	// Emit the event to all listeners!
	for ( i = 0 , iMax = event.listeners.length ; i < iMax ; i ++ )
	{
		count ++ ;
		NextGenEvents.emitToOneListener( event , event.listeners[ i ] , removedListeners ) ;
	}
	
	// Decrement recursion
	self.__ngev.recursion -- ;
	
	// Emit 'removeListener' after calling listeners
	if ( removedListeners.length && self.__ngev.listeners.removeListener.length )
	{
		self.emit( 'removeListener' , removedListeners ) ;
	}
	
	
	// 'error' event is a special case: it should be listened for, or it will throw an error
	if ( ! count )
	{
		if ( event.name === 'error' )
		{
			if ( event.args[ 0 ] ) { throw event.args[ 0 ] ; }
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



// If removedListeners is not given, then one-time listener emit the 'removeListener' event,
// if given: that's the caller business to do it
NextGenEvents.emitToOneListener = function emitToOneListener( event , listener , removedListeners )
{	
	var self = event.emitter ,
		context , currentNice , emitRemoveListener = false ;
	
	context = listener.context && self.__ngev.contexts[ listener.context ] ;
	
	// If the listener context is disabled...
	if ( context && context.status === NextGenEvents.CONTEXT_DISABLED ) { return ; }
	
	// The nice value for this listener...
	if ( context ) { currentNice = Math.max( event.nice , listener.nice , context.nice ) ; }
	else { currentNice = Math.max( event.nice , listener.nice ) ; }
	
	
	if ( listener.once )
	{
		// We should remove the current listener RIGHT NOW because of recursive .emit() issues:
		// one listener may eventually fire this very same event synchronously during the current loop.
		self.__ngev.listeners[ event.name ] = self.__ngev.listeners[ event.name ].filter(
			NextGenEvents.filterOutCallback.bind( undefined , listener )
		) ;
		
		if ( removedListeners ) { removedListeners.push( listener ) ; }
		else { emitRemoveListener = true ; }
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
				if ( self.__ngev.recursion >= - currentNice )
				{
					setImmediate( NextGenEvents.listenerWrapper.bind( self , listener , event , context ) ) ;
				}
				else
				{
					NextGenEvents.listenerWrapper.call( self , listener , event , context ) ;
				}
			}
			else
			{
				setTimeout( NextGenEvents.listenerWrapper.bind( self , listener , event , context ) , currentNice ) ;
			}
		}
		catch ( error ) {
			// Catch error, just to decrement self.__ngev.recursion, re-throw after that...
			self.__ngev.recursion -- ;
			throw error ;
		}
	}
	
	// Emit 'removeListener' after calling the listener
	if ( emitRemoveListener && self.__ngev.listeners.removeListener.length )
	{
		self.emit( 'removeListener' , [ listener ] ) ;
	}
} ;



NextGenEvents.prototype.listeners = function listeners( eventName )
{
	if ( ! eventName || typeof eventName !== 'string' ) { throw new TypeError( ".listeners(): argument #0 should be a non-empty string" ) ; }
	
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	if ( ! this.__ngev.listeners[ eventName ] ) { this.__ngev.listeners[ eventName ] = [] ; }
	
	// Do not return the array, shallow copy it
	return this.__ngev.listeners[ eventName ].slice() ;
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
	if ( ! this.__ngev.listeners[ eventName ] ) { this.__ngev.listeners[ eventName ] = [] ; }
	
	return this.__ngev.listeners[ eventName ].length ;
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



// Make two objects sharing the same event bus
NextGenEvents.share = function( source , target )
{
	if ( ! ( source instanceof NextGenEvents ) || ! ( target instanceof NextGenEvents ) )
	{
		throw new TypeError( 'NextGenEvents.share() arguments should be instances of NextGenEvents' ) ;
	}
	
	if ( ! source.__ngev ) { NextGenEvents.init.call( source ) ; }
	
	Object.defineProperty( target , '__ngev' , {
		configurable: true ,
		value: source.__ngev
	} ) ;
} ;



NextGenEvents.reset = function reset( emitter )
{
	Object.defineProperty( emitter , '__ngev' , {
        configurable: true ,
        value: null
	} ) ;
} ;



// There is no such thing in NextGenEvents, however, we need to be compatible with node.js events at best
NextGenEvents.prototype.setMaxListeners = function() {} ;

// Sometime useful as a no-op callback...
NextGenEvents.noop = function() {} ;





			/* Next Gen feature: states! */



// .defineStates( exclusiveState1 , [exclusiveState2] , [exclusiveState3] , ... )
NextGenEvents.prototype.defineStates = function defineStates()
{
	var self = this ,
		states = Array.prototype.slice.call( arguments ) ;
	
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	
	states.forEach( function( state ) {
		self.__ngev.states[ state ] = null ;
		self.__ngev.stateGroups[ state ] = states ;
	} ) ;
} ;



NextGenEvents.prototype.hasState = function hasState( state )
{
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	return !! this.__ngev.states[ state ] ;
} ;



NextGenEvents.prototype.getAllStates = function getAllStates()
{
	var self = this ;
	if ( ! this.__ngev ) { NextGenEvents.init.call( this ) ; }
	return Object.keys( this.__ngev.states ).filter( function( e ) { return self.__ngev.states[ e ] ; } ) ;
} ;





			/* Next Gen feature: groups! */



NextGenEvents.groupAddListener = function groupAddListener( emitters , eventName , fn , options )
{
	// Manage arguments
	if ( typeof fn !== 'function' ) { options = fn ; fn = undefined ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	fn = fn || options.fn ;
	delete options.fn ;
	
	// Preserve the listener ID, so groupRemoveListener() will work as expected
	options.id = options.id || fn ;
	
	emitters.forEach( function( emitter ) {
		emitter.addListener( eventName , fn.bind( undefined , emitter ) , options ) ;
	} ) ;
} ;

NextGenEvents.groupOn = NextGenEvents.groupAddListener ;



// Once per emitter
NextGenEvents.groupOnce = function groupOnce( emitters , eventName , fn , options )
{
	if ( fn && typeof fn === 'object' ) { fn.once = true ; }
	else if ( options && typeof options === 'object' ) { options.once = true ; }
	else { options = { once: true } ; }
	
	return this.groupAddListener( emitters , eventName , fn , options ) ;
} ;



// Globally once, only one event could be emitted, by the first emitter to emit
NextGenEvents.groupGlobalOnce = function groupGlobalOnce( emitters , eventName , fn , options )
{
	var fnWrapper , triggered = false ;
	
	// Manage arguments
	if ( typeof fn !== 'function' ) { options = fn ; fn = undefined ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	fn = fn || options.fn ;
	delete options.fn ;
	
	// Preserve the listener ID, so groupRemoveListener() will work as expected
	options.id = options.id || fn ;
	
	fnWrapper = function() {
		if ( triggered ) { return ; }
		triggered = true ;
		NextGenEvents.groupRemoveListener( emitters , eventName , options.id ) ;
		fn.apply( undefined , arguments ) ;
	} ;
	
	emitters.forEach( function( emitter ) {
		emitter.once( eventName , fnWrapper.bind( undefined , emitter ) , options ) ;
	} ) ;
} ;



// Globally once, only one event could be emitted, by the last emitter to emit
NextGenEvents.groupGlobalOnceAll = function groupGlobalOnceAll( emitters , eventName , fn , options )
{
	var fnWrapper , triggered = false , count = emitters.length ;
	
	// Manage arguments
	if ( typeof fn !== 'function' ) { options = fn ; fn = undefined ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	fn = fn || options.fn ;
	delete options.fn ;
	
	// Preserve the listener ID, so groupRemoveListener() will work as expected
	options.id = options.id || fn ;
	
	fnWrapper = function() {
		if ( triggered ) { return ; }
		if ( -- count ) { return ; }
		
		// So this is the last emitter...
		
		triggered = true ;
		// No need to remove listeners: there are already removed anyway
		//NextGenEvents.groupRemoveListener( emitters , eventName , options.id ) ;
		fn.apply( undefined , arguments ) ;
	} ;
	
	emitters.forEach( function( emitter ) {
		emitter.once( eventName , fnWrapper.bind( undefined , emitter ) , options ) ;
	} ) ;
} ;



NextGenEvents.groupRemoveListener = function groupRemoveListener( emitters , eventName , id )
{
	emitters.forEach( function( emitter ) {
		emitter.removeListener( eventName , id ) ;
	} ) ;
} ;

NextGenEvents.groupOff = NextGenEvents.groupRemoveListener ;



NextGenEvents.groupRemoveAllListeners = function groupRemoveAllListeners( emitters , eventName )
{
	emitters.forEach( function( emitter ) {
		emitter.removeAllListeners( eventName ) ;
	} ) ;
} ;



NextGenEvents.groupEmit = function groupEmit( emitters )
{
	var eventName , nice , argStart = 2 , argEnd , args , count = emitters.length ,
		callback , callbackWrapper , callbackTriggered = false ;
	
	if ( typeof arguments[ arguments.length - 1 ] === 'function' )
	{
		argEnd = -1 ;
		callback = arguments[ arguments.length - 1 ] ;
		
		callbackWrapper = function( interruption ) {
			if ( callbackTriggered ) { return ; }
			
			if ( interruption )
			{
				callbackTriggered = true ;
				callback( interruption ) ;
			}
			else if ( ! -- count )
			{
				callbackTriggered = true ;
				callback() ;
			}
		} ;
	}
	
	if ( typeof arguments[ 1 ] === 'number' )
	{
		argStart = 3 ;
		nice = typeof arguments[ 1 ] ;
	}
	
	eventName = arguments[ argStart - 1 ] ;
	args = Array.prototype.slice.call( arguments , argStart , argEnd ) ;
	
	emitters.forEach( function( emitter ) {
		NextGenEvents.emitEvent( {
			emitter: emitter ,
			name: eventName ,
			args: args ,
			nice: nice ,
			callback: callbackWrapper
		} ) ;
	} ) ;
} ;



NextGenEvents.groupDefineStates = function groupDefineStates( emitters )
{
	var args = Array.prototype.slice.call( arguments , 1 ) ;
	
	emitters.forEach( function( emitter ) {
		emitter.defineStates.apply( emitter , args ) ;
	} ) ;
} ;





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
	
	for ( eventName in this.__ngev.listeners )
	{
		newListeners = null ;
		length = this.__ngev.listeners[ eventName ].length ;
		
		for ( i = 0 ; i < length ; i ++ )
		{
			if ( this.__ngev.listeners[ eventName ][ i ].context === contextName )
			{
				newListeners = [] ;
				removedListeners.push( this.__ngev.listeners[ eventName ][ i ] ) ;
			}
			else if ( newListeners )
			{
				newListeners.push( this.__ngev.listeners[ eventName ][ i ] ) ;
			}
		}
		
		if ( newListeners ) { this.__ngev.listeners[ eventName ] = newListeners ; }
	}
	
	if ( this.__ngev.contexts[ contextName ] ) { delete this.__ngev.contexts[ contextName ] ; }
	
	if ( removedListeners.length && this.__ngev.listeners.removeListener.length )
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



if ( global.AsyncTryCatch )
{
	NextGenEvents.prototype.asyncTryCatchId = global.AsyncTryCatch.NextGenEvents.length ;
	global.AsyncTryCatch.NextGenEvents.push( NextGenEvents ) ;
	
	if ( global.AsyncTryCatch.substituted )
	{
		//console.log( 'live subsitute' ) ;
		global.AsyncTryCatch.substitute() ;
	}
}



// Load Proxy AT THE END (circular require)
NextGenEvents.Proxy = require( './Proxy.js' ) ;

