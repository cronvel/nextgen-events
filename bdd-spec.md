# TOC
   - [Basic synchronous event-emitting (node-compatible)](#basic-synchronous-event-emitting-node-compatible)
   - [Basic synchronous event-emitting (NOT compatible with node)](#basic-synchronous-event-emitting-not-compatible-with-node)
<a name=""></a>
 
<a name="basic-synchronous-event-emitting-node-compatible"></a>
# Basic synchronous event-emitting (node-compatible)
should add one listener and emit should trigger it, using 'new'.

```js
var bus = new NextGenEvents() ;

var triggered = 0 ;

bus.on( 'hello' , function() { triggered ++ ; } ) ;

bus.emit( 'hello' ) ;

expect( triggered ).to.be( 1 ) ;
```

should add one listener and emit should trigger it, using 'Object.create()'.

```js
var bus = Object.create( NextGenEvents.prototype ) ;

var triggered = 0 ;

bus.on( 'hello' , function() { triggered ++ ; } ) ;

bus.emit( 'hello' ) ;

expect( triggered ).to.be( 1 ) ;
```

should add many basic listeners for many events, and multiple emits should trigger only relevant listener.

```js
var bus = Object.create( NextGenEvents.prototype ) ;

var onFoo1 , onBar1 , onBar2 , onBaz1 , onBaz2 , onBaz3 ;
var triggered = { foo1: 0 , bar1: 0 , bar2: 0 , baz1: 0 , baz2: 0 , baz3: 0 , qux: 0 } ;

// 1 listener for 'foo'
bus.on( 'foo' , onFoo1 = function() { triggered.foo1 ++ ; } ) ;

// 2 listeners for 'bar'
bus.on( 'bar' , onBar1 = function() { triggered.bar1 ++ ; } ) ;
bus.on( 'bar' , onBar2 = function() { triggered.bar2 ++ ; } ) ;

// 3 listeners for 'baz'
bus.on( 'baz' , onBaz1 = function() { triggered.baz1 ++ ; } ) ;
bus.on( 'baz' , onBaz2 = function() { triggered.baz2 ++ ; } ) ;
bus.on( 'baz' , onBaz3 = function() { triggered.baz3 ++ ; } ) ;

bus.emit( 'foo' ) ;
expect( triggered ).to.eql( { foo1: 1 , bar1: 0 , bar2: 0 , baz1: 0 , baz2: 0 , baz3: 0 , qux: 0 } ) ;

bus.emit( 'bar' ) ;
expect( triggered ).to.eql( { foo1: 1 , bar1: 1 , bar2: 1 , baz1: 0 , baz2: 0 , baz3: 0 , qux: 0 } ) ;

bus.emit( 'baz' ) ;
expect( triggered ).to.eql( { foo1: 1 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 1 , baz3: 1 , qux: 0 } ) ;

bus.emit( 'qux' ) ;
expect( triggered ).to.eql( { foo1: 1 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 1 , baz3: 1 , qux: 0 } ) ;

bus.emit( 'foo' ) ;
bus.emit( 'foo' ) ;
expect( triggered ).to.eql( { foo1: 3 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 1 , baz3: 1 , qux: 0 } ) ;

bus.emit( 'qux' ) ;
bus.emit( 'qux' ) ;
expect( triggered ).to.eql( { foo1: 3 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 1 , baz3: 1 , qux: 0 } ) ;

bus.emit( 'baz' ) ;
bus.emit( 'baz' ) ;
expect( triggered ).to.eql( { foo1: 3 , bar1: 1 , bar2: 1 , baz1: 3 , baz2: 3 , baz3: 3 , qux: 0 } ) ;
```

should add and remove listeners.

```js
var bus = Object.create( NextGenEvents.prototype ) ;

var onFoo1 , onBar1 , onBar2 , onBaz1 , onBaz2 , onBaz3 ;
var triggered = { foo1: 0 , bar1: 0 , bar2: 0 , baz1: 0 , baz2: 0 , baz3: 0 , qux: 0 } ;

// 1 listener for 'foo'
bus.on( 'foo' , onFoo1 = function() { triggered.foo1 ++ ; } ) ;

// 2 listeners for 'bar'
bus.on( 'bar' , onBar1 = function() { triggered.bar1 ++ ; } ) ;
bus.on( 'bar' , onBar2 = function() { triggered.bar2 ++ ; } ) ;

// 3 listeners for 'baz'
bus.on( 'baz' , onBaz1 = function() { triggered.baz1 ++ ; } ) ;
bus.on( 'baz' , onBaz2 = function() { triggered.baz2 ++ ; } ) ;
bus.on( 'baz' , onBaz3 = function() { triggered.baz3 ++ ; } ) ;

bus.emit( 'foo' ) ;
expect( triggered ).to.eql( { foo1: 1 , bar1: 0 , bar2: 0 , baz1: 0 , baz2: 0 , baz3: 0 , qux: 0 } ) ;

bus.emit( 'bar' ) ;
expect( triggered ).to.eql( { foo1: 1 , bar1: 1 , bar2: 1 , baz1: 0 , baz2: 0 , baz3: 0 , qux: 0 } ) ;

bus.removeListener( 'bar' , onBar2 ) ;
bus.emit( 'bar' ) ;
expect( triggered ).to.eql( { foo1: 1 , bar1: 2 , bar2: 1 , baz1: 0 , baz2: 0 , baz3: 0 , qux: 0 } ) ;

bus.removeListener( 'bar' , onBar2 ) ;
bus.emit( 'bar' ) ;
expect( triggered ).to.eql( { foo1: 1 , bar1: 3 , bar2: 1 , baz1: 0 , baz2: 0 , baz3: 0 , qux: 0 } ) ;

bus.removeListener( 'foo' , onBar1 ) ; // Not listening for this event!
bus.removeListener( 'bar' , function() {} ) ; // Not event registered
bus.emit( 'foo' ) ;
bus.emit( 'bar' ) ;
expect( triggered ).to.eql( { foo1: 2 , bar1: 4 , bar2: 1 , baz1: 0 , baz2: 0 , baz3: 0 , qux: 0 } ) ;
```

.removeAllListeners() should remove all listeners for an event.

```js
var bus = Object.create( NextGenEvents.prototype ) ;

var onFoo1 , onBar1 , onBar2 , onBaz1 , onBaz2 , onBaz3 ;
var triggered = { foo1: 0 , bar1: 0 , bar2: 0 , baz1: 0 , baz2: 0 , baz3: 0 , qux: 0 } ;

// 1 listener for 'foo'
bus.on( 'foo' , onFoo1 = function() { triggered.foo1 ++ ; } ) ;

// 2 listeners for 'bar'
bus.on( 'bar' , onBar1 = function() { triggered.bar1 ++ ; } ) ;
bus.on( 'bar' , onBar2 = function() { triggered.bar2 ++ ; } ) ;

// 3 listeners for 'baz'
bus.on( 'baz' , onBaz1 = function() { triggered.baz1 ++ ; } ) ;
bus.on( 'baz' , onBaz2 = function() { triggered.baz2 ++ ; } ) ;
bus.on( 'baz' , onBaz3 = function() { triggered.baz3 ++ ; } ) ;

bus.emit( 'foo' ) ;
bus.emit( 'bar' ) ;
bus.emit( 'baz' ) ;
expect( triggered ).to.eql( { foo1: 1 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 1 , baz3: 1 , qux: 0 } ) ;

bus.removeAllListeners( 'bar' ) ;
bus.emit( 'bar' ) ;
expect( triggered ).to.eql( { foo1: 1 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 1 , baz3: 1 , qux: 0 } ) ;

bus.emit( 'foo' ) ;
expect( triggered ).to.eql( { foo1: 2 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 1 , baz3: 1 , qux: 0 } ) ;

bus.removeAllListeners( 'baz' ) ;
bus.emit( 'foo' ) ;
bus.emit( 'bar' ) ;
bus.emit( 'baz' ) ;
expect( triggered ).to.eql( { foo1: 3 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 1 , baz3: 1 , qux: 0 } ) ;
```

.removeAllListeners() without argument should all listeners for all events.

```js
var bus = Object.create( NextGenEvents.prototype ) ;

var onFoo1 , onBar1 , onBar2 , onBaz1 , onBaz2 , onBaz3 ;
var triggered = { foo1: 0 , bar1: 0 , bar2: 0 , baz1: 0 , baz2: 0 , baz3: 0 , qux: 0 } ;

// 1 listener for 'foo'
bus.on( 'foo' , onFoo1 = function() { triggered.foo1 ++ ; } ) ;

// 2 listeners for 'bar'
bus.on( 'bar' , onBar1 = function() { triggered.bar1 ++ ; } ) ;
bus.on( 'bar' , onBar2 = function() { triggered.bar2 ++ ; } ) ;

// 3 listeners for 'baz'
bus.on( 'baz' , onBaz1 = function() { triggered.baz1 ++ ; } ) ;
bus.on( 'baz' , onBaz2 = function() { triggered.baz2 ++ ; } ) ;
bus.on( 'baz' , onBaz3 = function() { triggered.baz3 ++ ; } ) ;

bus.emit( 'foo' ) ;
bus.emit( 'bar' ) ;
bus.emit( 'baz' ) ;
expect( triggered ).to.eql( { foo1: 1 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 1 , baz3: 1 , qux: 0 } ) ;

bus.removeAllListeners() ;
bus.emit( 'foo' ) ;
bus.emit( 'bar' ) ;
bus.emit( 'baz' ) ;
bus.emit( 'qux' ) ;
expect( triggered ).to.eql( { foo1: 1 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 1 , baz3: 1 , qux: 0 } ) ;
```

.once() should add one time listener for an event, the event should stop listening after being triggered once.

```js
var bus = Object.create( NextGenEvents.prototype ) ;

var onFoo1 , onBar1 , onBar2 , onBaz1 , onBaz2 , onBaz3 ;
var triggered = { foo1: 0 , bar1: 0 , bar2: 0 , baz1: 0 , baz2: 0 , qux: 0 } ;

// 1 listener for 'foo'
bus.once( 'foo' , onFoo1 = function() { triggered.foo1 ++ ; } ) ;

// 2 listeners for 'bar'
bus.on( 'bar' , onBar1 = function() { triggered.bar1 ++ ; } ) ;
bus.once( 'bar' , onBar2 = function() { triggered.bar2 ++ ; } ) ;

// 3 listeners for 'baz'
bus.on( 'baz' , onBaz1 = function() { triggered.baz1 ++ ; } ) ;
onBaz2 = function() { triggered.baz2 ++ ; } ;
bus.once( 'baz' , onBaz2 ) ;
bus.once( 'baz' , onBaz2 ) ;
bus.once( 'baz' , onBaz2 ) ;

bus.emit( 'foo' ) ;
bus.emit( 'bar' ) ;
bus.emit( 'baz' ) ;
expect( triggered ).to.eql( { foo1: 1 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 3 , qux: 0 } ) ;

bus.emit( 'foo' ) ;
expect( triggered ).to.eql( { foo1: 1 , bar1: 1 , bar2: 1 , baz1: 1 , baz2: 3 , qux: 0 } ) ;

bus.emit( 'bar' ) ;
expect( triggered ).to.eql( { foo1: 1 , bar1: 2 , bar2: 1 , baz1: 1 , baz2: 3 , qux: 0 } ) ;

bus.emit( 'baz' ) ;
expect( triggered ).to.eql( { foo1: 1 , bar1: 2 , bar2: 1 , baz1: 2 , baz2: 3 , qux: 0 } ) ;
```

unhandled 'error' event should throw whatever is passed to it.

```js
var throwed = 0 , triggered = 0 ;
var bus = Object.create( NextGenEvents.prototype ) ;
var testError = new Error( 'Some error occurs!' ) ;

var onError = function( error ) {
	triggered ++ ;
	expect( error ).to.be( testError ) ;
} ;

try {
	bus.emit( 'error' , testError ) ;
}
catch ( error ) {
	throwed ++ ;
	expect( error ).to.be( testError ) ;
}

expect( throwed ).to.be( 1 ) ;

bus.once( 'error' , onError ) ;

bus.emit( 'error' , testError ) ;
// Should not throw
expect( triggered ).to.be( 1 ) ;

try {
	bus.emit( 'error' , testError ) ;
}
catch ( error ) {
	throwed ++ ;
	expect( error ).to.be( testError ) ;
}

expect( throwed ).to.be( 2 ) ;
```

<a name="basic-synchronous-event-emitting-not-compatible-with-node"></a>
# Basic synchronous event-emitting (NOT compatible with node)
should remove every occurences of a listener for one event.

```js
var bus = Object.create( NextGenEvents.prototype ) ;

var onFoo1 , onBar1 , onBar2 ;
var triggered = { foo1: 0 , bar1: 0 , bar2: 0 } ;

onFoo1 = function() { triggered.foo1 ++ ; } ;
onBar1 = function() { triggered.bar1 ++ ; } ;
onBar2 = function() { triggered.bar2 ++ ; } ;

// 1 listener for 'foo'
bus.on( 'foo' , onFoo1 ) ;

// 2 listeners for 'bar'
bus.on( 'bar' , onBar1 ) ;

// Same listener added multiple times
bus.on( 'bar' , onBar2 ) ;
bus.on( 'bar' , onBar2 ) ;
bus.on( 'bar' , onBar2 ) ;

bus.emit( 'foo' ) ;
bus.emit( 'bar' ) ;
expect( triggered ).to.eql( { foo1: 1 , bar1: 1 , bar2: 3 } ) ;

bus.removeListener( 'bar' , onBar2 ) ;
bus.emit( 'bar' ) ;
expect( triggered ).to.eql( { foo1: 1 , bar1: 2 , bar2: 3 } ) ;
```

