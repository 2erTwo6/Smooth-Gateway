// server.js (环境变量版 + 启动检查)

import express from 'express';
import fetch from 'node-fetch';
import { config } from './config.js';
import { StreamOptimizer } from './streamOptimizer.js';
import { log } from './logger.js';

// --- 关键检查：在应用启动前，确认必要的环境变量已设置 ---
if (!config.upstreamApiUrl) {
  // 这里我们用 console.error，因为它是一个致命的配置错误，必须被看到
  console.error('错误：必须设置 UPSTREAM_API_URL 环境变量！');
  console.error('启动示例: UPSTREAM_API_URL="http://example.com/v1" npm start');
  process.exit(1); // 退出进程，防止应用在错误配置下运行
}

const app = express();
app.use(express.json({ limit: '50mb' }));

const optimizer = new StreamOptimizer(config.optimizer);

// 后续代码与之前版本完全相同...
app.use(async (req, res) => {
  const targetUrl = new URL(req.originalUrl, config.upstreamApiUrl.replace('/v1/chat/completions', ''));
  log(`接收到请求: ${req.method} ${req.path}, 准备转发至: ${targetUrl.href}`);
  
  if (req.method === 'POST' && req.path === '/v1/chat/completions') {
    if (req.body.stream === true) {
      log('检测到流式聊天请求，启用丝滑优化...');
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      try {
        const upstreamResponse = await fetch(targetUrl.href, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': req.headers.authorization || '', 'Accept': 'text/event-stream' },
          body: JSON.stringify(req.body),
        });
        if (!upstreamResponse.ok) {
          const errorText = await upstreamResponse.text();
          log('上游API错误:', upstreamResponse.status, errorText);
          return res.status(upstreamResponse.status).send(errorText);
        }
        let buffer = '';
        for await (const chunk of upstreamResponse.body) {
          buffer += chunk.toString();
          let boundary = buffer.lastIndexOf('\n\n');
          while (boundary !== -1) {
            const completeEvents = buffer.substring(0, boundary);
            buffer = buffer.substring(boundary + 2);
            const eventLines = completeEvents.split('\n').filter(line => line.startsWith('data: '));
            for (const line of eventLines) {
              const dataContent = line.substring('data: '.length);
              if (dataContent.trim() === '[DONE]') { res.write(`data: [DONE]\n\n`); continue; }
              try {
                const originalData = JSON.parse(dataContent);
                const textToProcess = originalData.choices?.[0]?.delta?.content || '';
                if (textToProcess) {
                  for await (const smoothedPart of optimizer.process(textToProcess)) {
                    const newPayload = { ...originalData, choices: [{ ...originalData.choices[0], delta: { content: smoothedPart } }] };
                    res.write(`data: ${JSON.stringify(newPayload)}\n\n`);
                  }
                } else { res.write(`${line}\n\n`); }
              } catch (e) { res.write(`${line}\n\n`); }
            }
            boundary = buffer.lastIndexOf('\n\n');
          }
        }
      } catch (error) {
        log('网关在处理流式请求时发生严重错误:', error);
        if (!res.headersSent) { res.status(500).send('Smooth Gateway Internal Error'); }
      } finally {
        res.end();
        log('流式聊天请求处理完毕，连接关闭。');
      }
    } else {
      log('检测到非流式请求(如标题生成)，执行JSON直接代理...');
      try {
        const upstreamResponse = await fetch(targetUrl.href, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': req.headers.authorization || '' },
          body: JSON.stringify(req.body),
        });
        const data = await upstreamResponse.json();
        res.status(upstreamResponse.status).json(data);
      } catch(error) {
        log('非流式代理时发生错误:', error);
        if (!res.headersSent) { res.status(502).send('Bad Gateway'); }
      }
    }
  } else {
    log('非聊天请求，执行直接代理...');
    try {
      const upstreamResponse = await fetch(targetUrl.href, {
        method: req.method,
        headers: { 'Content-Type': 'application/json', 'Authorization': req.headers.authorization || '' },
        body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
      });
      upstreamResponse.headers.forEach((value, name) => {
        if (name.toLowerCase() !== 'content-encoding' && name.toLowerCase() !== 'transfer-encoding') {
          res.setHeader(name, value);
        }
      });
      res.status(upstreamResponse.status);
      upstreamResponse.body.pipe(res);
    } catch(error) {
      log('直接代理时发生网络错误:', error);
      if (!res.headersSent) { res.status(502).send('Bad Gateway: Cannot connect to upstream server.'); }
    }
  }
});

app.listen(config.port, '0.0.0.0', () => {
  log(`🚀 智能优化网关 (可配置版) 已启动，监听于 http://0.0.0.0:${config.port}`);
  log(`   上游 API 地址配置为: ${config.upstreamApiUrl.replace('/v1/chat/completions', '')}`);
});
