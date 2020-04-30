const readline = require('readline')
const fs = require('fs')
const readfile = process.argv[2]
const logfile = process.argv[3]
const mysql = require('mysql')
const csv = require('csv-parser')
const { parseAsync } = require('json2csv');
const log4js = require('log4js');
const myInterval;

function initLog(filename) {
  log4js.configure({
    appenders: {
      csv: {type: 'file', filename, encoding: 'utf-8',
        layout: {
            type: "pattern",
            // 配置模式，下面会有介绍
            pattern: '%m'
        }
      },
      out: {type: 'stdout'}
    },
    categories: {
      default: {appenders: ['out'], level: 'all'},
      csv: {appenders: ['csv'], level: 'all'}
    }
  })
  const logger = log4js.getLogger()
  const csvLogger = log4js.getLogger('csv')
  
  return {logger, csvLogger}
}

/**
 * 逐行读取文件
 * file 文件路径，如果是null 就取命令行第二个参数
 * cb 每行的回调函数
 */
let i = 0;
async function readFileByLine(file, cb) {
  let _file = file || readfile;
  const rl = readline.createInterface({
    input: fs.createReadStream(_file),
    crlfDelay: Infinity
  })

  for await (const line of rl) {
    await new Promise((resolve, reject) => {
      let _line = line.toString()
      cb && await cb(_line)
      resolve(true)
    })
  }
}

/**
 * mysql url:'mysql://root:qwe+-123@localhost:3306/tag'
 */
async function getMysqlConn(mysqlurl) {
  const connection = mysql.createConnection(mysqlurl);
  connection.connect();
  return connection
}

/**
 * connection: mysql connect
 * table
 * wheres [{comun: string; value: string|num; op: string}]
 * order
 */
async function queryMysql(connection, table, wheres, order ) {
  return new Promise((resolve, reject) => {
    let where = _conditionForFilter(wheres), order_str = '';
    let {query, values} = where;
    if (order) {
      order_str = ` ORDER BY ${order.column} ${order.type || 'DESC'}`;
    }
    let sql = mysql.format(`select * from ${table} ${query} ${order_str}`, values);
    connection.query(sql, (err, result) => {
      if (err) {
        console.error(err)
      }
      resolve(result)
    }
  })
}

function _conditionForFilter(filters){
  let values = [], orValues = [], orRule = [], rule = [];
  filters.forEach((filter) => {
    let op = (filter.op || '=').toUpperCase();
    let value = filter.value;
    let column = filter.column;
    let link = filter.link || 'and';
    if(link=='or'){
      orRule.push(`${column} ${op} ?`);
      orValues.push(value);
    }else{
      op === 'IN' || op === 'NOT IN' ? rule.push(`${column} ${op} (?)`) : rule.push(`${column} ${op} binary(?)`);
      values.push(value);
    }
  })
  let query = '';
  if(orRule.length>0){
    query = rule.join(' and ').concat(` and (${orRule.join(' or ')}) `);
    values = values.concat(orValues);
  }else{
    query = rule.join(' and ');
  }
  return {
    query: query,
    values: values
  };
}

async function getDataFromCsv(csvfile) {
  let file = csvfile || process.argv[2];
  return new Promise((resolve,reject) => {
    const results = [];
    fs.createReadStream(file)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results)
      });
  })
}

/**
 * data: [{1, 'name', 2, 4}]
 * colomn : ['index', 'name', 'id', 'new_id']
 */
async function outputCSV(data, fields) {
  const opts = { fields };
  parseAsync(data, opts)
    .then(csv => console.log(csv))
    .catch(err => console.error(err));
}

function msleep(n) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}
function sleep(n) {
  msleep(n*1000);
}


function quickSort(sortArr) {
  if (sortArr.length <= 1) {
    return sortArr
  }
  let left = []
  let right = []
  let base = sortArr[0]
  for (let i = 1; i < sortArr.length; i++) {
    // 判决条件
    if (sortArr[i] > base) {
        right.push(sortArr[i])
    } else {
        left.push(sortArr[i])
    }
  }
  return quickSort(left).concat(base, quickSort(right))
}

function popSort(sortArr, sortKey) {
  for (let i = 0; i < sortArr.length - 1; i++) {
    for (let j = i + 1; j < sortArr.length; j++) {
      if (sortArr[j][sortKey] > sortArr[i][sortKey]) {
        let temp = sortArr[i]
        sortArr[i] = sortArr[j]
        sortArr[j] = temp
      }
    }
  }
  return sortArr
}

module.exports = {
  initLog,
  readFileByLine,
  getMysqlConn,
  queryMysql
  msleep,
  sleep,
  quickSort,
  popSort,
}

