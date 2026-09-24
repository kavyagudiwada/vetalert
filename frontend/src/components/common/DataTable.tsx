import { useMemo, useState } from 'react'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  InputBase,
  IconButton,
  Alert,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import LoadingSpinner from './LoadingSpinner'

export type SortDirection = 'asc' | 'desc'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  render?: (row: T) => ReactNode
  hideOnMobile?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  error?: string | null
  searchable?: boolean
  onSearch?: (query: string) => void
  onSort?: (sortKey: string, direction: SortDirection) => void
  onRowClick?: (row: T) => void
  filters?: ReactNode
  emptyMessage?: string
  page?: number
  pageSize?: number
  totalCount?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  toolbar?: ReactNode
  keyExtractor: (row: T) => string
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  error,
  searchable = true,
  onSearch,
  onSort,
  onRowClick,
  filters,
  emptyMessage,
  page = 0,
  pageSize = 10,
  totalCount,
  onPageChange,
  onPageSizeChange,
  toolbar,
  keyExtractor,
}: DataTableProps<T>) {
  const { t } = useTranslation()
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [localSearch, setLocalSearch] = useState('')

  const filteredData = useMemo(() => {
    if (!onSearch && localSearch) {
      const query = localSearch.toLowerCase()
      return data.filter((row) =>
        columns.some((col) => {
          const value = (row as Record<string, unknown>)[col.key]
          return value != null
            ? String(value).toLowerCase().includes(query)
            : false
        }),
      )
    }
    return data
  }, [data, localSearch, onSearch, columns])

  const handleSort = (key: string) => {
    const isAsc = sortKey === key && sortDirection === 'asc'
    const direction = isAsc ? 'desc' : 'asc'
    setSortKey(key)
    setSortDirection(direction)
    if (onSort) {
      onSort(key, direction)
    }
  }

  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    if (onSearch) onSearch(value)
  }

  const showSearch = searchable && data.length > 0

  return (
    <Paper
      sx={{
        width: '100%',
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: 2,
      }}
    >
      {(showSearch || filters || toolbar) && (
        <Box
          sx={{
            p: 1.5,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          {toolbar}
          {showSearch && (
            <Box
              sx={{
                flex: 1,
                minWidth: 200,
                display: 'flex',
                alignItems: 'center',
                borderRadius: 2,
                bgcolor: alpha('#000', 0.04),
                px: 1,
              }}
            >
              <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
              <InputBase
                placeholder={t('common.search')}
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                sx={{ flex: 1, fontSize: 14 }}
              />
            </Box>
          )}
          {filters}
          <IconButton size="small">
            <FilterListIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      {error ? (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      ) : loading ? (
        <Box sx={{ p: 4 }}>
          <LoadingSpinner />
        </Box>
      ) : filteredData.length === 0 ? (
        <Box sx={{ p: 5, textAlign: 'center' }}>
          {emptyMessage || t('common.noData')}
        </Box>
      ) : (
        <>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      align={column.align || 'left'}
                      sx={{
                        display: column.hideOnMobile
                          ? { xs: 'none', md: 'table-cell' }
                          : undefined,
                        fontWeight: 700,
                        fontSize: 12,
                        textTransform: 'uppercase',
                        color: 'text.secondary',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {column.sortable ? (
                        <TableSortLabel
                          active={sortKey === column.key}
                          direction={
                            sortKey === column.key ? sortDirection : 'asc'
                          }
                          onClick={() => handleSort(column.key)}
                        >
                          {column.label}
                        </TableSortLabel>
                      ) : (
                        column.label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((row) => (
                  <TableRow
                    key={keyExtractor(row)}
                    hover
                    onClick={() => onRowClick?.(row)}
                    sx={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      '&:last-child td, &:last-child th': { border: 0 },
                    }}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        align={column.align || 'left'}
                        sx={{
                          display: column.hideOnMobile
                            ? { xs: 'none', md: 'table-cell' }
                            : undefined,
                          fontSize: 13,
                          whiteSpace: column.align === 'right' ? 'nowrap' : 'normal',
                        }}
                      >
                        {column.render
                          ? column.render(row)
                          : String(
                              (row as Record<string, unknown>)[column.key] ?? '-',
                            )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {(onPageChange || onPageSizeChange) && (
            <TablePagination
              component="div"
              count={totalCount ?? filteredData.length}
              page={Math.min(page, Math.max(0, Math.ceil((totalCount ?? filteredData.length) / pageSize) - 1))}
              rowsPerPage={pageSize}
              onPageChange={(_, newPage) => onPageChange?.(newPage)}
              onRowsPerPageChange={(e) =>
                onPageSizeChange?.(parseInt(e.target.value, 10))
              }
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          )}
        </>
      )}
    </Paper>
  )
}