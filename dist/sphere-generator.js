(function () {
    'use strict';

    const id = 'sphere-generator';
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
    BBPlugin.register(id, Object.assign(Object.assign({}, manifest), { onload() {
            MenuBar.addAction(menuAction, 'tools');
        },
        onunload() {
            menuAction.delete();
            dialog.delete();
        },
        oninstall() { },
        onuninstall() { } }));

})();
