

# NextGen Events

Next generation of events handling for node.js

* License: MIT
* Current status: close to release
* Platform: Node.js and browsers

*NextGen Events* solves common trouble that one may encounter when dealing with events and listeners.

## Feature highlights:

* Standard event-handling almost compatible with Node.js built-in events
* .emit() support a completion callback
* Support for asynchronous event-handling
* Multiple listeners can be tied to a single context
* A context can be temporarly *disabled*
* A context can be in *queue* mode: events for its listeners are stored, they will be *resumed* when the context is enabled again
* Context serialization: async listeners can be run one after the other is fully completed

Emitting events asynchronously or registering a listener that will be triggered asynchronously because it performs
non-critical tasks has some virtues: it gives some breath to the event-loop, so important I/O can be processed as soon as possible.

Contexts are really useful, it handles a collection of listeners.
At first glance, it looks like a sort of namespace for listeners.
But it can do more than that: you can turn a context off, so every listener tied to this context will not be triggered anymore,
then turn it on and they will be available again. 

You can even switch a context into queue mode: the listeners tied to it will not be triggered, but events for those
listeners will be stored in the context. When the context is resumed, all retained events will trigger their listeners.
This allow one to postpone some operations, while performing some other high priority tasks, but be careful:
depending on your application nature, the queue may grow fast and consumes a lot of memory very quickly.

One of the top feature of this lib is the context serialization: it greatly eases the flow of the code!
When differents events can fire at the same time, there are use cases when one does not want that async listener run concurrently.
The context serialization feature will ensure you that no concurrency will happen for listeners tied to it.
You do not have to code fancy or complicated tests to cover all cases anymore: just let *NextGen Events* do it for you!



# Install

Use npm:

```
npm install nextgen-events
```


# Getting started

By the way you can create an event emitter simply by creating a new object, this way:

```js
var NGEmitter = require( 'nextgen-events' ) ;
var emitter = new NGEmitter() ;
```

You can use `var emitter = Object.create( NGEmitter.prototype )` as well, the object does not need the constructor.

But in real life, you would make your own objects inherit it:

```js
var NGEmitter = require( 'nextgen-events' ) ;

function myClass()
{
	// myClass constructor code here
}

myClass.prototype = Object.create( NGEmitter.prototype ) ;
myClass.prototype.constructor = myClass ;	// restore the constructor

// define other methods for myClass...
```

The basis of the event emitter works like Node.js built-in events:

```js
var NGEmitter = require( 'nextgen-events' ) ;
var emitter = new NGEmitter() ;

// Normal listener
emitter.on( 'message' , function( message ) {
	console.log( 'Message received: ' , message ) ;
} ) ;

// One time listener:
emitter.once( 'close' , function() {
	console.log( 'Connection closed!' ) ;
} ) ;

// The error listener: if it is not defined, the error event will throw an exception
emitter.on( 'error' , function( error ) {
	console.log( 'Shit happens: ' , error ) ;
} ) ;

emitter.emit( 'message' , 'Hello world!' ) ;
// ...
```



# References

Node.js documentation:

> When an EventEmitter instance experiences an error, the typical action is to emit an 'error' event.
> Error events are treated as a special case in node. If there is no listener for it,
> then the default action is to print a stack trace and exit the program.

> All EventEmitters emit the event 'newListener' when new listeners are added and 'removeListener' when a listener is removed. 

For the 'newListener' and 'removeListener' events, see the section about [incompatibilities](#incompatibilities), since there
are few differences with the built-in Node.js EventEmitter.



## Table of Content

* [.addListener() / .on()](#ref.addListener)
* [.once()](#ref.once)
* [.removeListener() / .off()](#ref.removeListener)
* [.removeAllListeners()](#ref.removeAllListeners)
* [.setMaxListeners()](#ref.setMaxListeners)
* [.listeners()](#ref.listeners)
* [.listenerCount()](#ref.listenerCount)
* [.setNice()](#ref.setNice)
* [.emit()](#ref.emit)
* [.addListenerContext()](#ref.addListenerContext)
* [.disableListenerContext()](#ref.disableListenerContext)
* [.queueListenerContext()](#ref.queueListenerContext)
* [.enableListenerContext()](#ref.enableListenerContext)
* [.setListenerContextNice()](#ref.setListenerContextNice)
* [.serializeListenerContext()](#ref.serializeListenerContext)
* [.destroyListenerContext()](#ref.destroyListenerContext)
* [the *nice feature*](#ref.note.nice)
* [incompatibilities](#incompatibilities)



<a name="ref.addListener"></a>
### .addListener( eventName , listener )   *or*   .on( eventName , listener )

* eventName `string` the name of the event to bind to
* listener `Function` or `Object` the listener that will listen to this event, it can be a function or an object where:
	* fn `Function` (mandatory) the listener function
	* id `any type` (default to the provided *fn* function) the identifier of the listener, useful if we have to remove it later
	* once `boolean` (default: false) *true* if this is a one-time-listener
	* context `string` (default: undefined - no context) a non-empty string identifying a context, if defined the listener
	  will be tied to this context, if this context is unexistant, it will be implicitly defined with default behaviour
	* nice `integer` (default: -Infinity) see [the nice feature](#ref.note.nice) for details
	* async `boolean` (default: false) set it to *true* if the listener is async by nature and a context serialization is wanted,
	  when *async* is set for a listener, it **MUST** accept a completion callback as its last argument.

Node.js documentation:

> Adds a listener to the end of the listeners array for the specified event.
> No checks are made to see if the listener has already been added.
> Multiple calls passing the same combination of event and listener will result in the listener being added multiple times.

```js
server.on( 'connection' , function( stream ) {
	console.log( 'someone connected!' ) ;
} ) ;
```

> Returns emitter, so calls can be chained.

Example, creating implicitly a context the listeners will be tied to:

```js
server.on( 'connection' , {
	context: 'ctx' ,
	fn: function( stream ) {
		console.log( 'someone connected!' ) ;
	}
} ) ;

server.on( 'close' , {
	context: 'ctx' ,
	fn: function() {
		console.log( 'connection closed!' ) ;
		
		// Destroy the context and all listeners tied to it:
		server.destroyListenerContext( 'ctx' ) ;
	}
} ) ;

server.on( 'error' , {
	context: 'ctx' ,
	fn: function() {
		// some error handling code
		
		// Destroy the context and all listeners tied to it:
		server.destroyListenerContext( 'ctx' ) ;
	}
} ) ;
```

When an async listener is defined, the completion callback is automatically added at the end of the [.emit()](#ref.emit)
arguments for any listeners with *async = true*.



<a name="ref.once"></a>
### .once( eventName , listener )

* eventName `string` the name of the event to bind to
* listener `Function` or `Object` the listener that will listen to this event, it can be a function or an object where:
	* fn `Function` (mandatory) the listener function
	* id `any type` (default to the provided *fn* function) the identifier of the listener, useful if we have to remove it later
	* context `string` (default: undefined - no context) a non-empty string identifying a context, if defined the listener
	  will be tied to this context, if this context is unexistant, it will be implicitly defined with default behaviour
	* nice `integer` (default: -Infinity) see [the nice feature](#ref.note.nice) for details
	* async `boolean` (default: false) set it to *true* if the listener is async by nature and a context serialization is wanted

Node.js documentation:

> Adds a **one time** listener for the event.
> This listener is invoked only the next time the event is fired, after which it is removed. 

```js
server.once( 'connection' , function( stream ) {
	console.log( 'Ah, we have our first user!' ) ;
} ) ;
```

> Returns emitter, so calls can be chained.

Note that using `.once()` in *NextGen Events* lib is just a syntactic sugar (and it's also there for compatibility),
the previous example can be rewritten using `.on()`:

```js
server.on( 'connection' , {
	fn: function( stream ) {
		console.log( 'Ah, we have our first user!' ) ;
	} ,
	once: true
} ) ;
```



<a name="ref.removeListener"></a>
### .removeListener( eventName , listenerID )   *or*   .off( eventName , listenerID )

* eventName `string` the name of the event the listener to remove is binded to
* listenerID `any type` the identifier of the listener to remove

Node.js documentation:

> Remove a listener from the listener array for the specified event.
> **Caution**: changes array indices in the listener array behind the listener. 

```js
var callback = function( stream ) {
	console.log( 'someone connected!' ) ;
} ;

server.on( 'connection' , callback ) ;
// ...
server.removeListener( 'connection' , callback ) ;
```

**CAUTION: Unlike the built-in Node.js emitter**, `.removeListener()` will remove **ALL** listeners whose ID is matching
the given *listenerID*.
If any single listener has been added multiple times to the listener array for the specified event, then only one
call to `.removeListener()` will remove them all.

> Returns emitter, so calls can be chained.

Example using user-defined ID:

```js
var callback = function( stream ) {
	console.log( 'someone connected!' ) ;
} ;

server.on( 'connection' , { id: 'foo' , fn: callback } ) ;
server.on( 'connection' , { id: 'bar' , fn: callback } ) ;

// ...

// Does nothing! we have used custom IDs!
server.removeListener( 'connection' , callback ) ;

// Remove the first listener only, despite the fact they are sharing the same function
server.removeListener( 'connection' , 'foo' ) ;
```

Don't forget that by default, the ID is the callback function itself.



<a name="ref.removeAllListeners"></a>
### .removeAllListeners( [eventName] )

* eventName `string` (optional) the name of the event the listeners to remove are binded to

Node.js documentation:

> Removes all listeners, or those of the specified event.
> It's not a good idea to remove listeners that were added elsewhere in the code, especially when it's on an emitter
> that you didn't create (e.g. sockets or file streams).

> Returns emitter, so calls can be chained.



<a name="ref.setMaxListeners"></a>
### .setMaxListeners()

Only available for compatibility with the built-in Node.js emitter, so it does not break the code for people that want
to make the switch.

But please note that **there is no such concept of max listener in NextGen Events**, this method does nothing
(it's an empty function).



<a name="ref.listeners"></a>
### .listeners( eventName )

* eventName `string` (optional) the name of the event the listeners to list are binded to

Node.js documentation:

> Returns an array of listeners for the specified event.

```js
server.on( 'connection' , function( stream ) {
	console.log( 'someone connected!' ) ;
} ) ;

console.log( util.inspect( server.listeners( 'connection' ) ) ) ;
// output:
// [ { id: [Function], fn: [Function], nice: -Infinity, event: 'connection' } ]
```



<a name="ref.listenerCount"></a>
### .listenerCount( eventName )

* eventName `string` the name of the event

Node.js documentation:

> Returns the number of listeners listening to the type of event.



<a name="ref.setNice"></a>
### .setNice( nice )

* nice `integer` (default: -Infinity) see [the nice feature](#ref.note.nice) for details

Set the default *nice value* of the current emitter.



<a name="ref.emit"></a>
### .emit( [nice] , eventName , [arg1] , [arg2] , [...] , [callback] )

* nice `integer` (default: -Infinity) see [the nice feature](#ref.note.nice) for details
* eventName `string` (optional) the name of the event to emit
* arg1 `any type` (optional) first argument to transmit
* arg2 `any type` (optional) second argument to transmit
* ...
* callback `function` (optional) a completion callback triggered when all listener have done, accepting arguments:
	* interruption `any type` if truthy, then emit was interrupted with this interrupt value (provided by userland)
	* event `Object` representing the current event

It returns an object representing the current event.

Node.js documentation:

> Execute each of the listeners in order with the supplied arguments.

**It does not returns the emitter!**




<a name="ref.note.nice"></a>
### A note about the *nice feature*

The *nice value* represent the *niceness* of the event-emitting processing.
This concept is inspired by the UNIX *nice* concept for processus (see the man page for the *nice* and *renice* command).

In this lib, this represents the asyncness of the event-emitting processing.

The constant `require( 'nextgen-events' ).SYNC` can be used to have synchronous event emitting, its value is `-Infinity`
and it's the default value.

* any nice value *N* greater than or equals to 0 will be emitted asynchronously using setTimeout() with a *N* ms timeout
  to call the listeners
* any nice value *N* lesser than 0 will emit event synchronously until *-N* recursion is reached, after that, setImmediate()
  will be used to call the listeners, the first event count as 1 recursion, so if nice=-1, all events will be asynchronously emitted,
  if nice=-2 the initial event will call the listener synchronously, but if the listener emits events on the same emitter object,
  the sub-listener will be called through setImmediate(), breaking the recursion... and so on...

They are many elements that can define their own *nice value*.

Here is how this is resolved:

* First the *emit nice value* will be the one passed to the `.emit()` method if given, or the default *emitter nice value*
  defined with [.setNice()](#ref.setNice).
* For each listener to be called, the real *nice value* for the current listener will be the **HIGHEST** *nice value* of
  the *emit nice value* (see above), the listener *nice value* (defined with [.addListener()](#ref.addListener)), and
  if the listener is tied to a context, the context *nice value* (defined with [.addListenerContext()](#ref.addListenerContext)
  or [.setListenerContextNice](#ref.setListenerContextNice))



<a name="ref.addListenerContext"></a>
### .addListenerContext( contextName , options )

* contextName `string` a non-empty string identifying the context to be created
* options `Object` an object of options, where:
	* nice `integer` (default: -Infinity) see [the nice feature](#ref.note.nice) for details
	* serial `boolean` (default: false) if true, the async listeners tied to this context will run sequentially,
	  one after the other is fully completed

Create a context using the given *contextName*.

Listeners can be tied to a context, enabling some grouping features like turning them on or off just by enabling/disabling
the context, queuing them, resuming them, or forcing serialization of all async listeners.



<a name="ref.disableListenerContext"></a>
### .disableListenerContext( contextName )

* contextName `string` a non-empty string identifying the context to be created

It disables a context: any listeners tied to it will not be triggered anymore.

The context is not destroyed, the listeners are not removed, they are just inactive.
They can be enabled again using [.enableListenerContext()](#ref.enableListenerContext).



<a name="ref.queueListenerContext"></a>
### .queueListenerContext( contextName )

* contextName `string` a non-empty string identifying the context to be created

It switchs a context into *queue mode*: any listeners tied to it will not be triggered anymore, but every listener's call
will be queued.

When the context will be enabled again using [.enableListenerContext()](#ref.enableListenerContext), any queued listener's call
will be processed.



<a name="ref.enableListenerContext"></a>
### .enableListenerContext( contextName )

* contextName `string` a non-empty string identifying the context to be created

This enables a context previously disabled using [.disableListenerContext()](#ref.disableListenerContext) or queued
using [.disableListenerContext()](#ref.disableListenerContext).

If the context was queued, any queued listener's call will be processed right now for synchronous emitter, or a bit later
depending on the *nice value*. E.g. if a listener would have been called with a timeout of 50 ms (nice value = 5),
and the call has been queued, the timeout will apply at resume time.



<a name="ref.setListenerContextNice"></a>
### .setListenerContextNice( contextName , nice )

* contextName `string` a non-empty string identifying the context to be created
* nice `integer` (default: -Infinity) see [the nice feature](#ref.note.nice) for details

Set the *nice* value for the current context.



<a name="ref.serializeListenerContext"></a>
### .serializeListenerContext( contextName , [value] )

* contextName `string` a non-empty string identifying the context to be created
* value `boolean` (optional, default is true) if *true* the context will enable serialization for async listeners.

This is one of the top feature of this lib.

If set to *true* it enables the context serialization.

It has no effect on listeners defined without the *async* option (see [.addListener()](#ref.addListener)).
Listeners defined with the async option will postpone any other listener's calls part of the same context.
Those calls will be queued until the completion callback of the listener is triggered.

Example:

```js
app.on( 'maintenance' , {
	context: 'maintenanceHandlers' ,
	async: true ,
	fn: function( type , done ) {
		performSomeCriticalAsyncStuff( function() {
			console.log( 'Critical maintenance stuff finished' ) ;
			done() ;
		} ) ;
	}
} ) ;

app.serializeListenerContext( maintenanceHandlers ) ;

// ...

app.emit( 'maintenance' , 'doBackup' ) ;

// Despite the fact we emit synchronously, the listener will not be called now,
// it will be queued and called later when the previous call will be finished
app.emit( 'maintenance' , 'doUpgrade' ) ;
```

By the way, there is only one listener here that will queue itself, and only one event type is fired.
But this would work the same with multiple listener and event type, if they share the same context.

Same code with two listeners and two event type:

```js
app.on( 'doBackup' , {
	context: 'maintenanceHandlers' ,
	async: true ,
	fn: function( done ) {
		performBackup( function() {
			console.log( 'Backup finished' ) ;
			done() ;
		} ) ;
	}
} ) ;

app.on( 'doUpgrade' , {
	context: 'maintenanceHandlers' ,
	async: true ,
	fn: function( done ) {
		performUpgrade( function() {
			console.log( 'Upgrade finished' ) ;
			done() ;
		} ) ;
	}
} ) ;

app.on( 'whatever' , function() {
	// Some actions...
} ) ;

app.serializeListenerContext( maintenanceHandlers ) ;

// ...

app.emit( 'doBackup' ) ;

// Despite the fact we emit synchronously, the second listener will not be called now,
// it will be queued and called later when the first listener will have finished its job
app.emit( 'doUpgrade' ) ;

// The third listener is not part of the 'maintenanceHandlers' context, so it will be called
// right now, before the first listener finished, and before the second listener ever start
app.emit( 'whatever' ) ;
```



<a name="ref.destroyListenerContext"></a>
### .destroyListenerContext( contextName )

* contextName `string` a non-empty string identifying the context to be created

This destroy a context and remove all listeners tied to it.

Any queued listener's calls will be lost.



<a name="incompatibilities"></a>
## Incompatibilities with the built-in Node.js EventEmitter

NextGen Events is almost compatible with Node.js' EventEmitter, except for few things:

* .emit() does not return the emitter, but an object representing the current event.

* If the last argument passed to .emit() is a function, it is not passed to listeners, instead it is a completion callback
  triggered when all listeners have done their job. If one want to pass function to listeners as the final argument, it is easy
  to add an extra `null` or `undefined` argument to .emit().

* There is more reserved event name: 'interrupt', 'emitted'.

* There is no such concept of *max listener* in NextGen Events, .setMaxListeners() function exists only to not break compatibility
  for people that want to make the switch, but it does nothing (it's an empty function).

* .removeListener() will remove all matching listener, not only the first listener found.

* 'newListener'/'removeListener' event listener will receive an array of new/removed *listener object*, instead of only one
  *listener function*.
  E.g: it will be fired only once by when .removeListener() or .removeAllListener() is invoked and multiple listeners are deleted.
  A *listener object* contains a property called 'fn' that hold the actual *listener function*.

* `.removeAllListeners()` without any argument does not trigger 'removeListener' listener, because there are actually removed too.
  The same apply to `.removeAllListeners( 'removeListener' )`.

* .listeners() same here: rather than providing an array of *listener function* an array of *listener object* is provided.



