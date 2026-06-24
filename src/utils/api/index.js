// 统一导出所有API工具函数
import request from './request'
import { 
  handleResponse, 
  handleApiError, 
  extractData, 
  isResponseSuccess,
  handleApiResponse,
  handleLoading,
  buildQueryParams,
  handlePaginationData
} from './responseHandler'

// 导出所有API工具函数
export {
  request,
  handleResponse,
  handleApiError,
  extractData,
  isResponseSuccess,
  handleApiResponse,
  handleLoading,
  buildQueryParams,
  handlePaginationData
}
