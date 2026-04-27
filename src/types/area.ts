export type AreaNodeLevel = 1 | 2 | 3

export interface AreaTreeNode {
  id: number
  name: string
  level: AreaNodeLevel
  code?: string
  parentCode?: string
  createTime?: string
  children?: AreaTreeNode[]
}

export interface AreaFormModel {
  id: number
  parentCode: string
  name: string
  code: string
}
