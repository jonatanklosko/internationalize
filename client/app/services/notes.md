## Introduction & Wording

Across the app we use so called `processed data`, which is computed from a `raw data` (parsed from YAML to JSON).
It has its innermost keys changed from the original form to an object:

```javascript
{
  _original: '<original value>',
  _translated: '<translated value>'
}
```

In most cases a `key` apart from the standard meaning, refers to the innermost key of a translation data.
For example `en.common.here` with a value of `{ _original: 'Here', _translated: 'Ici' }`.

See the [Example](#example) section for clarification.

*Note: we don't store a root key such as `en` or `fr` in a processed data in order to simplify many things.*

## Pluralization

We assume that a key needs many plural forms if and only if it has the `other` sub-key.
Such a key is considered to be innermost and after processing looks like that:

```javascript
{
  _original: { one: 'book', other: '%{count} books' },
  _translated: { one: '...', few: '...', other: '...' },
  _pluralization: true
}
```

Pluralization keys (e.g. `zero`, `one`, `few`, `other`) for the translated version are inferred from the target locale and compatible with the [rails-i18n](https://github.com/svenfuchs/rails-i18n) gem.

## Example

Consider the following YAML source file in English:

```yaml
en:
  hello: "Hello!"
  common:
    here: "Here"
    day:
      one: "1 day"
      other: "%{count} days"
```

The parsed `raw data` it looks like this. Nothing fancy.

```javascript
{
  hello: "Hello!",
  common: {
    here: "Here",
    day: {
      one: "1 day",
      other: "%{count days}"
    }
  }
}
```

Now assuming that the target language has pluralization rules `one`, `few` and `other` (e.g. Czech), the data after being processed finally looks like this.

```javascript
{
  hello: {
    _original: "Hello!",
    _translated: null
  },
  common: {
    here: {
      _original: "Here",
      _translated: null
    },
    day: {
      _original: {
        one: "1 day",
        other: "%{count days}"
      },
      _translated: {
        one: null,
        few: null,
        other: null
      },
      _pluralization: true
    }
  }
}
```

## Synchronization scenarios

There are numerous possibilities when doing a synchronization with a remote. Here's a list of them.

1. Everything is up do date.
2. Changes are straightforward (doesn't conflict with the user's work).
  - Some keys that haven't been translated yet are removed.
  - Some new keys that needs to be translated are added.
  - Translations for some keys that haven't been translated yet are added.
  - Both new keys and their translations are added.
  - Some keys with ignored values (e.g. an empty string) are added.
3. Changes conflicts with the user's work.
  - Some keys that have already been translated are removed.
  - Some original values (i.e. some original phrases) are changed.
  - Some translated values (i.e. some translated phrases) are changed. They differ from those stored in the application.
