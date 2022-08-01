import { filter, map } from "rxjs";
import { ConnectionAddedMessage, Connections, OrderAcceptConfirmedMessage, OrderAcceptedMessage, OrderAddedMessage, OrderUpdatedMessage } from "./connections";
import { Orders } from "./orders";

export class App {
    orders = new Orders(this);
    connections = new Connections(this);

    constructor(public port: number) {

        // Listens to local events and broadcasts if needed
        this.orderHandlers();
        // Listens to remote events and updates local state
        this.remoteHandlers();
    }

    orderHandlers() {
        // Broadcast any orders that have been added to the list
        this.orders.onAdded.subscribe(e => {
            this.connections.broadcast(new OrderAddedMessage(e));
        });

        this.orders.onAccepted.subscribe(e => {
            if (e.nodeId != this.connections.node.id)
                this.connections.direct(e.nodeId, new OrderAcceptedMessage({ originId: this.connections.node.id, order: e }));
        });

        // Broadcast the confirmed event
        this.orders.onAcceptConfirmed.subscribe(e => {
            this.connections.broadcast(new OrderAcceptConfirmedMessage(e));
        });

        // Broadcast the updated event
        this.orders.onUpdated.subscribe(e => {
            this.connections.broadcast(new OrderUpdatedMessage(e));
        });
    }

    remoteHandlers() {

        // Add to list any orders that have been broadcast
        this.connections.onMessage.pipe(
            filter(e => e instanceof OrderAddedMessage),
            map(e => e as OrderAddedMessage)
        ).subscribe(e => {
            this.orders.add(e.data);
        });

        // Update orders
        this.connections.onMessage.pipe(
            filter(e => e instanceof OrderUpdatedMessage),
            map(e => e as OrderUpdatedMessage)
        ).subscribe(e => {
            this.orders.update(e.data);
        });

        // When receiving an accepted message, trigger confirmed if needed
        this.connections.onMessage.pipe(
            filter(e => e instanceof OrderAcceptedMessage),
            map(e => e as OrderAcceptedMessage),
            filter(e => e.data.order.nodeId == this.connections.node.id)
        ).subscribe(e => {
            console.log("Received accepted event at ", this.connections.node.id);
            this.orders.accept(e.data.order, e.data.originId);
        });


        // Connect to other nodes
        this.connections.onMessage.pipe(
            filter(e => e instanceof ConnectionAddedMessage),
            map(e => e as ConnectionAddedMessage),
            filter(e => (e.data.nodeId != this.connections.node.id) && !!e.data.str)
        ).subscribe(e => {
            this.connections.connect(e.data.str)
        });

    }

    listen() {
        return this.connections.listen(this.port);
    }
}