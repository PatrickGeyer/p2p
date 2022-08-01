# P2P BTC/USD exchange

## Installation
```
npm install
npm install -g pm2

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
```

## Running tests

```
npx jest
```

## Improvements
Currently, more messages are sent than is required.
For example, if a user updates an order, it is broadcast by that user, and then every other user which is updating their order book. 

### Dynamic connection list
Currently, you manually connect to each neighbour node
### Spam prevention
- Would it be possible to integrate lightning, so that a minimum payment would be required to broadcast a message?
