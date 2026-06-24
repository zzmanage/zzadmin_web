// 统一API入口文件
import * as auth from './auth'
import * as user from './user'
import * as role from './role'
import * as menu from './menu'
import * as dept from './dept' // 部门API模块，使用dept名称保持一import * as post from './post'
import * as loginLog from './loginLog'
import * as operationLog from './operationLog'
import * as dictionary from './dictionary'
import * as task from './task'
import * as message from './message'
import * as whiteList from './whiteList'
import * as stats from './stats'

import * as permission from './permission'
import * as captcha from './captcha'
import * as menuButton from './menuButton'
import * as button from './button'
import * as tenant from './tenant'

// 导出所有API模块
export {
  auth,
  user,
  role,
  menu,
  dept,
  post,
  loginLog,
  operationLog,
  dictionary,
  task,
  message,
  whiteList,
  stats,
  permission,
  captcha,
  menuButton,
  button,
  tenant,
}

// 默认导出所有API模块，确保与services/index.js的导出方式兼容
export default {
  auth,
  user,
  role,
  menu,
  dept,
  post,
  loginLog,
  operationLog,
  dictionary,
  task,
  message,
  whiteList,
  stats,
  permission,
  captcha,
  menuButton,
  button,
  tenant,
}

// 导出所有API模块，支持解构导出
const allApis = {
  auth,
  user,
  role,
  menu,
  dept,
  post,
  loginLog,
  operationLog,
  dictionary,
  task,
  message,
  whiteList,
  stats,
  permission,
  captcha,
  menuButton,
  button,
  tenant,
}

export { allApis }