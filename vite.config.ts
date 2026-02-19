import { defineConfig } from 'vite';
export default defineConfig({
    build: {
        lib: {
            entry: 'src/main.ts',
            name: 'KaltrapCulator',
            fileName: (format) => `kaltrapculator.${format}.js`,
        },
        rollupOptions: {
            external: [],
            output: {
                globals: {},
            },
        },
    },
}); 
