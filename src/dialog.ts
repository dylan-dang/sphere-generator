import { generate } from './geometry';
import { id, title } from './manifest';

function imageInput(mappingCondition: string, label: string) {
    return {
        type: 'file',
        label,
        readtype: 'image',
        placeholder: 'Missing',
        extensions: ['png', 'jpg', 'jpeg', 'bmp', 'tiff', 'tif', 'gif'],
        condition: ({ mapping }) => mapping == mappingCondition,
    } satisfies DialogFormElement;
}

const form = {
    mapping: {
        type: 'select',
        label: 'Texture Mapping',
        options: {
            equirectangular: 'Equirectangular',
            cube: 'Cube',
        },
    },
    textureLength: { type: 'number', label: 'Texture Length', value: 512 },
    rotation: { type: 'vector', label: 'Rotation', value: [0, 0, 0] },
    origin: { type: 'vector', label: 'Position', value: [8, 8, 8] },
    size: { type: 'vector', label: 'Size', value: [16, 16, 16] },
    geometryDetail: { type: 'number', label: 'Geometry Detail', value: 512 },
    _: '_',
    smoothing: { type: 'checkbox', label: 'Smoothing', value: true },
    equirectangular: imageInput('equirectangular', 'Texture'),
    north: imageInput('cube', 'North'),
    south: imageInput('cube', 'South'),
    east: imageInput('cube', 'East'),
    west: imageInput('cube', 'West'),
    up: imageInput('cube', 'Top'),
    down: imageInput('cube', 'Bottom'),
} as const;

type Writeable<T> = { -readonly [P in keyof T]: T[P] };
export type Options = FormResult<Writeable<typeof form>>;

export default new Dialog({
    id: `${id}-dialog`,
    title: `${title} Options`,
    form,
    onConfirm(data) {
        generate(data as Options);
    },
});
