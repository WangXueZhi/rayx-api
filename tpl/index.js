const context = require.context('./', true, /\.js$/)
const api = {}
context.keys().forEach((key) => {
  let keyPath = key.replace('./', '').replace('.js', '')
  if (keyPath != 'index') {
    const module = context(key)
    if (keyPath === 'other') {
      createApiPropByModule(api, module)
    } else if (keyPath.includes('/')) {
      const keyPathArr = keyPath.split('/')
      const lastApi = keyPathArr.reduce(
        (currentApi, prop, currentIndex, arr) => {
          const propName = kebabCaseToSmallCamelCase(prop)
          if (!currentApi[propName]) {
            currentApi[propName] = {}
          }
          return currentApi[propName]
        },
        api
      )
      createApiPropByModule(lastApi, module)
    } else {
      const keyName = kebabCaseToSmallCamelCase(keyPath)
      api[keyName] = {}
      createApiPropByModule(api[keyName], module)
    }
  }
})

function createApiPropByModule (apiProp, module) {
  for (let fn in module) {
    apiProp[fn] = module[fn]
  }
}

function kebabCaseToSmallCamelCase(name) {
  let nameArr = []
  if (name.indexOf('-') >= 0) {
    nameArr = name.split('-')
    for (let i = 0; i < nameArr.length; i++) {
      if (i > 0) {
        nameArr[i] =
          nameArr[i].substring(0, 1).toUpperCase() + nameArr[i].substring(1)
      }
    }
  } else {
    nameArr[0] = name.substring(0, 1).toLowerCase() + name.substring(1)
  }
  return nameArr.join('')
}
export default api
