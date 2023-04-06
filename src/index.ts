const dialog = new Dialog({
    id: 'sphere-generator-options',
    title: 'Options',
    lines: [`<div></div>`],
    onConfirm() { },
});

const menuAction = new Action('sphere-generator-action', {
    name: 'Generate Sphere',
    description: 'Generates a textured sphere block model',
    icon: 'sports_volleyball',
    click() {
        if (Format) {
            dialog.show();
        }
    },
});

BBPlugin.register('sphere-generator', {
    title: 'Sphere Generator',
    author: 'Dylan Dang',
    description: 'Generates a textured sphere block model',
    icon: 'sports_volleyball',
    variant: 'both',
    version: '0.0.1',
    onload() {
        menuAction.delete();
        dialog.delete();
    },
    onunload() {
        https
            .createServer((_, res) => {
                res.writeHead(200);
                Plugins.devReload();
            })
            .listen(8080);

        MenuBar.addAction(menuAction, 'tools');
    },
    oninstall() { },
    onuninstall() { },
});
