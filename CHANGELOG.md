# CHANGELOG

## [v1.0.3] 2019.9.9
- 修复接口参数处理中找不到参数对象的bug，报错如下：
```node
/Applications/MAMP/htdocs/github/rayx-api/bin/api.js:184
            let properties = apiDatas.types[realType].properties;
                                                      ^
TypeError: Cannot read property 'properties' of undefined
```