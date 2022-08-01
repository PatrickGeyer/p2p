# P2P BTC/USD exchange

## Installation
```
npm install
npm install -g pm2
npm install -g npx

tsc

<!-- Starts two instances of the app -->

pm2 start dist/index.js --name client1 -- 3001
pm2 start dist/index.js --name client2 -- 3002

<!-- Add an order on client1 -->

pm2 trigger client1 addOrder '{
    "buy": "BTC",
    "sell": "USD",
    "price": 50000,
    "amount": 1
}'

<!-- Client 1 shows the new order -->
pm2 trigger client1 orders

<!-- Client 2 does not show any orders, as they are not yet connected -->
pm2 trigger client2 orders

<!-- Next connect the two clients, and the orders will sync -->
pm2 trigger client1 connect 127.0.0.1:3002

<!-- Now the orders are synched -->
pm2 trigger client2 orders

<!-- Accept the order created on client1 -->
pm2 trigger client2 acceptOrder '{"id": [INSERT ORDER ID HERE]}'

<!-- Check that the order is infact confirmed after the updates have been shared between the nodes -->
pm2 trigger client2 acceptOrder '{"id": [INSERT ORDER ID HERE]}'
```

## Running tests

```
npx jest
```
## Features
- Once you connect to a node, it will sync its connections so that you automatically connect to those as well
- On new connections, it syncs the orderbook
- Broadcasts events for orders being updated and confirmed
- Command line interface for performing actions

## Improvements
I am not familiar with p2p engineering yet, nor with the grenache package.
Ended up using a simple socket npm package to keep it simple, but that ended up being too simple and not giving me access to socket information when needed in the connections.ts file. Managed to work around that though.

### Separation of concerns
- Got a bit mixed up when handling remote messages and local commands. Could have done better here, given more time.
### Race condition
- Did not get around to testing what happens when an order gets accepted at the exact same time, nor what happens if a user accepts their own order.
### Spam prevention
- Currently, more messages are sent than is required.
For example, if a user updates an order it is broadcast by that user, and then every other user which is updating their order book too. 
- Would it be possible to integrate lightning, so that a minimum payment would be required to broadcast a message?
