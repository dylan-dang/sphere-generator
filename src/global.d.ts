///<reference types="blockbench-types" />
///<reference types="jqueryui" />
import type { Server } from 'http';

declare global {
    declare module '*.glsl';

    const DEBUG: boolean;

    type FormResult<T extends Required<DialogOptions>['form']> = {
        [K in keyof T as T[K] extends DialogFormElement
            ? K
            : never]: T[K] extends DialogFormElement
            ? T[K]['type'] extends 'select'
                ? T[K]['options'] extends object
                    ? keyof T[K]['options']
                    : never
                : T[K]['type'] extends 'number' | 'range'
                ? number
                : T[K]['type'] extends 'vector'
                ? [number, number, number]
                : T[K]['type'] extends 'checkbox'
                ? boolean
                : T[K]['type'] extends 'textarea' | 'text' | 'save'
                ? string
                : T[K]['type'] extends 'file' | 'folder'
                ? string | undefined
                : T[K]['type'] extends 'color'
                ? TinyColor
                : T[K]['type'] extends DialogFormElement['type']
                ? unknown
                : never
            : never;
    };

    interface PluginOptions {
        version: `${number}.${number}.${number}`;
    }

    const Plugins: {
        Vue: any[];
        all: Plugin[];
        devReload(): void;
        dialog: Dialog;
        download_stats: { [key: string]: number };
        installed: { id: string; path?: string; source: string }[];
        json: { [key: string]: PluginOptions };
        loading_promise: Promise<void>;
        path: string;
        registered: { [key: string]: Plugin };
        sort(): void;
    };

    interface Plugin {
        id: string;
        reload(): void;
    }

    interface DialogFormElement {
        extensions?: string[];
        readtype?: string;
        condition?: (formResult: { [key: string]: FormResultValue }) => boolean;
    }

    var open_interface: boolean;
    var open_dialog: boolean;

    const Prop: {
        _active_panel: string | undefined;
        active_panel: string | undefined;
        connections: number;
        facing: string;
        file_name: string;
        file_name_alt: string;
        file_path: string;
        fps: number;
        progress: number;
        recording: any;
        session: boolean;
        show_left_bar: boolean;
        show_right_bar: boolean;
    };

    const window: Window;

    interface Window {
        devServer: Server | undefined;
    }
}
