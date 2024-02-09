import httpModule from 'http';
import manifest, { title, icon, description, id } from './manifest'

const dialog = new Dialog({
    id: `${id}-dialog`,
    title: 'Options',
    lines: [`<div></div>`],
    onConfirm() { },
});

const menuAction = new Action(`${id}-action`, {
    name: title,
    description,
    icon,
    click() {
        if (Format) {
            dialog.show();
        }
    },
});

BBPlugin.register(id, {
    ...manifest,
    onload() {
        MenuBar.addAction(menuAction, 'tools');
        if (DEBUG && !window.devServer) {
            console.log("Development server injected");
            const http: typeof httpModule = require('http');
            window.devServer = http.createServer((_, res) => {
                res.writeHead(200);
                Plugins.devReload();
                res.end('Plugins reloaded');
            }).listen(8080);
        }
    },
    onunload() {
        menuAction.delete();
        dialog.delete();
    },
    oninstall() { },
    onuninstall() { },
});
