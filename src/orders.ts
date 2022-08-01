import { Subject } from "rxjs";
import { App } from "./app";
import { v4 as uuid } from "uuid";

export class Orders {

    constructor(private app: App) { }

    orders: Order[] = [];

    // Triggers after adding a new order to orderbook
    onAdded = new Subject<Order>();

    // Triggers after updating an order in the orderbook
    onUpdated = new Subject<Order>();

    // Triggers after the user accepts a trade
    onAccepted = new Subject<Order>();

    // Triggers after the accepted trade is confirmed by issuer
    onAcceptConfirmed = new Subject<Order>();

    add(order: Partial<Order>) {
        const o = {
            id: uuid(),
            nodeId: this.app.connections.node.id,
            confirmed: false,
            ...order
        } as Order;

        // Only add to list if doesn't already contain it
        if (!this.orders.find(i => i.id == o.id)) {
            this.orders.push(o);
            this.onAdded.next(o);
        }
        return o;
    }

    update(order: Order) {
        let index = this.orders.findIndex(i => i.id == order.id);
        if (index >= 0 && JSON.stringify(this.orders[index]) != JSON.stringify(order)) {
            this.orders[index] = order;
            this.onUpdated.next(this.orders[index]);
        }
    }

    accept(order: Order, nodeId: string = this.app.connections.node.id) {
        this.onAccepted.next(order);

        // If the order belongs to us, confirm the first request
        if (order.nodeId == this.app.connections.node.id) {
            this.acceptConfirm(order, nodeId);
        }
    }

    acceptConfirm(order: Order, nodeId: string) {
        // If the order belongs to us, then update the order to settled status
        if (order.nodeId == this.app.connections.node.id) {
            this.update({
                ...order,
                confirmed: nodeId
            });
        }
        this.onAcceptConfirmed.next(order);

    }
}

export interface Order {
    id: string,
    nodeId: string;
    buy: string;
    sell: string;
    amount: number;
    price: number;
    confirmed: boolean | string;
}