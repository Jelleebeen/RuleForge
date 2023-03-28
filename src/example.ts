import { Ruleset, Condition, Rule, Action, RULE } from "./ruleset/ruleset"
import type { Fact } from "./ruleset/ruleset"

export module runExample {
    // Fact to run through the ruleset
    const fact1: Fact = {
        val1: true,
        val2: 'rule2',
        val3: 'passme'
    }

    // Actions for the rules when fired.
    const act1 = new Action(() => {
        console.log('Act1')
    })

    const act2 = new Action(() => {
        console.log('Act2')
    })

    // Conditions for the rules to pass, fail or call another rule.
    const cond1 = new Condition('cond1', (fact) => {
        if (fact.hasOwnProperty('val1')) return RULE.PASS

        return RULE.FAIL
    })

    const cond2 = new Condition('cond2', (fact) => {
        if (fact.hasOwnProperty('val2')) {
            return fact['val2']
        }

        return RULE.FAIL
    })

    const cond3 = new Condition('cond3', (fact) => {
        if (fact.hasOwnProperty('val3')) return RULE.PASS

        return RULE.FAIL
    })


    // Rules to run from ruleset
    const rule1 = new Rule('rule1', act1, [cond1, cond2])
    const rule2 = new Rule('rule2', act2, [cond3])

    // Ruleset to run the rules from
    const exampleRuleset = new Ruleset("Example")

    exampleRuleset.addRule(rule1)
    exampleRuleset.addRule(rule2)

    exampleRuleset.runRules(fact1, true, false)
}