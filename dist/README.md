# RuleForge
## _A library for adding a rules engine to your web app_

![GitHub last commit](https://img.shields.io/github/last-commit/Jelleebeen/RuleForge) ![GitHub issues](https://img.shields.io/github/issues/Jelleebeen/RuleForge) ![GitHub package.json version (branch)](https://img.shields.io/github/package-json/v/Jelleebeen/RuleForge/main) ![GitHub contributors](https://img.shields.io/github/contributors/Jelleebeen/RuleForge) ![GitHub forks](https://img.shields.io/github/forks/Jelleebeen/RuleForge) ![GitHub watchers](https://img.shields.io/github/watchers/Jelleebeen/RuleForge) ![GitHub Repo stars](https://img.shields.io/github/stars/Jelleebeen/RuleForge) ![GitHub Sponsors](https://img.shields.io/github/sponsors/Jelleebeen) ![GitHub](https://img.shields.io/github/license/Jelleebeen/RuleForge)

Create a rules engine for your app in minutes, that would take days to create from scratch.

Add complex rules to your web app quickly via simple commands to RuleForge's classes.

## Features

- A ready-built structure for organising your rules
- An efficient engine for processing rules at scale
- A simple structure that can be picked up easily
- Create simple rulesets quickly via chaining with the RuleForge class
- Fire actions from passed rules immediately, or en masse when you want to


## Installation

RuleForge can be installed via Node Package Manager (NPM).

```sh
npm install @ruleforge/ruleforge
```

## Documentation

Documentation can be found on the RuleForge GitHub Pages site [here](https://jelleebeen.github.io/RuleForge/)

## Getting Started
A getting started guide will be added here soon, but in the meantime check out the `example.ts` and `example2.ts` files for two ways to get started.

There are a few different building blocks that make up RuleForge's rule engine. These are the five you will use, and what they are for:

- Fact: An object you pass with your own properties to check your rules against.
- Condition: An individual check you make on the Fact.
- Rules: Contain the Conditions that must all be met for the Rule to pass.
- Actions: The function you want to run when the Rule passes.
- Ruleset: A container for your Rules.
- RuleForge: A class that allows your rulesets to be created via chaining (see `example2.ts`)

In short:
1. Create a ruleset.
2. Create a rule in the ruleset.
3. Create an action in the rule.
4. Add conditions to the rule.
5. Repeat 2-4 until you have all the rules you need.
6. Create a fact, with the data you'll be checking your rules against.
7. Run the fact through the ruleset.

## Development

Want to contribute? Great!

#### We develop with GitHub
We use GitHub to host the code, track issues and feature requests, as well as accept pull requests.
1. Fork the repository and create your own branch from `main`.
2. Make sure your code lints.
3. Issue that pull request!

#### Any contributions you make will be under the MIT Software Licence
In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. 

#### Write bugs using GitHub's [issues](https://github.com/Jelleebeen/RuleForge/issues)
We use GitHub issues to track public bugs. Report a bug by [opening an issue](https://github.com/Jelleebeen/RuleForge/issues/new/choose).

## License

MIT