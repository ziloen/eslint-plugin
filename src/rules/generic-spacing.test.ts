import { run } from './_test'
import rule, { RULE_NAME, messageId } from './generic-spacing'

const valid = [
  `type Foo<T, K> = T`,
  `type Foo<
  T,
  K,
> = T`,
  `type Foo<T, K> = Record<T, K>`,
  `type Foo<T, K> = Record<
  T,
  K
>`,
  `type Foo<T extends Record<(string & {}) | "a">> = T`
]

const invalid = [
  [`type Foo< T, K > = T`, `type Foo<T, K> = T`, 2],
  [`type Foo<T, K> = Record< T, K >`, `type Foo<T, K> = Record<T, K>`, 2],
  [`type Foo<   T, K > = Record< T, K >`, `type Foo<T, K> = Record<T, K>`, 4],
  [`type Foo<
T, K
> = Record< T, K >`, `type Foo<
T, K
> = Record<T, K>`, 2],
  [`type Foo<T=any, K=any> = T`, `type Foo<T = any, K = any> = T`, 2]
] as const

run({
  name: RULE_NAME,
  rule,
  valid,
  invalid: invalid.map(i => ({
    code: i[0],
    output: i[1].trim(),
    errors: Array.from({ length: i[2] || 1 }, () => ({ messageId }))
  }))
})