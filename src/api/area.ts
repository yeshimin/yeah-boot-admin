import { request } from '@/utils/request'
import type { PageResponse } from '@/types/api'

export function getAreaTree(maxLevel = 2) {
  return request<unknown[]>({
    url: '/area/tree',
    method: 'get',
    params: {
      maxLevel,
    },
  })
}

export function getProvinceDetail(id: number) {
  return request<Record<string, unknown>>({
    url: '/area/province/crud/detail',
    method: 'get',
    params: { id },
  })
}

export function createProvince(data: Record<string, unknown>) {
  return request<void>({
    url: '/area/province/crud/create',
    method: 'post',
    data,
  })
}

export function updateProvince(data: Record<string, unknown>) {
  return request<void>({
    url: '/area/province/crud/update',
    method: 'post',
    data,
  })
}

export function deleteProvinces(ids: number[]) {
  return request<void>({
    url: '/area/province/crud/delete',
    method: 'post',
    data: ids,
  })
}

export function getCityDetail(id: number) {
  return request<Record<string, unknown>>({
    url: '/area/city/crud/detail',
    method: 'get',
    params: { id },
  })
}

export function queryCities(params: Record<string, unknown>) {
  return request<PageResponse<Record<string, unknown>>>({
    url: '/area/city/crud/query',
    method: 'get',
    params,
  })
}

export function createCity(data: Record<string, unknown>) {
  return request<void>({
    url: '/area/city/crud/create',
    method: 'post',
    data,
  })
}

export function updateCity(data: Record<string, unknown>) {
  return request<void>({
    url: '/area/city/crud/update',
    method: 'post',
    data,
  })
}

export function deleteCities(ids: number[]) {
  return request<void>({
    url: '/area/city/crud/delete',
    method: 'post',
    data: ids,
  })
}

export function queryDistricts(params: Record<string, unknown>) {
  return request<PageResponse<Record<string, unknown>>>({
    url: '/area/district/crud/query',
    method: 'get',
    params,
  })
}

export function getDistrictDetail(id: number) {
  return request<Record<string, unknown>>({
    url: '/area/district/crud/detail',
    method: 'get',
    params: { id },
  })
}

export function createDistrict(data: Record<string, unknown>) {
  return request<void>({
    url: '/area/district/crud/create',
    method: 'post',
    data,
  })
}

export function updateDistrict(data: Record<string, unknown>) {
  return request<void>({
    url: '/area/district/crud/update',
    method: 'post',
    data,
  })
}

export function deleteDistricts(ids: number[]) {
  return request<void>({
    url: '/area/district/crud/delete',
    method: 'post',
    data: ids,
  })
}
