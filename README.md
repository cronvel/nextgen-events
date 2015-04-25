

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



# References

Work In Progress...

