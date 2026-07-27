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
const booleanValue: boolean = true
export const C = () => <div>{booleanValue && <span />}</div>
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
    {
      filename,
      code: `
export const C = () => (
  <div>
    {'content' && <span />}
    {1 && <span />}
    {-1 && <span />}
    {1n && <span />}
    {true && <span />}
  </div>
)
`,
    },
  ],
  invalid: [
    {
      filename,
      code: `
const stringValue: string = 'content'
export const C = () => <div>{stringValue && <span />}</div>
`,
      output: `
const stringValue: string = 'content'
export const C = () => <div>{!!stringValue && <span />}</div>
`,
      errors: [{ messageId: 'conditionErrorFalseyString' }],
    },
    {
      filename,
      code: `
const numberValue: number = 1
export const C = () => <div>{numberValue && <span />}</div>
`,
      output: `
const numberValue: number = 1
export const C = () => <div>{!!numberValue && <span />}</div>
`,
      errors: [{ messageId: 'conditionErrorFalseyNumber' }],
    },
    {
      filename,
      code: `
const first: number = 1
const second: string = 'content'
export const C = () => <div>{first && second && <span />}</div>
`,
      output: `
const first: number = 1
const second: string = 'content'
export const C = () => <div>{!!first && !!second && <span />}</div>
`,
      errors: [
        { messageId: 'conditionErrorFalseyNumber' },
        { messageId: 'conditionErrorFalseyString' },
      ],
    },
    {
      filename,
      code: `
export const C = () => <div>{'' && <span />}</div>
`,
      output: `
export const C = () => <div>{!!'' && <span />}</div>
`,
      errors: [{ messageId: 'conditionErrorFalseyString' }],
    },
    {
      filename,
      code: `
export const C = () => <div>{0 && <span />}</div>
`,
      output: `
export const C = () => <div>{!!0 && <span />}</div>
`,
      errors: [{ messageId: 'conditionErrorFalseyNumber' }],
    },
    {
      filename,
      code: `
const bigintValue: bigint = 1n
export const C = () => <div>{bigintValue && <span />}</div>
`,
      output: `
const bigintValue: bigint = 1n
export const C = () => <div>{!!bigintValue && <span />}</div>
`,
      errors: [{ messageId: 'conditionErrorFalseyNumber' }],
    },
    {
      filename,
      code: `
export const C = () => <div>{0n && <span />}</div>
`,
      output: `
export const C = () => <div>{!!0n && <span />}</div>
`,
      errors: [{ messageId: 'conditionErrorFalseyNumber' }],
    },
    {
      filename,
      code: `
const props: { count: number } = { count: 1 }
export const C = () => <div>{props.count && <span />}</div>
`,
      output: `
const props: { count: number } = { count: 1 }
export const C = () => <div>{!!props.count && <span />}</div>
`,
      errors: [{ messageId: 'conditionErrorFalseyNumber' }],
    },
    {
      filename,
      code: `
declare function getCount(): number
export const C = () => <div>{getCount() && <span />}</div>
`,
      output: `
declare function getCount(): number
export const C = () => <div>{!!getCount() && <span />}</div>
`,
      errors: [{ messageId: 'conditionErrorFalseyNumber' }],
    },
    {
      filename,
      code: `
const a: number = 1
const b: number = 2
export const C = () => <div>{(a + b) && <span />}</div>
`,
      output: `
const a: number = 1
const b: number = 2
export const C = () => <div>{!!(a + b) && <span />}</div>
`,
      errors: [{ messageId: 'conditionErrorFalseyNumber' }],
    },
    {
      filename,
      code: `
const first: number = 1
const second: string = 'content'
export const C = () => <div>{first && (second && <span />)}</div>
`,
      output: `
const first: number = 1
const second: string = 'content'
export const C = () => <div>{!!first && (!!second && <span />)}</div>
`,
      errors: [
        { messageId: 'conditionErrorFalseyNumber' },
        { messageId: 'conditionErrorFalseyString' },
      ],
    },
  ],
})
