import manifest, { title, icon, description, id } from './manifest'

const dialog = new Dialog({
    id: 'sphere-generator-options',
    title: 'Options',
    lines: [`<div></div>`],
    onConfirm() { },
});

const menuAction = new Action('sphere-generator-action', {
    name: title,
    description,
    icon,
    click() {
        if (Format) {
            dialog.show();
        }
    },
});

BBPlugin.register('sphere-generator', {
    ...manifest,
    onload() {
        menuAction.delete();
        dialog.delete();
    },
    onunload() {
        if (DEBUG) {
            https
                .createServer((_, res) => {
                    res.writeHead(200);
                    Plugins.devReload();
                })
                .listen(8080);
        }
        MenuBar.addAction(menuAction, 'tools');
    },
    oninstall() { },
    onuninstall() { },
});
