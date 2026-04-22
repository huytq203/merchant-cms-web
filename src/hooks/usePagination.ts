import { useState } from 'react'

interface UsePaginationOptions {
  defaultPage?: number
  defaultPageSize?: number
  defaultSort?: string
  defaultSortBy?: string
}
/**
 * 
 * @param options 
 * @defaultPage default page is 1
 * @defaultPageSize default page size is 10
 * @defaultSort default sort is createdAt
 * @defaultSortBy default sort by is DESC
 * @returns 
 */
const usePagination = (options?: UsePaginationOptions) => {
  const {
    defaultPage = 1,
    defaultPageSize = 10,
    defaultSort = 'createdAt',
    defaultSortBy='DESC'
  } = options || {}

  const [page, setPage] = useState(defaultPage)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [sort, setSort] = useState(defaultSort)
  const [sortBy, setSortBy] = useState(defaultSortBy)

  return {
    /**
     * @abstract
     * @returns {number} page
     */
    page,
    /**
     * @abstract
     * @returns {number} pageSize
     */
    pageSize,
    /**
     * @abstract
     * @returns {string} sort : createdAt, updatedAt, id, ...
     */
    sort,
    /**
     * @abstract
     * @returns {string} sortBy : ASC, DESC
     */
    sortBy,
    size:pageSize,

    setPage,
    setPageSize,
    setSort,
    setSortBy,

    params: {
      page,
      size: pageSize,
      sort,
      sortBy
    }
  }
}

export default usePagination
