import type { ESLint } from "eslint"
import genericSpacing from './rules/generic-spacing'
import jsxStrictLogicalExpressions from './rules/jsx-strict-logical-expressions'

const ziloen = {
  rules: {
    'generic-spacing': genericSpacing,
    'jsx-strict-logical-expressions': jsxStrictLogicalExpressions,
  }
}

export default ziloen as unknown as ESLint.Plugin