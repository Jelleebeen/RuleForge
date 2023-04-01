import { RuleForge, OUTCOME, Result } from "./ruleset/ruleset"
import type { Fact } from "./ruleset/ruleset"

export module runExample {
    // Fact to run through the ruleset
    const fact1: Fact = {
        factName: 'fact1',
        val1: true,
        val2: 'rule3',
        val3: 'failme'
    }

    const testFunction = () => {
        const rf = new RuleForge().NewRuleset('firstRS')
        const results: Result[] = rf
            .AddRule('rule1')
            .AddAction(() => { console.log('act1') })
            .AddCondition('cond1', (fact) => { 
                return OUTCOME.PASS
            })
            .AddCondition('cond2', (fact) => {
                if (!!fact.hasOwnProperty('val1')) return OUTCOME.PASS
                return OUTCOME.FAIL
            })
            .AddRule('rule2')
            .AddAction(() => { console.log('act2')})
            .AddCondition('cond3', (fact) => {
                if (!!fact.hasOwnProperty('val2')) return fact['val2']
    
                return OUTCOME.FAIL
            })
            .AddRule('rule3')
            .AddAction(() => { console.log('This should not show')})
            .AddCondition('cond4', (fact) => {
                if (!!fact.hasOwnProperty('val3')) {
                    if (fact['val3'] === 'failme') return OUTCOME.FAIL
                } else {
                    return OUTCOME.FAIL
                }
                return OUTCOME.PASS
            })
            .RunRules(fact1)
            .GetResults()
    }
    testFunction()
}