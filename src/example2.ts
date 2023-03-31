import { RuleForge, RULE } from "./ruleset/ruleset"
import type { Fact } from "./ruleset/ruleset"

export module runExample {
    // Fact to run through the ruleset
    const fact1: Fact = {
        val1: true,
        val2: 'rule3',
        val3: 'passme'
    }

    const testFunction = () => {
        const rf = new RuleForge().NewRuleset('firstRS')
        const result = rf
            .AddRule('rule1')
            .AddAction(() => { console.log('act1') })
            .AddCondition('cond1', (fact) => { 
                return RULE.PASS
            })
            .AddCondition('cond2', (fact) => {
                if (!!fact.hasOwnProperty('val1')) return RULE.PASS
                return RULE.FAIL
            })
            .AddRule('rule2')
            .AddAction(() => { console.log('act2')})
            .AddCondition('cond3', (fact) => {
                if (!fact.hasOwnProperty('val2')) return fact['val2']
    
                return RULE.FAIL
            })
            .AddRule('rule3')
            .AddAction(() => { console.log('This should not show')})
            .AddCondition('cond4', (fact) => {
                if (!fact.hasOwnProperty('val3')) {
                    if (fact['val3'] === 'failme') return RULE.FAIL
                }
                return RULE.PASS
            })
            .RunRules(fact1)
            .GetResult()
    }
    testFunction()
}