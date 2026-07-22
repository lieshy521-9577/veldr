import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');
  
  // 根据环境确定前端端口
  const frontendPort = env.VITE_FRONTEND_PORT || 5173;
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const uploadBaseUrl = env.VITE_UPLOAD_BASE_URL || 'http://localhost:5000/uploads';
  
  return {
    plugins: [
      vue(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/styles/_variables.scss" as *;`
        }
      }
    },
    server: {
      // headers: {
      //   'Content-Type': 'application/javascript'
      // },
      port: frontendPort,
      host: '0.0.0.0', // 允许外部访问
      proxy: {
        '/api': {
          target: apiBaseUrl.replace('/api', ''),
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: uploadBaseUrl.replace('/uploads', ''),
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html')
        }
      }
    },
    publicDir: 'public',
  };
});
