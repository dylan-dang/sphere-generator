import { id, title } from "./manifest";

function imageInput(mappingCondition: string, label: string) {
    return {
        type: "file",
        label,
        readtype: "image",
        placeholder: 'Missing',
        extensions: ['png', 'jpg', 'jpeg', 'bmp', 'tiff', 'tif', 'gif'],
        condition: ({ mapping }) => mapping == mappingCondition
    } satisfies DialogFormElement;
}

const form = {
    mapping: {
        type: 'select',
        label: 'Texture Mapping',
        options: {
            equirectangular: 'Equirectangular',
            cube: 'Cube'
        }
    },
    textureLength: { type: 'number', label: 'Texture Length', value: 512 },
    rotation: { type: 'vector', label: 'Rotation', value: [0, 0, 0] },
    origin: { type: 'vector', label: 'Position', value: [8, 8, 8] },
    size: { type: 'file', label: 'Size', value: [16, 16, 16] },
    geometryDetail: { type: 'number', label: 'Geometry Detail', value: 16 },
    _: '_',
    texture: imageInput('equirectangular', 'Texture'),
    north: imageInput('cube', 'North'),
    south: imageInput('cube', 'South'),
    east: imageInput('cube', 'East'),
    west: imageInput('cube', 'West'),
    top: imageInput('cube', 'Top'),
    bottom: imageInput('cube', 'Bottom'),
} as const;

export type Options = FormResult<typeof form>;

export default new Dialog({
    id: `${id}-dialog`,
    title: `${title} Options`,
    form,
    onConfirm(data) {

    },
});