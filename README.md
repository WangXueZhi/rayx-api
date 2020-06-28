# rayx-api
以swagger导出的json文件作为数据源，自动化生成接口调用代码，支持swagger2和swagger3的数据源

### 安装
```
npm install rayx-api -g
```

### 使用

1. 基础命令：rayx-api --source=[source] --target=[target] --wxa
2. source：json文件源名称，默认"api"
3. target: 生成代码的目标目录，必填
4. wxa：生成适用于微信小程序的代码

### example

命令
```
rayx-api --source=api --target=src/api
```

生成
```javascript
// 默认的requireHead, 可在项目中增加配置文件自定义
import fetch from '@/utils/fetch' 

// 获取用户信息
export function info_get(options) {
  return fetch({
    url: 'user/info',
    method: 'get',
    headers: {'Content-Type': 'application/json', ...(options && options.headers ? options.headers : {})},
    data: (options && options.data) || {}
  })
}
```

### 配置文件
在项目根目录下增加文件rayx.config.json，增加如下配置

```json
{
    "api": {
        "requireHead": {
            "web": "import { fetch } from '@/utils/http'\n", // 浏览器端使用
            "wxa": "const network = getApp().globalData.network\n" // 微信小程序端使用
        }
    }
}
```