/**
 * 用来批量替换lm studio中的huggingface.co地址
 * 用法：
 * 1. 将该mjs文件，拷贝到 LM Studio/resources/app/ 下面
 * 2. 运行：./.webpack/bin/node.exe run_huggingface.mirror.mjs
 * 注意：这里指定的是lm studio自带的nodejs，前面的英文句号不要漏掉：“./.webpack”
 */
import { dirname, join, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	copyFileSync,
	existsSync,
	readFileSync,
	writeFileSync,
} from 'node:fs';

// 当前目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 📝 手动指定要替换的 JS 文件路径（可任意放多个）
const filesToProcess = [
	join(__dirname, '.webpack', 'main', 'index.js'),
	join(__dirname, '.webpack', 'renderer', 'main_window.js'),
];

// 遍历处理每个文件
for (const inputFile of filesToProcess) {
	const ext = extname(inputFile);
	const base = basename(inputFile, ext);
	const backupFile = join(dirname(inputFile), `${base}.back${ext}`);

	// 备份文件（如不存在）
	if (!existsSync(backupFile)) {
		copyFileSync(inputFile, backupFile);
		console.log(`✅ 备份完成: ${backupFile}`);
	} else {
		console.log(`ℹ️ 已存在备份: ${backupFile}`);
	}

	// 读取文件内容
	let content = readFileSync(inputFile, 'utf8');

	// 跳过已处理文件
	if (content.includes('hf-mirror.com')) {
		console.log(`✔️ 已替换过: ${inputFile}`);
		continue;
	}

	// 替换并写回
	const updated = content.replace(/huggingface\.co/g, 'hf-mirror.com');
	writeFileSync(inputFile, updated, 'utf8');
	console.log(`🎉 替换完成: ${inputFile}`);
}
