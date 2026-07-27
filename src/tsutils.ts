import type { Node, Type, TypeChecker, TypeFlags } from 'typescript'



/** Returns all types of a union type or an array containing `type` itself if it's no union type. */
export function unionTypeParts(type: Type): Type[] {
  return type.isUnion() ? type.types : [type]
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