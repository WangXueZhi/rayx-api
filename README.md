# bm-api

以 swagger 导出的 json 文件作为数据源，自动化生成接口调用代码，支持 swagger2 和 swagger3 的数据源

### 安装

.npmrc 中添加，指定@bm 命名空间下的依赖从私有 npm 中拉取

```
@bm:registry=http://npm.bitmartpro.com/
```

```
npm install @bm/api -g
```

### 使用

1. 基础命令：bm-api --server --client --source=[资源路径]
2. --source=[资源路径]：json 文件源名称，默认"api"
3. --s=[资源路径]：--source
4. --force：当已存在项目接口目录，程序会被中断，需要强制覆盖
5. --f：--force
6. --s=[资源路径]：json 文件源名称，默认"api"
7. --server: 根据 api.config.json 中的 server 配置项生成
8. --client: 根据 api.config.json 中的 client 配置项生成

### api.config.json

```json
{
  "server": {
    // server配置
    "flatLevel": true, // 打平目录结构， 默认false
    "tplPath": "/tpl/server.js", // 指定模板文件
    "targetPath": "server", // 生成目标目录
    "requireHead": "import { fetch } from '@/utils/http'\n", // 生成文件的头部导入代码
    "exclude": ["/admin/"], // 过滤掉以"/admin/"开头的url的接口
    "include": ["/admin/"], // 过滤掉非"/admin/"开头的url的接口
    "fileType": "ts", // 生成的文件类型
    "layoutPath": "/tpl/layout.js", // 可以完全自定义生成的文件结构，如果指定该项，将会忽略requireHead选项
  },
  "client": {
    // client配置
    "annotationParam": true, // 是否在注释中生成接口参数说明，默认false
    "tplPath": "/tpl/client.js",
    "targetPath": "client",
    "requireHead": "import { fetch } from '@/utils/http'\n"
  }
}
```

### 模板替换符说明

```js
_API_ANNOTATION_;
export const _API_NAME_ = async (req, res) => {
  req.headers.oriUrl = "/_API_PROJECT_/_API_PATH___API_METHOD_";
  axiosServer({
    method: "_API_METHOD_",
    url: `${baseMainurl}/_API_PROJECT_/_API_PATH_`,
    _API_DATA_: req.body,
    headers: req.headers,
  })
    .then(responseWrap(req, res))
    .catch(errorResponse(req, res));
};

_API_ANNOTATION_ => // 方法注释
_API_NAME_ => // 方法名
_API_PROJECT_ => // 接口所属项目
_API_PATH_ => // 接口路径
_API_METHOD_UPPER_ => // 大写接口方法
_API_METHOD_LOWER_ => // 小写接口方法
_API_DATA_ => // 参数类型，会根据接口方法生成 params 或 data
```

```js
// layout
import { Express } from 'express';
import { axiosServer } from '../server-root/axiosServer';
import { baseMainurl } from '../server-root/server-path';
import { responseWrap, errorResponse } from '../server-root/responseWrap';

export default (server: Express, prefix: string) => {
  // _API_CODE_
};

// _API_CODE_ => 生成的接口代码
```

### example

模板

```js
// client
_API_ANNOTATION_
export function _API_NAME_(options) {
  return fetch({
    url: '/_API_PROJECT_/_API_PATH_',
    method: '_API_METHOD_',
    headers: _API_HEADERS_,
    _API_DATA_: (options && options.data) || {}
  })
}

// server
_API_ANNOTATION_
export const _API_NAME_ = async (req, res) => {
  req.headers.oriUrl = "/_API_PROJECT_/_API_PATH___API_METHOD_UPPER_";
  axiosServer({
    method: "_API_METHOD_UPPER_",
    url: `${baseMainurl}/_API_PROJECT_/_API_PATH_`,
    _API_DATA_: req.body,
    headers: req.headers,
  })
    .then(responseWrap(req, res))
    .catch(errorResponse(req, res));
};
app._API_METHOD_LOWER_('/api/_API_PROJECT_/_API_PATH_', _API_NAME_)
```

命令

```
bm-api --server --client --sourve=nft-market
```

生成

```javascript
/**
 * 确认购买
 * @property {Object} options.data 接口参数
 * @property {text} options.data.nftId nft主键
 * @property {text} options.data.purchaseUserId 购买用户
 * @property {text} options.data.purchaseUserName 购买用户名
 */
export function confirmBuy(options) {
  return fetch({
    url: "/nft-market/nft/confirmBuy",
    method: "POST",
    headers: options && options.headers ? options.headers : {},
    data: (options && options.data) || {},
  });
}

/**
* 确认购买
*/
export const confirmBuy = async (req, res) => {
  req.headers.oriUrl = "/nft-market/nft/confirmBuy_POST";
  axiosServer({
    method: "POST",
    url: `${baseMainurl}/nft-market/nft/confirmBuy`,
    data: req.body,
    headers: req.headers,
  })
    .then(responseWrap(req, res))
    .catch(errorResponse(req, res));
};
app.post('/api/nft-market/nft/confirmBuy', confirmBuy)
```
