const fs = require('fs')
const axios = require('axios')
const setCookie = require('set-cookie-parser')
const apiConfig = require('../api.config.json')
const path = require('path')
const { apiBuilder } = require('rayx-api/bin/api')

let shouldBuildApi = false

const config_argv = process.env?.npm_config_argv
const original_argv = JSON.parse(config_argv)?.original
console.log('original_argv >', original_argv)
let ignoreApiNameForUrl = false // 为ture时不为生成的接口地址添加同名前缀
if (original_argv.includes('--ignore-api-name-for-url')) {
  ignoreApiNameForUrl = true
}

const params = process.argv.slice(2)
const proIdList = []
params.forEach((name) => {
  if (name.includes('TYPE=build')) {
    shouldBuildApi = true
    return
  }
  if (apiConfig.projectIdMap[name]) {
    proIdList.push({
      name,
      id: apiConfig.projectIdMap[name],
    })
  } else {
    console.warn(`${name}找不到id`)
  }
})
console.log('待处理列表:', proIdList)

// 根据api路径构建api
const buildApiByPath = function (projectName, apiName, apiJsonFilePath) {
  if (!projectName || !apiName || !apiJsonFilePath) {
    console.error(`projectName, apiName, apiJsonFilePath 参数缺少`)
    return
  }
  if (fs.existsSync(apiJsonFilePath)) {
    const apiJson = require(apiJsonFilePath)
    apiBuilder(apiJson, {
      root: projectName,
      apiName,
      envTypes: ['client', 'server', 'mock'],
      forceCover: true,
      ignoreApiNameForUrl,
    })
  } else {
    console.error(`${apiJsonFilePath} 文件不存在`)
  }
}

// 根据api数据构建api
// const buildApiByData = function (projectName, apiName, apiJsonData) {
//   if (!projectName || !apiName || !apiJsonData) {
//     console.error(`projectName, apiName, apiJsonFilePath 参数缺少`)
//     return
//   }
//   apiBuilder(apiJsonData, {
//     root: projectName,
//     apiName,
//     envTypes: ['client', 'server', 'mock'],
//     forceCover: true,
//     ignoreApiNameForUrl,
//   })
// }

const login = function () {
  return axios({
    method: 'post',
    url: 'http://yapi.login.api.url',
    headers: {
      'Content-Type': 'application/json',
    },
    data: JSON.stringify({
      email: 'email',
      password: 'pwd',
    }),
  }).then((res) => {
    const cookies = setCookie.parse(res, {
      decodeValues: true, // default: true
      map: true,
    })
    return `_yapi_token=${cookies['_yapi_token'].value};_yapi_uid=${res.data.data.uid}`
  })
}

const downloadApi = function (token, project) {
  console.log(`下载开始:${project.name}`)
  return axios({
    method: 'get',
    url: `http://yapi.login.api.url/export?type=json&pid=${project.id}&status=all&isWiki=false`,
    headers: {
      Cookie: token,
    },
    responseType: 'stream',
  }).then((res) => {
    const projectPath = path.resolve(__dirname, `api-json/${project.name}.json`)
    const streamWriter = fs.createWriteStream(projectPath)
    res.data.pipe(streamWriter)
    streamWriter.on('finish', () => {
      console.log(`下载完成:${project.name}`)
      if (shouldBuildApi) {
        console.log(`开始生成代码:${project.name}`)
        buildApiByPath(project.name, project.name, projectPath)
      }
    })
    streamWriter.on('error', (error) => console.error(`streamWriter: 文件写入异常${error}`))
  })
}

const main = async function () {
  const token = await login()
  const allfecth = proIdList.map((project) => {
    return downloadApi(token, project)
  })
  Promise.all(allfecth)
}

main()
