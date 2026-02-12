import { spawn } from 'child_process';
import process from 'process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 临时目录配置
const tempHome = path.join(__dirname, '.vercel_temp_home');
if (!fs.existsSync(tempHome)) {
  fs.mkdirSync(tempHome, { recursive: true });
}

// 获取参数
const args = process.argv.slice(2);
if (args.length === 0) {
  args.push('login');
}

// 净化环境变量
const env = { ...process.env };
env.USERNAME = 'User';
env.USER = 'User';
env.LOGNAME = 'User';
env.USERPROFILE = tempHome;
env.HOME = tempHome;
env.HOMEPATH = tempHome;
env.APPDATA = path.join(tempHome, 'AppData');

if (!fs.existsSync(env.APPDATA)) {
  fs.mkdirSync(env.APPDATA, { recursive: true });
}

console.log('-------------------------------------------------------');
console.log('启动终极修复模式 (Starting Ultimate Fix Mode)...');
console.log('-------------------------------------------------------');

// 关键修改：不再直接运行 Vercel，而是运行我们的补丁脚本 vercel-patch.js
// Key change: Run our patch script instead of Vercel directly
const patchScript = path.join(__dirname, 'vercel-patch.js');

const child = spawn(process.execPath, [patchScript, ...args], {
  env: env,
  stdio: 'inherit'
});

child.on('error', (err) => {
  console.error('启动失败:', err);
});

child.on('exit', (code) => {
  console.log('-------------------------------------------------------');
  if (code === 0) {
    console.log('操作成功 (Success)!');
  } else {
    console.log(`退出代码 (Exit Code): ${code}`);
  }
});