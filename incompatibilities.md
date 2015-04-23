

## Node.js EventEmitter incompatibilities

NextGen events is often compatible with Node.js EventEmitter, except for few things:

* There is no concept of 'max listener' in NextGen Events, .setMaxListeners() function exists for not breaking compatibilities,
  but it does nothing.

* .removeListener() / off() will remove all matching listener function, not only the first listener found

* 'removeListener' event listener will receive an array of removed listener, thus it will be fired only once by 
  .removeListener() / off() / .removeAllListener() call.


