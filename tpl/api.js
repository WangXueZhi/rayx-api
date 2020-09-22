__api_annotation__
export function __api_name__(options) {
  return fetch({
    url: __url__,
    method: __method__,
    headers: __headers__,
    data: (options && options.data) || {}
  })
}
