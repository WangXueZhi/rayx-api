# CHANGELOG

## [v1.0.6] 2019.9.10
- 修复生成微信小程序接口中增options参数没传的bug

## [v1.0.5] 2019.9.9
- 生成微信小程序接口中增加apiPackageName，方便开发者区分多种渠道接口
```node
exports.xxx = function (options) {
  return network.request({
    method: "POST",
    url: "xxxxx",
    data: options.data || {},
    header: options.header || {},
    apiPackageName: "xxxxx" // 新增apiPackageName
  })
}
```

## [v1.0.3] 2019.9.9
- 修复接口参数处理中找不到参数对象的bug，报错如下：
```node
/Applications/MAMP/htdocs/github/rayx-api/bin/api.js:184
            let properties = apiDatas.types[realType].properties;
                                                      ^
TypeError: Cannot read property 'properties' of undefined
```