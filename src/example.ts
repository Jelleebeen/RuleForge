import { Ruleset, Condition, Rule, Action, OUTCOME, Fact, COMPARE } from "./ruleset/ruleset"
import type { FactData } from "./ruleset/ruleset"

export module runExample {

    // Actions for the rules when fired.
    const act1 = new Action(() => {
        console.log('Act1')
    })

    const act2 = new Action(() => {
        console.log('Act2')
    })

    // Conditions for the rules to pass, fail or call another rule.
    const cond1 = new Condition('cond1', (fact) => {
        if (fact.hasSubject('subject1') && fact.hasAttribute('subject1', 'attribute1')) return OUTCOME.PASS

        return OUTCOME.FAIL
    })

    const cond2 = new Condition('cond2', (fact) => {
        if (fact.hasSubject('subject1') && fact.hasAttribute('subject1', 'attribute2')) {
            return fact.factData['subject1']['attribute2'] // 'rule2' - chaining rules 1 & 2
        }

        return OUTCOME.FAIL
    })

    const cond3 = new Condition('cond3', (fact) => {
        if (fact.hasSubject('subject1') && fact.hasValue('subject2', 'attribute3', COMPARE.EQUAL, 'failme' )) return OUTCOME.FAIL

        return OUTCOME.PASS
    })


    // Rules to run from ruleset
    const rule1 = new Rule('rule1', act1, [cond1, cond2])
    const rule2 = new Rule('rule2', act2, [cond3])

    // Ruleset to run the rules from
    const exampleRuleset = new Ruleset("Example")

    exampleRuleset.addRule(rule1)
    exampleRuleset.addRule(rule2)

    // Data for Fact
    const fact1Data: FactData = {
        subject1: {
            attribute1: true,
            attribute2: 'rule2',
        },
        subject2: {
            attribute3: 'passme' // Change to 'failme' to see when chained rules fail
        }
    }

    // Fact to run through the ruleset
    const fact1: Fact = new Fact('fact1', fact1Data)

    exampleRuleset.runRules(fact1, true, false)
}