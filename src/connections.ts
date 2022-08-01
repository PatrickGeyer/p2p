import { Subject } from "rxjs";
import { App } from "./app";
import { Order } from "./orders";

const createp2pnode = require('swenssonp2p');

export class Connections {
    node = createp2pnode();
    connections: { str: string, nodeId: string | null }[] = [];
    pendingConnections: string[] = [];

    onMessage = new Subject<Message>();

    listen(port) {
        return new Promise((resolve) => {
            this.node.listen(port, () => {
                console.log('Listening to connections on port ' + port + '...');
                resolve(true);
            });
        })
    }

    constructor(private app: App) {

        // Some other node has connected to
        // us (neighbor)
        this.node.on('connect', (data) => {
            console.log('Node', data.nodeId, 'has connected');

            this.app.orders.orders.forEach(e => {
                this.direct(data.nodeId, new OrderAddedMessage(e));
            });

            this.connections.forEach(e => {
                this.direct(data.nodeId, new ConnectionAddedMessage(e));
            })
        });

        // Neighbor has disconnected
        this.node.on('disconnect', ({ nodeId }) => {
            this.connections = this.connections.filter(i => i.nodeId != nodeId);
            // console.log('Node', nodeId, 'has disconnected');
        });

        // Some message has been broadcasted somewhere
        // on the network and has reached us
        this.node.on('broadcast', ({ origin, message }) => {
            this.onMessage.next(parseMessage(message));
            console.log('Message', message, 'has been broadcasted from', origin);
        });

        // Some message has been sent to us
        this.node.on('direct', ({ origin, message }) => {
            this.onMessage.next(parseMessage(message));
            console.log('Message', message, 'has been directly send to us from', origin);
        });
    }

    connect(str) {

        return new Promise((resolve) => {
            if (!this.connections.find(c => c.str == str) && !this.pendingConnections.includes(str)) {
                this.pendingConnections.push(str);
                console.log("Connecting to ", str);
                // Connect to other nodes
                this.node.connect(str.split(":")[0], str.split(":")[1], () => {
                    this.connections.push({ str, nodeId: null });
                    resolve(true);
                });
            }
        }).then(() => this.pendingConnections = this.pendingConnections.filter(c => c != str))
    }

    broadcast(data: Message) {
        // Send message to everyone
        // data can be anything that
        // you can JSON.stringify
        this.node.broadcast(data);
    }

    direct(id, data: Message) {
        // Send message to specific node
        // data can be anything that
        // you can JSON.stringify
        this.node.direct(id, data);
    }

    close() {
        return new Promise((resolve) => {
            // Shut down node
            this.node.close(() => {
                console.log('Node is down');
                resolve(true);
            });
        })

    }
}

export class Message {
    event: string = "";
    constructor(public data: any) {
    }
}
export class OrderAddedMessage extends Message {
    event = "order.added";
    constructor(public data: Order) {
        super(data);
    }
}
export class OrderUpdatedMessage extends Message {
    event = "order.updated";
    constructor(public data: Order) {
        super(data);
    }
}
export class OrderAcceptedMessage extends Message {
    event = "order.accepted";
    constructor(public data: { originId: string, order: Order }) {
        super(data);
    }
}
export class OrderAcceptConfirmedMessage extends Message {
    event = "order.acceptConfirmed";
    constructor(public data: Order) {
        super(data);
    }
}
export class OrderRemovedMessage extends Message {
    event = "order.removed";
    constructor(public data: Order) {
        super(data);
    }
}

export class ConnectionAddedMessage extends Message {
    event = "connection.added";
    constructor(public data: { str: string, nodeId: string | null }) {
        super(data);
    }
}

export const messages = [
    OrderAddedMessage,
    OrderUpdatedMessage,
    OrderAcceptedMessage,
    OrderAcceptConfirmedMessage,
    OrderRemovedMessage,
    ConnectionAddedMessage
];

function parseMessage(data) {
    const cla = messages.find(m => {
        return new m(null as any).event == data.event;
    });
    return new cla!(data.data);
}