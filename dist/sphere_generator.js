(function () {
    'use strict';

    const manifest = {
        title: "Sphere Generator",
        author: "Dylan Dang",
        description: "Generates a textured sphere block model",
        icon: "sports_volleyball",
        variant: "both",
        version: "0.0.1"
    };
    const { title, author, description, icon, variant, version } = manifest;

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
    BBPlugin.register('sphere-generator', Object.assign(Object.assign({}, manifest), { onload() {
            menuAction.delete();
            dialog.delete();
        },
        onunload() {
            MenuBar.addAction(menuAction, 'tools');
        },
        oninstall() { },
        onuninstall() { } }));

})();
