import { TypeFlags, type Node, type Type, type TypeChecker, type UnionType } from 'typescript'


export function isUnionType(type: Type): type is UnionType {
  return (type.flags & TypeFlags.Union) !== 0
}

/** Returns all types of a union type or an array containing `type` itself if it's no union type. */
export function unionTypeParts(type: Type): Type[] {
  return isUnionType(type) ? type.types : [type]
}


function isFlagSet(obj: { flags: number }, flag: number) {
  return (obj.flags & flag) !== 0
}

export const isTypeFlagSet: (type: Type, flag: TypeFlags) => boolean = isFlagSet



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