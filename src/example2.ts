import { RuleForge, OUTCOME, Result, Fact, COMPARE } from "./ruleset/ruleset"
import type { FactData } from "./ruleset/ruleset"

export module runExample {
    // Data for Fact
    const fact1Data: FactData = {
        subject1: {
            attribute1: true,
            attribute2: 'rule3',
        },
        subject2: {
            attribute3: 'passme'
        },
        subject3: {
            attribute4: {
                message: 'This is a message in the fact data'
            }
        }
    }

    // Fact to run through the ruleset
    const fact1: Fact = new Fact('fact1', fact1Data)

    const testFunction = () => {
        const rf = new RuleForge().NewRuleset('firstRS')
        const results: Result[] = rf
            .AddRule('rule1')
            .AddAction(() => { console.log('act1') })
            .AddCondition('cond1', (fact) => {
                if(fact.hasSubject('subject1') && fact.hasAttribute('subject1', 'attribute1'))
                return OUTCOME.PASS

                return OUTCOME.FAIL
            })
            .AddCondition('cond2', (fact) => {
                if (fact.hasSubject('subject1') && fact.hasValue('subject1', 'attribute1', COMPARE.EQUAL, 'true')) return OUTCOME.PASS

                return OUTCOME.FAIL
            })
            .AddRule('rule2')
            .AddAction(() => { console.log('act2 - this should not show when rule3 fails')})
            .AddCondition('cond3', (fact) => {
                if (fact.hasSubject('subject1') && fact.hasAttribute('subject1', 'attribute2')) return fact.factData['subject1']['attribute2']
    
                return OUTCOME.FAIL
            })
            .AddRule('rule3')
            .AddAction(() => { console.log('act3 - this should not show if attribute3 is changed to failme')})
            .AddCondition('cond4', (fact) => {
                if (fact.hasSubject('subject2')) {
                    if (fact.hasValue('subject2', 'attribute3', COMPARE.EQUAL, 'failme')) return OUTCOME.FAIL
                } else {
                    return OUTCOME.FAIL
                }
                return OUTCOME.PASS
            })
            .RunRules(fact1)
            .GetResults()
        
        console.log(results)
    }
    testFunction()
}