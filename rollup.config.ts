import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import { defineConfig } from 'rollup';
import { id } from './src/manifest';

export default (commandArgs) => defineConfig({
    input: 'src/index.ts',
    output: {
        file: commandArgs.configProduction ? `dist/${id}.js` : `${process.env.APPDATA}/Blockbench/plugins/${id}.js`,
        format: 'iife',
    },
    plugins: [replace({
        DEBUG: commandArgs.configProduction ? 'false' : 'true',
        preventAssignment: true,
    }), typescript()],
});
