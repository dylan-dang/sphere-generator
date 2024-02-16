import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';
import { defineConfig } from 'rollup';
import glslify from 'rollup-plugin-glslify'
import { id } from './src/manifest';

export default (commandArgs) => defineConfig({
    input: 'src/index.ts',
    output: {
        file: commandArgs.configDev ? `${process.env.APPDATA}/Blockbench/plugins/${id}.js` : `dist/${id}.js`,
        format: 'iife',
        globals: {
            three: 'THREE'
        }
    },
    plugins: [replace({
        DEBUG: commandArgs.configDev ? 'true' : 'false',
        preventAssignment: true,
    }), typescript(), glslify({
        compress: false
    })],
    external: ['three']
});
