import { App } from "../src/app";
import { findPort } from 'find-open-port';
import { first } from "rxjs/operators";

export class State {
    apps: App[] = [];
}

export function appSetup(): State {

    const state = new State();

    beforeEach(async () => {
        // Start up two instances of the app on available ports
        await findPort.findPort().then(p => state.apps[0] = new App(p));
        await findPort.findPort().then(p => state.apps[1] = new App(p));

        await Promise.all(state.apps.map(a => a.listen()));
    });

    afterEach(async () => {
        await Promise.all(state.apps.map(a => a.connections.close()));
    });

    return state as State;

}

export async function connectApps(state: State) {
    await state.apps[0].connections.connect('127.0.0.1:' + state.apps[1].port);
}

export async function syncApps(state: State) {
    await state.apps[1].orders.onAdded.pipe(first()).toPromise();
}