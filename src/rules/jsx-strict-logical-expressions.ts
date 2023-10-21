/**
 * Copied from https://github.com/hluisson/eslint-plugin-jsx-expressions
 */

import { ESLintUtils, TSESTree } from '@typescript-eslint/utils'
import { isTypeFlagSet, unionTypeParts } from "tsutils"
import { TypeFlags } from 'typescript'
import { getConstrainedTypeAtLocation } from '../tsutils'
import { createEslintRule } from '../utils'

type Options = [
  {
    allowString?: boolean
    allowNumber?: boolean
  }
]

type MessageIds = 'conditionErrorFalseyString' | 'conditionErrorFalseyNumber'

export const RULE_NAME = 'jsx-strict-logical-expressions'

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

const jsxStrictLogicalExpressions = createEslintRule<Options, MessageIds>({
  name: RULE_NAME,
  defaultOptions: [{ allowString: false, allowNumber: false }],
  meta: {
    docs: {
      description: 'Forbid non-boolean falsey values in inline expressions',
      recommended: 'strict',
    },
    fixable: 'code',
    type: 'problem',
    schema: [
      {
        type: 'object',
        properties: {
          allowString: { type: 'boolean' },
          allowNumber: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      conditionErrorFalseyString:
        'Potentially falsey string in logical AND expression. Please use boolean.',
      conditionErrorFalseyNumber:
        'Potentially falsey number in logical AND expression. Please use boolean.',
    },
  },

  create(context, [options]) {
    const parserServices = ESLintUtils.getParserServices(context)
    const typeChecker = parserServices.program.getTypeChecker()

    function checkIdentifier(
      node: TSESTree.Identifier
    ): MessageIds | undefined {
      const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node)
      const types = unionTypeParts(
        getConstrainedTypeAtLocation(typeChecker, tsNode)
      )

      const hasPotentiallyFalseyString = types.some(
        type =>
          isTypeFlagSet(type, TypeFlags.StringLike) &&
          (!type.isStringLiteral() || type.value === '')
      )

      if (!options.allowString && hasPotentiallyFalseyString) {
        return 'conditionErrorFalseyString'
      }

      const hasPotentiallyFalseyNumber = types.some(
        type =>
          isTypeFlagSet(
            type,
            TypeFlags.NumberLike | TypeFlags.BigIntLike
          ) &&
          (!type.isNumberLiteral() || type.value === 0)
      )

      if (!options.allowNumber && hasPotentiallyFalseyNumber) {
        return 'conditionErrorFalseyNumber'
      }

      return
    }

    function checkAndReportIdentifier(
      node: TSESTree.Identifier,
      fixNode: TSESTree.Expression
    ) {
      const errorId = checkIdentifier(node)
      if (errorId) {
        context.report({
          node,
          messageId: errorId,
          fix: fixer => fixer.insertTextBefore(fixNode, '!!'),
        })
      }
    }

    // Return the core identifier or expression
    function determineNode(originalNode: TSESTree.Expression) {
      let nodeToEvaluate = originalNode
      if (nodeToEvaluate.type === TSESTree.AST_NODE_TYPES.ChainExpression) {
        nodeToEvaluate = nodeToEvaluate.expression
      }

      if (
        nodeToEvaluate.type === TSESTree.AST_NODE_TYPES.MemberExpression &&
        nodeToEvaluate.property.type !==
        TSESTree.AST_NODE_TYPES.PrivateIdentifier
      ) {
        nodeToEvaluate = nodeToEvaluate.property
      }

      return nodeToEvaluate
    }

    function checkLogicalExpression(
      expressionNode: TSESTree.LogicalExpression,
      checkRightNode: boolean
    ) {
      const leftNode = determineNode(expressionNode.left)

      if (leftNode.type === TSESTree.AST_NODE_TYPES.LogicalExpression) {
        checkLogicalExpression(leftNode, true)
      } else if (leftNode.type === TSESTree.AST_NODE_TYPES.Identifier) {
        checkAndReportIdentifier(leftNode, expressionNode.left)
      }

      if (checkRightNode) {
        const rightNode = determineNode(expressionNode.right)

        if (rightNode.type === TSESTree.AST_NODE_TYPES.Identifier) {
          checkAndReportIdentifier(rightNode, expressionNode.right)
        }
      }
    }

    function checkJSXExpression(node: TSESTree.JSXExpressionContainer) {
      if (
        node.expression.type === TSESTree.AST_NODE_TYPES.LogicalExpression &&
        node.expression.operator === '&&'
      ) {
        checkLogicalExpression(node.expression, false)
      }
    }

    return {
      JSXExpressionContainer: checkJSXExpression,
    }
  },
})

export default jsxStrictLogicalExpressions