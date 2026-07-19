require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { execSync } = require('child_process');
const axios = require('axios');

// 忽略不需要评审的文件
const IGNORE_FILES = [
  'node_modules',
  '.md',
  '.json',
  '.env',
  '.gitignore',
  'dist',
  'assets'
];

// 获取git diff 变更代码
function getGitDiff() {
  try {
    const diff = execSync('git diff', { encoding: 'utf-8' });
    return diff;
  } catch (e) {
    return '';
  }
}

// 过滤无用diff内容
function filterDiff(diffStr) {
  let lines = diffStr.split('\n');
  return lines.filter(line => {
    return !IGNORE_FILES.some(ignore => line.includes(ignore));
  }).join('\n');
}

// 评审固定提示词
const REVIEW_PROMPT = `
你是资深全栈代码评审工程师，请严格按照下面维度评审代码：
1. 语法错误、运行时潜在BUG、边界场景遗漏
2. 代码命名规范、代码整洁度、冗余代码
3. 性能优化点：循环、渲染、请求、算法低效问题
4. 安全问题：参数未校验、权限漏洞、注入风险
5. 可读性、可维护性、是否易于扩展

待评审代码变更内容：
{{CODE_DIFF}}

输出格式严格遵守：
【风险等级】严重/一般/建议优化
文件: 文件名
行数: 变更行号
问题: 详细说明
优化方案: 给出可直接修改代码方案
`;

// 调用大模型
async function callAiReview(diffContent) {
  if (!diffContent.trim()) {
    console.log('✅ 暂无代码变更，无需评审');
    return;
  }

  const prompt = REVIEW_PROMPT.replace('{{CODE_DIFF}}', diffContent);
  let apiConfig, postData;
  // 豆包
  if (process.env.MODEL_TYPE === 'doubao') {
    apiConfig = {
      url: process.env.DOUBAO_ENDPOINT,
      key: process.env.DOUBAO_API_KEY
    };
    postData = {
      model: process.env.DOUBAO_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    };
  } 
  // DeepSeek
  else {
    apiConfig = {
      url: process.env.DEEPSEEK_ENDPOINT,
      key: process.env.DEEPSEEK_API_KEY
    };
    postData = {
      model: process.env.DEEPSEEK_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    };
  }
  try {
    const res = await axios.post(apiConfig.url, postData, {
      headers: {
        'Authorization': `Bearer ${apiConfig.key}`,
        'Content-Type': 'application/json'
      },
      timeout: 180000
    });

    const result = res.data.choices[0].message.content;
    console.log('\n========== 🤖 AI 代码评审结果 ==========\n');
    console.log(result);
    console.log('\n======================================');
  } catch (err) {
    console.error('❌ 评审失败：', err.response?.data || err.message);
  }
}

// 入口执行
async function run() {
  const rawDiff = getGitDiff();
  const validDiff = filterDiff(rawDiff);
  await callAiReview(validDiff);
}

run();