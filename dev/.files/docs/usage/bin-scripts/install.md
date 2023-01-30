# `$ madrun install`

<small>Underlying bin script: `./dev/.files/bin/install.mjs`</small>

## Interactive Installs

```bash
$ madrun install project
# Or, `$ madrun install project --mode=dev`
# Mode can be one of: `dev`, `ci`, `stage`, or `prod` (default).
```

You will need a [Dotenv Vault](https://www.dotenv.org) login. Please contact `@jaswrks` or `@brucewrks` to request access. You must also have an environment meeting all [prerequisites](./prerequisites.md), along with the additional credentials noted at the bottom of the prerequisites article.

## Noninteractive Installs (e.g., CI)

```bash
$ npx @clevercanyon/madrun install project --mode=ci
# Mode can be one of: `dev`, `ci`, `stage`, or `prod` (default).
```

In this case we use `npx @clevercanyon/madrun` assuming that a CI, for example, won't have `madrun` installed globally. In noninteractive installs the environment must have the following variables. You must also have an environment meeting all of these [prerequisites](./prerequisites.md), along with the additional credentials noted at the bottom of the prerequisites article.

```bash
USER_DOTENV_KEY_MAIN
USER_DOTENV_KEY_CI # Where `_CI` matches `mode`.
```

These keys can be retrieved by running the following script interactively.

```
$ madrun envs keys
```

## Help

```bash
$ madrun install --help
$ madrun install project --help
$ madrun envs keys --help
$ madrun envs --help
```
