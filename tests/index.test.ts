import findPort from "find-open-port";
import { first } from "rxjs/operators";
import { appSetup, connectApps, syncApps } from ".";
import { App } from "../src/app";
import { Order } from "../src/orders";

const exampleOrder: Partial<Order> = {
    buy: 'BTC',
    sell: 'USD',
    price: 50000,
    amount: 1
}

describe('Testing app setup', () => {
    // Registers setup and breakdown hooks for the app
    const state = appSetup();

    test('Should perform initial sync when connecting', async () => {
        // Give first instance of app a new order
        const order = state.apps[0].orders.add(exampleOrder);

        await connectApps(state);
        await syncApps(state);

        // Check that the second instance now also contains the existing order
        const addedOrder = await state.apps[1].orders.orders[0];
        expect(order).toMatchObject(addedOrder);
    });

    test('Should automatically confirm when an order is accepted', async () => {
        // Give first instance of app a new order
        const order = state.apps[0].orders.add(exampleOrder);

        await connectApps(state);
        await syncApps(state);

        await state.apps[1].orders.accept(order);

        const confirmed = await state.apps[1].orders.onUpdated.pipe(first()).toPromise();

        expect(confirmed?.confirmed).toBe(state.apps[1].connections.node.id);
    });

    test('Should sync connections', async () => {

        // Create a third instance
        await findPort.findPort().then(p => state.apps[2] = new App(p));
        await state.apps[2].listen();

        // Connect apps 0,1
        await state.apps[0].connections.connect('127.0.0.1:' + state.apps[1].port);

        // Connect apps 1,2 but dont directly connect 0,2
        await new Promise(r => setTimeout(r, 1000));
        await state.apps[1].connections.connect('127.0.0.1:' + state.apps[2].port);

        await new Promise(r => setTimeout(r, 1000));
        expect(state.apps[2].connections.connections.length).toBe(2);

        // Give first instance of app a new order and check that it gets broadcast to last instance
        const order = state.apps[0].orders.add(exampleOrder);
        await new Promise(r => setTimeout(r, 1000));

        // Check that the second instance now also contains the existing order
        const addedOrder = await state.apps[2].orders.orders[0];
        expect(order).toMatchObject(addedOrder);

    });

    test('Should delete orders when the issuer deletes it', async () => {

    });

});