///<reference types="blockbench-types" />
///<reference types="jqueryui" />
import httpsModule from 'https';

declare global {
    const https: typeof httpsModule;

    const Plugins: {
        Vue: any[];
        all: Plugin[];
        devReload(): void;
        dialog: Dialog;
        download_stats: { [key: string]: number };
        installed: { id: string; path?: string; source: string }[];
        json: { [key: string]: PluginData };
        loading_promise: Promise<void>;
        path: string;
        registered: { [key: string]: Plugin };
        sort(): void;
    };

    interface PluginData {
        version: string;
        min_version?: string;
        max_version?: string;
        oninstall?(): void;
        onuninstall?(): void;
    }

    var open_interface: any;
    var open_dialog: any;

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

    interface Math {
        clamp(value: number, min: number, max: number): number;
    }

    const window: Window;
}
