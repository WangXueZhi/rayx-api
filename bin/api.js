const util = require("./util.js");
const fs = require("fs");
const path = require('path');
const gulp = require("gulp");
const replace = require('gulp-replace');
const rename = require("gulp-rename");
const prependFile = require('prepend-file');
const ProgressBar = require('progress')
const chalk = require('chalk')
const slog = require('single-line-log').stdout
const ora = require('ora')
const cwdPath = process.cwd();

/**
 * api模板路径
 */
const TPL_API_PATH = path.resolve(__dirname, "../tpl/api.js");
const TPL_WXA_PATH = path.resolve(__dirname, "../tpl/wxa.js");

/**
 * 解析模板内容
 */
const __TPL_FILE_CONTENT__ = {
    'web': TPL_API_PATH,
    'wxa': TPL_WXA_PATH
}

/**
 * js关键字
 */
const __KEYWORDS__ = ["abstract", "arguments", "boolean", "break", "byte", "case", "catch", "char",
  "class", "const", "continue", "debugger", "default", "delete", "do", "double", "else", "enum",
  "eval", "export", "extends", "false", "final", "finally", "float", "for", "function", "goto",
  "if", "implements", "import", "in", "instanceof", "int", "interface", "let", "long", "native",
  "new", "null", "package", "private", "protected", "public", "return", "short", "static", "super",
  "switch", "synchronized", "this", "throw", "throws", "transient", "true", "try", "typeof", "var",
  "void", "volatile", "while", "with", "yield"
]

/**
 * 文件前置代码枚举
 */
const __REQUIRE_HEAD__ = {
    'web': "import fetch from '@/utils/fetch'\n",
    'wxa': 'const network = getApp().globalData.network\n'
}

/**
 * api类型
 */
let apiType = 'web';

/**
 * 文件前置代码，一般是导入依赖
 */
let _requireHead = __REQUIRE_HEAD__[apiType]

/**
 * api列表索引
 */
let apisIndex = 0;

/**
 * api列表
 */
let apisArr = [];

/**
 * api数据
 */
let apiDatas = [];

/**
 * 已经生成完毕的api，做校验使用
 */
let isCreatedApi = []

/**
 * 创建api文件的目标目录
 */
let buildPath = "";

/**
 * 进度条
 */
let bar = ''

/**
 * api包名称
 */
let apiPackageName = "api";

/**
 * swagger版本
 */
let swaggerVersion = ""

/**
 * 清空
 * @param { String } dir 目录路径
 */
const clean = function (dir) {
  util.rmdirSync(dir);
  fs.mkdirSync(dir);
}

/**
 * 检查当前api是否已被生成
 * @param {*} pathArr 已生成的api数组
 * @param {*} path 接口路径
 * @param { String } method 接口方法
 */
const checkIsCreate = function (pathArr, path, method) {
  return pathArr.includes(path + '_' + method)
}

/**
 * 转换swagger2数据
 * @param { Object } data 
 * @returns { Object } 转换后的数据
 */
const transformDataForSwagger2 = function(data){
  let apisArr = []
  for (const path in data.paths) {
    const item = data.paths[path]
    for (const method in item) {
      item[method].title = item[method].summary
      item[method]['Content-Type'] = item[method].consumes[0]
      apisArr.push({
        path,
        method,
        ...item[method]
      })
    }
  }
  return apisArr
}

/**
 * 转换swagger3数据
 * @param { Object } data 
 * @returns { Object } 转换后的数据
 */
const transformDataForSwagger3 = function(data){
  let apisArr = []
  data.forEach(item => {
    if(Array.isArray(item.list)){
      item.list.forEach(api => {
        // 提取header中的Content-Type
        if(Array.isArray(api.req_headers)){
          api.req_headers.forEach(header => {
            if(header.name === 'Content-Type'){
              api['Content-Type'] = header.value
            }
          })
        }
      })
    }
    apisArr.push(...item.list)
  })
  return apisArr
}

/**
 * 根据swagger版本转换数据
 * @param { Object } data 
 * @returns { Object } 转换后的数据
 */
const transformDataBySwaggerVersion = function (data) {
  if (swaggerVersion === '2.0') {
    // swagger2
    // 转换对象数据为数组数据
    return transformDataForSwagger2(data)
  }
  // swagger3
  return transformDataForSwagger3(data)
}

/**
 * 构建api
 * @param {String} dir 创建目录路径 /src/api/
 * @param {String} apiName api源目录文件名 api
 * @param {Object} data api数据 json
 * @param {Boolean} isWxa 是否微信小程序 false
 */
const builder = function (dir, apiName, data, isWxa) {
  apiDatas = data; // 缓存到全局
  buildPath = dir;
  apiPackageName = apiName;
  swaggerVersion = data.swagger
  apiType = isWxa ? 'wxa' : 'web'

  // 设置_requireHead
  if (fs.existsSync(`${cwdPath}/rayx.config.json`)) {
    const apiConfig = require(`${cwdPath}/rayx.config.json`).api
    if (apiConfig.requireHead && apiConfig.requireHead[apiType]) {
      _requireHead = apiConfig.requireHead[apiType]
    }
  }

  // 先清空
  clean(buildPath)

  // 根据swagger版本转换数据
  apisArr = transformDataBySwaggerVersion(data)

  // 添加进度条
  let len = apisArr.length
  bar = new ProgressBar('  working [:bar] :current/:total', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: len
  })
  buildOne(apisArr[apisIndex]);
}

/**
 * 生成指定接口api
 * @param {Object} data
 */
const buildOne = function (data) {
  // 处理url数据
  // 待生成的接口
  let urlArr = util.cleanEmptyInArray(data.path.split("/"));
  // 文件生成目录
  let apiPath = buildPath;

  // 拼接出文件路径
  for (let i = 0; i < urlArr.length - 2; i++) {
    apiPath += `${urlArr[i]}/`;
  }

  // 创建api方法名
  let apiFunName = urlArr[urlArr.length - 1];
  // 判断是否是rest风格接口
  apiFunName = apiFunName.indexOf('{') >= 0 ? apiFunName.slice(1, apiFunName.length - 1) : apiFunName

  const API_METHOD = `'${data.method || 'post'}'`;
  const API_NAME = (__KEYWORDS__.includes(apiFunName) ? `_${apiFunName}` : apiFunName) + `_${data.method || 'post'}`;
  const api_describe = data.title
  const API_dESCRIBE = api_describe.split('\n').map(item => '// ' + item.trim()).join('\n');
  const API_URL = `'${util.cleanEmptyInArray(data.path.split("/")).join("/")}'`;
  const API_HEADER = `'Content-Type': '${data['Content-Type']}'`

  // 命名接口文件名称
  let apiFileName = urlArr[urlArr.length - 2] || "other";
  apiFileName = apiFileName.indexOf('{') >= 0 ? apiFileName.slice(1, apiFileName.length - 1) : apiFileName
  apiFileName += ".js"
  // 目标文件路径
  let targetApiFilePath = `${apiPath}${apiFileName}`;
  // 模板文件路径
  let tplApiFilePath = `${TPL_API_PATH}`;
  if (fs.existsSync(targetApiFilePath)) {
    // 检查是否已经存在该接口
    if (checkIsCreate(isCreatedApi, API_URL, API_METHOD)) {
      console.log(chalk.red(`\n  ${API_URL}已存在...继续创建下一个api`))
      bar.tick(1)
      buildNext()
      return
    }

    // 替换模板内容
    let newTplFileContent = fs.readFileSync(__TPL_FILE_CONTENT__[apiType], 'utf-8')
      .replace(/__api_annotation__/g, API_dESCRIBE)
      .replace(/__api_name__/g, API_NAME)
      .replace(/__url__/g, API_URL)
      .replace(/__method__/g, API_METHOD)
      .replace(/__headers__/g, API_HEADER)

    // 写入新内容
    try {
      fs.appendFileSync(targetApiFilePath, `\n${newTplFileContent}`, 'utf8');
      isCreatedApi.push(API_URL + '_' + API_METHOD)
      bar.tick(1)
    } catch (error) {
      console.error(chalk.red(`api ${API_NAME} 创建失败，原因：${error}`));
      return
    }

    buildNext();
  } else {
    // 如果目标文件不存在， 创建目标文件
    gulp.src(__TPL_FILE_CONTENT__[apiType])
      .pipe(rename(apiFileName))
      .pipe(replace('__api_annotation__', API_dESCRIBE))
      .pipe(replace('__api_name__', API_NAME))
      .pipe(replace('__url__', API_URL))
      .pipe(replace('__method__', API_METHOD))
      .pipe(replace('__headers__', API_HEADER))
      .pipe(gulp.dest(apiPath))
      .on("end", () => {
        isCreatedApi.push(API_URL + '_' + API_METHOD)
        prependFile(targetApiFilePath, _requireHead, function (err) {
          if (err) {
            // Error
          }
          // Success
          bar.tick(1)
          buildNext();
        })
      });
  }
}

/**
 * 构建下一个api
 */
const buildNext = function () {
  if (bar.complete) {
    let cmdText = chalk.green(`  ${apiPackageName}生成完毕`)
    slog(cmdText)
    return
  }
  apisIndex++;
  if (apisArr[apisIndex]) {
    buildOne(apisArr[apisIndex]);
  }
}

module.exports = {
  apiBuilder: builder
}