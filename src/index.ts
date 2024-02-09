import httpModule from 'http';
import manifest, { title, icon, description, id } from './manifest'

const dialog = new Dialog({
    id: `${id}-dialog`,
    title: 'Options',
    lines: [`<div>hello</div>`],
    onConfirm() { },
});

const menuAction = new Action(`${id}-action`, {
    name: title,
    description,
    icon,
    click: () => Format && dialog.show(),
});

BBPlugin.register(id, {
    ...manifest,
    onload() {
        if (DEBUG && !window.devServer) {
            console.log("Development server injected");
            const http: typeof httpModule = require('http');
            window.devServer = http.createServer((_, res) => {
                res.writeHead(200);
                Plugins.all.find(plugin => plugin.id == id)?.reload();
                console.log('Plugin reloaded');
                res.end('Plugin reloaded');
            }).listen(8080);
        }

        MenuBar.addAction(menuAction, 'tools');

    },
    onunload() {
        menuAction.delete();
        dialog.delete();
    },
    oninstall() { },
    onuninstall() { },
});
