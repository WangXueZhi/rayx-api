_API_ANNOTATION_
export function _API_NAME___API_METHOD_LOWER_(options) {
  return axiosClient({
    url: '/api/_API_PROJECT_/_API_PATH_',
    method: '_API_METHOD_UPPER_',
    headers: _API_HEADERS_,
    _API_DATA_: (options && options.data) || {},
  })
}
