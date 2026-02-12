import os from 'os';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import http from 'http';
import https from 'https';

// 1. 强行修改 os.userInfo 和 os.hostname
const originalUserInfo = os.userInfo;
os.userInfo = function(options) {
  return {
    username: 'User',
    uid: 1000,
    gid: 1000,
    shell: null,
    homedir: process.env.HOME || 'C:\\Users\\User'
  };
};

os.hostname = () => 'DevMachine';

// 2. 暴力拦截 http.request 和 https.request
// Force intercept http.request and https.request to remove illegal headers
const interceptRequest = (originalRequest) => {
  return function(...args) {
    let options = args[0];
    if (typeof options === 'string' || options instanceof URL) {
      // 如果第一个参数是 URL，通常 headers 在第二个参数
      // If first arg is URL, headers are usually in second arg
      if (args[1] && typeof args[1] === 'object') {
        options = args[1];
      } else {
        // 只有 URL 没有 options，不用管
        return originalRequest.apply(this, args);
      }
    }

    if (options && options.headers) {
      const safeHeaders = { ...options.headers };
      // 遍历并删除所有包含中文的 header 值
      // Iterate and remove all header values containing Chinese characters
      Object.keys(safeHeaders).forEach(key => {
        const value = safeHeaders[key];
        if (typeof value === 'string' && /[\u4e00-\u9fa5]/.test(value)) {
          // console.log(`[Patch] Removed illegal header: ${key}=${value}`);
          delete safeHeaders[key];
        }
      });
      options.headers = safeHeaders;
    }

    return originalRequest.apply(this, args);
  };
};

http.request = interceptRequest(http.request);
https.request = interceptRequest(https.request);
http.get = interceptRequest(http.get);
https.get = interceptRequest(https.get);

console.log('Patch applied: HTTP headers sanitization enabled.');

// 3. 加载 Vercel
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vercelIndexPath = path.join(__dirname, 'node_modules', 'vercel', 'dist', 'index.js');
const vercelIndexUrl = pathToFileURL(vercelIndexPath).href;

console.log(`Loading Vercel Core from: ${vercelIndexUrl}`);

import(vercelIndexUrl).catch(err => {
  console.error('Failed to load Vercel Core:', err);
  process.exit(1);
});