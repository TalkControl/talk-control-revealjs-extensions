---
name: release
description: >
  Publie une nouvelle version du package npm @talk-control/talk-control-revealjs-extensions.
  Utilise ce skill dès que l'utilisateur mentionne "release", "publier", "publish", "npm publish",
  "nouvelle version", "bump version", "tag", ou veut livrer une version sur npm.
  Le skill guide pas à pas : vérification du working tree, choix du bump, build, tests, commit, tag, push, publish.
---

# Release — Publication npm

## Étapes

### 1. Vérifier que le working tree est propre

```bash
git status --porcelain
```

Si la sortie est non vide, **arrête-toi** et demande à l'utilisateur de commiter ou stasher ses changements avant de continuer. Ne pas procéder avec un working tree sale.

### 2. Demander le type de bump

Utilise `AskUserQuestion` pour demander le type de bump :
- **patch** — correction de bug, rétrocompatible (ex: 1.0.0-rc-5 → 1.0.0-rc-6)
- **minor** — nouvelle fonctionnalité rétrocompatible
- **major** — breaking change

Affiche aussi la version actuelle lue dans `package.json` pour que l'utilisateur sache d'où on part.

### 3. Calculer et appliquer la nouvelle version

Lis la version dans `package.json`, calcule la nouvelle version selon le bump choisi, puis mets à jour `package.json` avec `npm version <patch|minor|major> --no-git-tag-version`.

L'option `--no-git-tag-version` évite que npm crée lui-même le tag git — on le fait manuellement à l'étape 6 pour garder le contrôle.

### 4. Build

```bash
npm run build
```

Si le build échoue, **arrête-toi** et reporte l'erreur à l'utilisateur. Reverts la version dans `package.json` si nécessaire.

### 5. Tests

```bash
npx vitest run
```

> Note : `npm run test` lance vitest en mode watch (interactif). Utilise `npx vitest run` pour une passe unique non-interactive.

Si les tests échouent, **arrête-toi** et reporte l'erreur. Reverts la version dans `package.json`.

### 6. Commit + tag

```bash
git add package.json
git commit -m "chore: bump version to vX.Y.Z"
git tag vX.Y.Z
```

Remplace `X.Y.Z` par la nouvelle version calculée à l'étape 3.

### 7. Push

```bash
git push
git push --tags
```

### 8. Publish

```bash
npm publish
```

`publishConfig.access: "public"` est déjà défini dans `package.json`, pas besoin de `--access public`.

## En cas d'erreur

Si une étape échoue après le commit git (étapes 7 ou 8) :
- Ne pas supprimer le tag git automatiquement
- Expliquer à l'utilisateur ce qui a échoué et proposer la commande manuelle pour reprendre
- Pour un échec de publish : `npm publish` peut être relancé sans refaire le commit/tag
