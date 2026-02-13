import { run } from './_test'
import rule, { RULE_NAME } from './jsx-strict-logical-expressions'

const filename = 'src/rules/jsx-strict-logical-expressions.test.tsx'

run({
  name: RULE_NAME,
  rule,
  configs: {
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
        projectService: {
          allowDefaultProject: ['src/rules/jsx-strict-logical-expressions.test.tsx'],
        },
        tsconfigRootDir: process.cwd(),
      },
    },
  },
  valid: [
    {
      filename,
      code: `
const flag: boolean = true
export const C = () => <div>{flag && <span />}</div>
`,
    },
    {
      filename,
      code: `
const text: string = 'ok'
export const C = () => <div>{text && <span />}</div>
`,
      options: [{ allowString: true }],
    },
    {
      filename,
      code: `
const count: number = 1
export const C = () => <div>{count && <span />}</div>
`,
      options: [{ allowNumber: true }],
    },
  ],
  invalid: [
    {
      filename,
      code: `
const text: string = 'ok'
export const C = () => <div>{text && <span />}</div>
`,
      output: `
const text: string = 'ok'
export const C = () => <div>{!!text && <span />}</div>
`,
      errors: [{ messageId: 'conditionErrorFalseyString' }],
    },
    {
      filename,
      code: `
const count: number = 1
export const C = () => <div>{count && <span />}</div>
`,
      output: `
const count: number = 1
export const C = () => <div>{!!count && <span />}</div>
`,
      errors: [{ messageId: 'conditionErrorFalseyNumber' }],
    },
    {
      filename,
      code: `
const a: number = 1
const b: string = 'ok'
export const C = () => <div>{a && b && <span />}</div>
`,
      output: `
const a: number = 1
const b: string = 'ok'
export const C = () => <div>{!!a && !!b && <span />}</div>
`,
      errors: [
        { messageId: 'conditionErrorFalseyNumber' },
        { messageId: 'conditionErrorFalseyString' },
      ],
    },
  ],
})