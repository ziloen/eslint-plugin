/**
 * https://github.com/hluisson/eslint-plugin-jsx-expressions
 */
import { getConstrainedTypeAtLocation } from '@typescript-eslint/type-utils'
import type { TSESTree } from '@typescript-eslint/utils'
import {
    ASTUtils,
    AST_NODE_TYPES,
    ESLintUtils,
} from '@typescript-eslint/utils'

import { createEslintRule } from '../utils'

type Options = [
  {
    allowString?: boolean
    allowNumber?: boolean
  },
]

const messages = {
  conditionErrorFalseyString:
    'Potentially falsy string in logical AND expression. Please use a boolean.',
  conditionErrorFalseyNumber:
    'Potentially falsy number or bigint in logical AND expression. Please use a boolean.',
}

type MessageIds = keyof typeof messages

export const RULE_NAME = 'jsx-strict-logical-expressions'

const jsxStrictLogicalExpressions = createEslintRule<
  Options,
  MessageIds
>({
  name: RULE_NAME,

  defaultOptions: [{ allowString: false, allowNumber: false }],

  meta: {
    type: 'problem',
    fixable: 'code',

    docs: {
      description:
        'Forbid non-boolean falsy values in JSX logical AND expressions',
    },

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

    messages,
  },

  create(
    context,
    [
      {
        allowString = false,
        allowNumber = false,
      },
    ],
  ) {
    const services = ESLintUtils.getParserServices(context)
    const checker = services.program.getTypeChecker()

    const stringType = checker.getStringType()
    const numberType = checker.getNumberType()
    const bigintType = checker.getBigIntType()

    /**
     * Returns true when `value` is TypeScript's internal representation
     * of a non-zero bigint literal.
     */
    function isNonZeroBigIntLiteralValue(
      value: unknown,
    ): boolean {
      return (
        typeof value === 'object' &&
        value !== null &&
        'base10Value' in value &&
        typeof value.base10Value === 'string' &&
        value.base10Value !== '0'
      )
    }

    /**
     * Determines which diagnostic, if any, applies to a condition.
     */
    function getConditionError(
      node: TSESTree.Expression,
    ): MessageIds | undefined {
      const type = getConstrainedTypeAtLocation(
        services,
        node,
      )

      const typeParts = type.isUnion()
        ? type.types
        : [type]

      let hasPotentiallyFalsyString = false
      let hasPotentiallyFalsyNumber = false

      for (const typePart of typeParts) {
        /*
         * Literal types can be checked precisely.
         *
         * '' is falsy, but 'value' is always truthy.
         */
        if (typePart.isStringLiteral()) {
          hasPotentiallyFalsyString ||= typePart.value === ''
          continue
        }

        /*
         * 0 and -0 are falsy, but other number literals
         * are always truthy.
         */
        if (typePart.isNumberLiteral()) {
          hasPotentiallyFalsyNumber ||= typePart.value === 0
          continue
        }

        const baseType =
          checker.getBaseTypeOfLiteralType(typePart)

        /*
         * Broad string-like types may contain ''.
         *
         * This also conservatively handles template-literal
         * and string-mapping types that reduce to string.
         */
        if (baseType === stringType) {
          hasPotentiallyFalsyString = true
          continue
        }

        /*
         * Broad number types may contain 0 or NaN.
         */
        if (baseType === numberType) {
          hasPotentiallyFalsyNumber = true
          continue
        }

        /*
         * Broad bigint may contain 0n.
         *
         * Bigint literal values use TypeScript's PseudoBigInt
         * representation instead of JavaScript's native bigint.
         */
        if (baseType === bigintType) {
          const value =
            'value' in typePart
              ? typePart.value
              : undefined

          hasPotentiallyFalsyNumber ||=
            !isNonZeroBigIntLiteralValue(value)
        }
      }

      if (
        !allowString &&
        hasPotentiallyFalsyString
      ) {
        return 'conditionErrorFalseyString'
      }

      if (
        !allowNumber &&
        hasPotentiallyFalsyNumber
      ) {
        return 'conditionErrorFalseyNumber'
      }

      return undefined
    }

    /**
     * Flattens:
     *
     *     a && b && <Component />
     *
     * into:
     *
     *     [a, b, <Component />]
     *
     * Every operand except the final one acts as a condition.
     */
    function collectAndOperands(
      node: TSESTree.Expression,
      operands: TSESTree.Expression[] = [],
    ): TSESTree.Expression[] {
      if (
        node.type === AST_NODE_TYPES.LogicalExpression &&
        node.operator === '&&'
      ) {
        collectAndOperands(node.left, operands)
        collectAndOperands(node.right, operands)
      } else {
        operands.push(node)
      }

      return operands
    }

    function reportCondition(
      node: TSESTree.Expression,
    ): void {
      const messageId = getConditionError(node)

      if (!messageId) {
        return
      }

      context.report({
        node,
        messageId,

        fix: fixer => {
          const canPrefixDirectly =
            node.type === AST_NODE_TYPES.Identifier ||
            node.type === AST_NODE_TYPES.Literal ||
            node.type === AST_NODE_TYPES.MemberExpression ||
            node.type === AST_NODE_TYPES.CallExpression ||
            node.type === AST_NODE_TYPES.ChainExpression

          if (canPrefixDirectly) {
            return fixer.insertTextBefore(node, '!!')
          }

          if (
            ASTUtils.isParenthesized(
              node,
              context.sourceCode,
            )
          ) {
            const openingParen =
              context.sourceCode.getTokenBefore(node)

            if (openingParen?.value === '(') {
              return fixer.insertTextBefore(openingParen, '!!')
            }
          }

          return [
            fixer.insertTextBefore(node, '!!('),
            fixer.insertTextAfter(node, ')'),
          ]
        },
      })
    }

    return {
      JSXExpressionContainer(
        node: TSESTree.JSXExpressionContainer,
      ): void {
        const expression = node.expression

        if (
          expression.type !==
          AST_NODE_TYPES.LogicalExpression ||
          expression.operator !== '&&'
        ) {
          return
        }

        const operands = collectAndOperands(expression)

        // The last operand is the rendered result, not a condition.
        for (
          let index = 0;
          index < operands.length - 1;
          index += 1
        ) {
          reportCondition(operands[index])
        }
      },
    }
  },
})

export default jsxStrictLogicalExpressions
