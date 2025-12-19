import type { Node, Type, TypeChecker, TypeFlags, UnionType } from 'typescript'


export function isUnionType(type: Type): type is UnionType {
  // 1048576: TypeFlags.Union
  return (type.flags & 1048576) !== 0
}

/** Returns all types of a union type or an array containing `type` itself if it's no union type. */
export function unionTypeParts(type: Type): Type[] {
  return isUnionType(type) ? type.types : [type]
}

export function isTypeFlagSet(type: Type, flag: TypeFlags): boolean {
  return (type.flags & flag) !== 0
}

/**
 * Resolves the given node's type. Will resolve to the type's generic constraint, if it has one.
 */
export function getConstrainedTypeAtLocation(
  checker: TypeChecker,
  node: Node
): Type {
  const nodeType = checker.getTypeAtLocation(node)
  const constrained = checker.getBaseConstraintOfType(nodeType)

  return constrained ?? nodeType
}