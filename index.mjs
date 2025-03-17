// index.mjs
// 使用动态导入解决模块兼容问题
async function startServer() {
  // 动态导入所需模块
  const http = await import('http');
  const net = await import('net');
  const url = await import('url');
  const ws = await import('ws');
  const util = await import('util');
  const TextDecoder = util.TextDecoder;

  const uuid = (process.env.UUID || 'ee1feada-4e2f-4dc3-aaa6-f97aeed0286b').replaceAll('-', '');
  const port = process.env.PORT || 8080;

  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('hello world');
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  // 使用动态导入的 WebSocketServer
  const WebSocketServer = ws.WebSocketServer || ws.Server;
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = url.parse(request.url).pathname;
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, ws => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // 获取 createWebSocketStream 函数
  const createWebSocketStream = ws.createWebSocketStream;

  wss.on('connection', ws => {
    ws.once('message', msg => {
      const [VERSION] = msg;
      const id = msg.slice(1, 17);
      if (!id.every((v, i) => v == parseInt(uuid.substr(i * 2, 2), 16))) return;
      let i = msg.slice(17, 18).readUInt8() + 19;
      const port = msg.slice(i, i += 2).readUInt16BE(0);
      const ATYP = msg.slice(i, i += 1).readUInt8();
      const host = ATYP == 1 ? msg.slice(i, i += 4).join('.') : //IPV4
        (ATYP == 2 ? new TextDecoder().decode(msg.slice(i + 1, i += 1 + msg.slice(i, i + 1).readUInt8())) : //domain
          (ATYP == 3 ? msg.slice(i, i += 16).reduce((s, b, i, a) => (i % 2 ? s.concat(a.slice(i - 1, i + 1)) : s), []).map(b => b.readUInt16BE(0).toString(16)).join(':') : '')); //ipv6

      console.log('conn:', host, port);
      ws.send(new Uint8Array([VERSION, 0]));
      const duplex = createWebSocketStream(ws);
      net.connect({ host, port }, function() {
        this.write(msg.slice(i));
        duplex.on('error', console.error.bind(this, 'E1:')).pipe(this).on('error', console.error.bind(this, 'E2:')).pipe(duplex);
      }).on('error', console.error.bind(this, 'Conn-Err:', { host, port }));
    }).on('error', console.error.bind(this, 'EE:'));
  });

  server.listen(port, () => {
    console.log(`服务器已在端口 ${port} 上启动`);
  });
}

// 启动服务器并处理错误
startServer().catch(err => {
  console.error('启动服务器时出错:', err);
});
