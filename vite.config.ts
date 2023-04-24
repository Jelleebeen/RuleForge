import { defineConfig } from 'vite'
import { resolve } from 'pathe'
import dts from 'vite-plugin-dts'

export default defineConfig({
    build: {
        lib: {
          // Could also be a dictionary or array of multiple entry points
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'RuleForge',
          // the proper extensions will be added
          fileName: 'ruleforge',
        },
        rollupOptions: {
          output: {
            inlineDynamicImports: false
          }
        }
      },
      plugins: [dts()]
})