import express from 'express';
import fetch from 'node-fetch';
import { TextDecoder } from 'util';
import { config } from './config.js';
import { StreamOptimizer } from './streamOptimizer.js';
import { log } from './logger.js';

// --- 启动检查 ---
if (!config.upstreamApiUrl) {
  console.error('错误：必须设置 UPSTREAM_API_URL 环境变量！');
  process.exit(1);
}

const app = express();
app.use(express.json({ limit: '50mb' }));

app.use(async (req, res) => {
  const targetUrl = new URL(req.originalUrl, config.upstreamApiUrl.replace('/v1/chat/completions', ''));
  
  // 只针对 /v1/chat/completions 的流式请求进行优化
  if (req.method === 'POST' && req.path === '/v1/chat/completions' && req.body.stream === true) {
    log(`检测到流式请求: ${req.path}，正在初始化平滑优化器...`);

    // 关键修复：为每个请求创建独立的优化器实例，防止多用户内容串行
    const optimizer = new StreamOptimizer(config.optimizer);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
      const upstreamResponse = await fetch(targetUrl.href, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || '',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(req.body),
      });

      if (!upstreamResponse.ok) {
        const errorText = await upstreamResponse.text();
        log('上游API错误:', upstreamResponse.status, errorText);
        return res.status(upstreamResponse.status).send(errorText);
      }

      const decoder = new TextDecoder();
      let buffer = '';

      // 遍历上游流
      for await (const chunk of upstreamResponse.body) {
        // 使用 TextDecoder 确保 chunk 切分时中文字符不乱码
        buffer += decoder.decode(chunk, { stream: true });

        let boundary = buffer.lastIndexOf('\n\n');
        if (boundary !== -1) {
          const completeEvents = buffer.substring(0, boundary);
          buffer = buffer.substring(boundary + 2);

          const eventLines = completeEvents.split('\n');
          for (const line of eventLines) {
            if (!line.startsWith('data: ')) continue;
            
            const dataContent = line.substring(6).trim();
            if (dataContent === '[DONE]') {
              res.write(`data: [DONE]\n\n`);
              continue;
            }

            try {
              const originalData = JSON.parse(dataContent);
              const textToProcess = originalData.choices?.[0]?.delta?.content || '';

              if (textToProcess) {
                // 进入平滑处理逻辑
                for await (const smoothedPart of optimizer.process(textToProcess)) {
                  const newPayload = {
                    ...originalData,
                    choices: [{
                      ...originalData.choices[0],
                      delta: { content: smoothedPart }
                    }]
                  };
                  res.write(`data: ${JSON.stringify(newPayload)}\n\n`);
                }
              } else {
                // 如果没有 content (比如 role 定义或 metadata)，直接原样转发
                res.write(`data: ${dataContent}\n\n`);
              }
            } catch (e) {
              // 无法解析的 JSON 原样转发
              res.write(`${line}\n\n`);
            }
          }
        }
      }

      // 上游数据传输结束，但缓冲区可能还有剩余内容（平滑算法的滞后）
      // 这里的逻辑已包含在 optimizer.process 的 while 循环收尾中，
      // 但为了保险，可以检查并清空 optimizer 内部 buffer。
      log('上游传输完成，清空优化器剩余缓冲区...');

    } catch (error) {
      log('网关流式处理严重错误:', error);
      if (!res.headersSent) res.status(500).send('Smooth Gateway Internal Error');
    } finally {
      res.end();
      log('连接已关闭。');
    }

  } else {
    // --- 静态代理逻辑 (非流式请求或普通请求) ---
    log(`执行直接代理: ${req.method} ${req.path}`);
    try {
      const upstreamResponse = await fetch(targetUrl.href, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || ''
        },
        body: (req.method !== 'GET' && req.method !== 'HEAD') ? JSON.stringify(req.body) : undefined,
      });

      // 复制 Header
      upstreamResponse.headers.forEach((value, name) => {
        if (!['content-encoding', 'transfer-encoding'].includes(name.toLowerCase())) {
          res.setHeader(name, value);
        }
      });

      res.status(upstreamResponse.status);
      upstreamResponse.body.pipe(res);
    } catch (error) {
      log('代理错误:', error);
      if (!res.headersSent) res.status(502).send('Bad Gateway');
    }
  }
});

const PORT = config.port || 3000;
app.listen(PORT, '0.0.0.0', () => {
  log(`🚀 平滑优化网关已启动: http://0.0.0.0:${PORT}`);
  log(`🔗 转发地址: ${config.upstreamApiUrl}`);
});
