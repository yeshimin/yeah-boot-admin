export type AreaNodeLevel = 1 | 2 | 3

export interface AreaTreeNode {
  id: number
  treeKey: string
  name: string
  level: AreaNodeLevel
  code?: string
  parentCode?: string
  createTime?: string
  children?: AreaTreeNode[]
  isPlaceholder?: boolean
}

export interface AreaFormModel {
  id: number
  parentCode: string
  name: string
  code: string
}
