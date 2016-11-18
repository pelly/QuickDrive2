/**
 * Authenticate google user for google drive by OAuth2.
 * @param {Boolean} authenticate interactively
 * @param {Function} callback Function to call when the request is complete.
 */
const auth = (interactive, callback)  => {
  if (gapi.auth.getToken() != null && gapi.client != null && gapi.client.drive != null && gapi.client.drive.files != null) {
    callback()
    return
  }
  chrome.identity.getAuthToken({ 'interactive': interactive }, (token) => {
    if (token == null)
      return
    gapi.auth.setToken({ 'access_token': token })
    gapi.client.load('drive', 'v3', callback)
  })
}

/**
 * Reset google user authentication.
 * @param {Boolean} authenticate interactively
 */
const resetAuth = (interactive) => {
  if (gapi.auth.getToken() == null)
    return

  const token = gapi.auth.getToken()
  chrome.identity.removeCachedAuthToken({ 'token': token.access_token }, () => {
    chrome.identity.getAuthToken({ 'interactive': interactive }, (token) => {
      if (token == null)
        return
      gapi.auth.setToken({ 'access_token': token })
    })
  })
}

/**
 * Retrieve a list of File resources.
 * @param {Object} params to be sent with request. (query params)
 * @param {Function} callback Function to call when the request is complete.
 * @see https://developers.google.com/drive/v3/reference/files/list
 */
const listAllFiles = (reqParams, callback) => {
  const retrievePageOfFiles = (request, result) => {
    request.execute((resp) => {
      result = result.concat(resp.files)
      const nextPageToken = resp.nextPageToken
      if (nextPageToken) {
        // sum up all items if response has multi-pages.
        let nextParams = reqParams
        nextParams.pageToken = nextPageToken
        let nextRequest = gapi.client.drive.files.list(nextParams)
        retrievePageOfFiles(nextRequest, result)
      } else {
        // at last, callback would be called.
        callback(result)
      }
    })
  }
  // initial request.
  const initialRequest = gapi.client.drive.files.list(reqParams)
  retrievePageOfFiles(initialRequest, [])
}

/**
 * Retrieve a list of File resources with limit count.
 * @param {Object} params to be sent with request. (query params)
 * @param {Function} callback Function to call when the request is complete.
 * @param {Integer} maximum count to retrieve files. (default: 0 means leaving it to Google API specification = 100)
 * @param {String} page token to retrieve next page items. (default: null means getting first page items)
 */
const listLimitedFiles = (reqParams, callback, limitCount = 0, pageToken = null) => {
  if (limitCount > 0)
    reqParams.pageSize = limitCount
  if (pageToken)
    reqParams.pageToken = pageToken

  const request = gapi.client.drive.files.list(reqParams)
  request.execute((resp) => {
    callback(resp.files, resp.nextPageToken)
  })
}

const GoogleDrive = {
  auth,
  resetAuth,
  listAllFiles,
  listLimitedFiles
}

export default GoogleDrive
