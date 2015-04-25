

# NextGen Events

Next generation of events handling for node.js

* License: MIT
* Current status: beta
* Platform: Node.js only (browser support is planned)

*NextGen Events* solves common trouble that one may encounter when dealing with events and listeners.

## Feature highlights:

* Standard event-handling almost compatible with Node.js built-in events
* Support for asynchronous event-handling
* Multiple listeners can be tied to a single context
* A context can be temporarly *disabled*
* A context can be in *queue* mode: events for its listener are stored, they will be *released* when the context is resumed
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

One of the top feature of this lib is the context serialization: it greatly ease the flow of the code!
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

**The documentation is still a work in progress!**



### .addListener( eventName , listener ) / .on( eventName , listener )

* eventName `string` the name of the event to bind to
* listener `Function` or `Object` the listener that will listen to this event, it can be a function or an object where:
	* fn `Function` (mandatory) the listener function
	* id *any type* (default to the provided *fn* function) the identifier of the listener, useful if we have to remove it later
	* once `boolean` (default: false) *true* if this is a one-time-listener
	* context `string` (default: undefined - no context) a non-empty string identifying a context, if defined the listener
	  will be tied to this context, if this context is unexistant, it will be implicitly defined with default behaviour
	* nice `integer` (default: .SYNC - a constant set to -3) see [.setNice()](#ref.setNice) for details,
	  and [the constants section](#ref.constants) for more human readable symbols
	* async `boolean` (default: false) set it to *true* if the listener is async by nature and a context serialization is wanted

	Adds a listener to the end of the listeners array for the specified event.
	No checks are made to see if the listener has already been added.
	Multiple calls passing the same combination of event and listener will result in the listener being added multiple times.



<a name="ref.setNice"></a>
### .setNice( nice )

Globally set the *nice* value of the current emitter.



<a name="ref.constants"></a>
### .setNice( nice )

Globally set the *nice* value of the current emitter.




### Incompatibilities with the built-in Node.js EventEmitter

NextGen events is most of time compatible with Node.js' EventEmitter, except for few things:

* There is no such concept of *max listener* in NextGen Events, .setMaxListeners() function exists only to not break compatibility,
  but it does nothing (it's an empty method).

* .removeListener() will remove all matching listener, not only the first listener found

* 'newListener'/'removeListener' event listener will receive an array of new/removed *listener object*, instead of only one
  *listener function*.
  E.g: it will be fired only once by when .removeListener() or .removeAllListener() is invoked and multiple listeners are deleted.
  A *listener object* contains a property called 'fn' that hold the actual *listener function*.

* `.removeAllListeners()` without any argument does not trigger 'removeListener' listener, because there are actually removed too.
  The same apply to `.removeAllListeners( 'removeListener' )`.

* .listeners() same here: rather than providing an array of *listener function* an array of *listener object* is provided.



