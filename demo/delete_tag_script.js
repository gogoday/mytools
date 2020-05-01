const path = require('path')
const { initLog, readFileByLine, getMysqlConn, queryMysql, searchMysql, outputCSV} = require('../libs/index')
let [,,file,type,env,logfile] = process.argv
const { logger, csvLogger} = initLog(logfile)
let mysql_conf = {
  dev: 'mysql://user:pass@host:port/db_dev',
  prod: 'mysql://user:pass@host:port/db_prod',
}
let db_config = mysql_conf[env]
if (!db_config) {
  logger.info('no db config')
}
let video_type = parseInt('100', 2);
let article_type = parseInt('001', 2);
let content_type = type === 'video' ? video_type : article_type;
const connection = getMysqlConn(db_config)
file = path.resolve(__dirname, file)
async function run() {

  await readFileByLine(file, async line => {
    let arr = line.split(/\s+/);
    let tag_id = arr.shift();
    let tag_name = arr.join(' ')
    tag_name = tag_name.replace('_白名单', '')
    let where = [{
      column: 'tag_name',
      value: tag_name
    },
      {
        column: 'tag_from',
        value: 1
      }
    ]
    //console.log(tag_name)
    const result = await searchMysql(connection, 't_tag_whitelist', where)
    //console.log(result)
    let l = result.length;
    if (l  > 0) {
      for (let i = 0; i < l ; i ++) {
        let item = result[i]
        // 第一位: 视频 第二位: 小视频 第三位:图文
        if (item.uni_tag_app & content_type === content_type ) {
          logger.info(`will delete tag: ${JSON.stringify(item)}`)
          let sql = 'delete from t_tag_whitelist where tag_id = ?'
          let values = [item.tag_id];
          const delResult = await queryMysql(connection, sql, values)
          console.log(delResult)
        }
      }
    }
  })

  connection.end();

}

run();



