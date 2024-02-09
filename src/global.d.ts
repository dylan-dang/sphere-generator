///<reference types="blockbench-types" />
///<reference types="jqueryui" />
import httpsModule from 'https';

declare global {
    const https: typeof httpsModule;
    const DEBUG: boolean;

    interface PluginOptions {
        version: `${number}.${number}.${number}`
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
}
