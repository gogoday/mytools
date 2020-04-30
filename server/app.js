const Koa = require('koa');
const koaStatic = require('koa-static');
const config = require('../config.js')
const app = new Koa();
app.use(koaStatic(config.staticDir));
app.listen(config.port)
