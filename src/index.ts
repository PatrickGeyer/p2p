import tx2 from 'tx2';
import { App } from './app';

// Launch the app and listen on the specified port
const app = new App(parseInt(process.argv.pop()!));
app.listen();

// Listen to cli connect command to connect to a new client
(tx2 as any).action('connect', (param, reply) => {
    reply(app.connections.connect(param));
});

// Listen to the orders command to list orders
(tx2 as any).action('orders', (param, reply) => {
    reply(app.orders.orders);
});

// Listen to the addOrder command to create a new order and broadcast it to clients
(tx2 as any).action('addOrder', (param, reply) => {
    reply(app.orders.add(JSON.parse(param)));
});

// Listen to the acceptOrder command
// Takes an order ID and pings the issuer notifying of intended acceptance of order
(tx2 as any).action('acceptOrder', (param, reply) => {
    reply(app.orders.accept(JSON.parse(param)));
});

setInterval(function () {
    // Keep application online
}, 100)