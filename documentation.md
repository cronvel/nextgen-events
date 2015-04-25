

# NextGen Events

Next generation of events handling for node.js

* License: MIT
* Current status: beta
* Platform: Node.js only (browser support is planned)



## Feature highlights

* Standard event-handling almost compatible with Node.js built-in events
* Asynchronous event-handling
* Multiple listeners can be tied to a single context
* A context can be temporarly *disabled*
* A context can be in *queue* mode: events for its listener are stored, they will be *released* when the context is resumed
* Context serialization: async listeners can be run one after the other is fully completed


