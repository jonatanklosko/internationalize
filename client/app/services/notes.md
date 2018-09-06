## Introduction & Wording

Across the app we use so called `processed data`, which is computed from parsed YAML data.
It has its innermost keys of the form:

```js
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

We assume that a key needs many plural forms if and only if it has a sub-key that is one of the pluralization keys (`zero`, `one`, `two`, `few`, `many`, `other`).
Such a key is considered to be innermost and after processing looks like that:

```js
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
  # context: Common phrases.
  common:
    here: "Here"
    # context: Some pluralization stuff.
    day:
      one: "1 day"
      other: "%{count} days"
```

The corresponding `raw data` looks like this:
```js
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


The corresponding `parsed data` looks like this:
```js
{
  hello: { _value: "Hello!" },
  common: {
    _context: "Common phrases.",
    here: { _value: "Here" },
    day: {
      _context: "Some pluralization stuff.",
      _value: {
        one: "1 day",
        other: "%{count days}"
      }
    }
  }
}
```

Now assuming that the target language has pluralization rules `one`, `few` and `other` (e.g. Czech), the data after being processed finally looks like this:

```js
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
  - There is no local translation, but remote translation is outdated (some original values changed).
