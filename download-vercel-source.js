#!/usr/bin/env node
/**
 * download-vercel-source.js
 * ---------------------------------------------------------------------------
 * 通过 Vercel REST API 下载某次部署(deployment)的源码到本地目录。
 * 兼容 Vercel 返回的“目录树”结构（目录含 children，文件含 uid）。
 * 适用于 `vercel pull` 不可用 / 无 Git 仓库 / 想精确备份某次部署的场景。
 *
 * 依赖：Node 18+（使用全局 fetch）。无需 npm install，零三方依赖。
 *
 * 用法（命令行参数）：
 *   node download-vercel-source.js \
 *       --token  <VERCEL_TOKEN> \
 *       --deployment <DEPLOYMENT_ID> \
 *       --out   ./backup \
 *       [--team <TEAM_ID>]          # 部署属于某个团队时必填
 *
 * 用法（环境变量）：
 *   VERCEL_TOKEN=xxx DEPLOYMENT_ID=xxx OUTPUT_DIR=./backup [TEAM_ID=yyy] node download-vercel-source.js
 *
 * 如何拿到参数：
 *   - token        : Vercel 后台 Settings -> Tokens 生成（需 Deployment 读权限）
 *   - deployment id: 用项目的真实 deployment UID（形如 dpl_xxxxxxxx），
 *                    activity 日志里的 uev_ 是事件 ID，不能直接用。
 *                    可用本目录 explore.js 列出项目的真实 deployment UID。
 *   - team id      : 团队设置页 URL 中的 id（个人项目不用填）
 * ---------------------------------------------------------------------------
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const API = 'https://api.vercel.com';

// ----- 参数解析 -----
function parseArgs(argv) {
  const a = {
    token: process.env.VERCEL_TOKEN,
    deployment: process.env.DEPLOYMENT_ID,
    out: process.env.OUTPUT_DIR,
    team: process.env.TEAM_ID,
  };
  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case '--token': a.token = argv[++i]; break;
      case '--deployment': a.deployment = argv[++i]; break;
      case '--out': a.out = argv[++i]; break;
      case '--team': a.team = argv[++i]; break;
      default: break;
    }
  }
  return a;
}

const args = parseArgs(process.argv);

if (!args.token) { console.error('❌ 缺少 VERCEL_TOKEN（用 --token 或环境变量）'); process.exit(1); }
if (!args.deployment) { console.error('❌ 缺少 DEPLOYMENT_ID（用 --deployment 或环境变量）'); process.exit(1); }
args.out = args.out || './vercel_backup';

// ----- 工具函数 -----
function authHeaders() {
  return { Authorization: `Bearer ${args.token}` };
}

function buildUrl(pathname, extra = {}) {
  const u = new URL(API + pathname);
  if (args.team) u.searchParams.set('teamId', args.team);
  for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v);
  return u.toString();
}

// 带 429 退避重试
async function fetchWithRetry(url, opts, retries = 4) {
  let last;
  for (let i = 0; i <= retries; i++) {
    last = await fetch(url, opts);
    if (last.ok || last.status !== 429) return last;
    const wait = 1000 * (i + 1);
    console.warn(`⚠️ 触发限流(429)，等待 ${wait}ms 后重试...`);
    await new Promise((r) => setTimeout(r, wait));
  }
  return last;
}

// 获取文件树（单次请求，目录树结构）
async function getFileTree(deploymentId) {
  const url = buildUrl(`/v13/deployments/${deploymentId}/files`, { limit: '100' });
  const res = await fetchWithRetry(url, { headers: authHeaders() });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`列出文件失败 ${res.status}: ${txt}`);
  }
  return await res.json();
}

// 递归遍历目录树，收集叶子文件 -> [{ path, uid }]
function collect(nodes, base, out) {
  for (const n of nodes) {
    const p = base ? `${base}/${n.name}` : n.name;
    if (n.type === 'directory' && Array.isArray(n.children)) {
      collect(n.children, p, out);
    } else if (n.uid) {
      // 文件（少数情况下 type 缺失但带 uid，同样当作文件处理）
      out.push({ path: p, uid: n.uid });
    }
  }
}

// 下载单个文件（按 uid；自动识别并解压 gzip）
async function downloadFile(file, deploymentId, outDir) {
  const url = buildUrl(`/v8/deployments/${deploymentId}/files/${encodeURIComponent(file.uid)}`);
  const res = await fetchWithRetry(url, { headers: authHeaders() });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`下载 ${file.path} 失败 ${res.status}: ${txt}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  let content = buf;
  // Vercel 部分文件以 gzip 存储，用魔数 0x1f 0x8b 识别后解压
  if (buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b) {
    content = zlib.gunzipSync(buf);
  }
  const target = path.join(outDir, ...file.path.split('/'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

// 简易并发池
async function runPool(items, worker, concurrency = 8) {
  let idx = 0;
  async function next() {
    while (idx < items.length) {
      const cur = items[idx++];
      await worker(cur);
    }
  }
  const n = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: n }, () => next()));
}

// ----- 主流程 -----
(async () => {
  fs.mkdirSync(args.out, { recursive: true });
  console.log(`🔍 拉取部署 ${args.deployment} 的文件树...`);
  const tree = await getFileTree(args.deployment);
  const files = [];
  collect(Array.isArray(tree) ? tree : [tree], '', files);
  if (files.length === 0) {
    console.warn('⚠️ 该部署没有可导出的文件（可能源码已过期或部署类型特殊）。');
    process.exit(0);
  }
  console.log(`📦 共 ${files.length} 个文件，开始下载到 ${path.resolve(args.out)}`);
  let done = 0;
  await runPool(files, async (f) => {
    await downloadFile(f, args.deployment, args.out);
    done++;
    if (done % 25 === 0 || done === files.length) {
      console.log(`进度 ${done}/${files.length}`);
    }
  }, 8);
  console.log(`✅ 完成，源码已保存到 ${path.resolve(args.out)}`);
})().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
