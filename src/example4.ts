import { RuleForge, OUTCOME, Result, Fact, COMPARE, KnowledgeBase, Relationship } from "./ruleset/ruleset"
import type { FactData } from "./ruleset/ruleset"

export module runExample {
    // Data for Fact 1
    const jackData: FactData = { 
        jack: {
            score: 5
        },
        subject: 'jack'
    }

    // Data for Fact 2
    const jillData: FactData = {
        jill: {
            score: 10
        },
        subject: 'jill'
    }

    // Facts to run through the ruleset
    const jackFact: Fact = new Fact('jack', jackData)
    const jillFact: Fact = new Fact('jill', jillData)

    // Knowledgebase to use in the ruleset
    const knowledgeBase: KnowledgeBase = new KnowledgeBase()

    const testFunction = () => {
        const rf = new RuleForge(knowledgeBase)
            .NewRuleset('ruleset1')
        const results = rf
            .AddRule('amibetter')
            // Relationship to apply when rule passes
            .AddRelationshipAction((factData: FactData) => { console.log(factData.subject + ' is better') }, 'better', 'x is better than y')

            .AddCondition('isbetter', (fact, kb) => {
                if (kb === undefined) throw new Error(`No knowledge base was passed to the condition`)

                // First check for a score, and add to kb
                if (!fact.factData.hasOwnProperty(fact.factName) && fact.factData[fact.factName].hasOwnProperty('score')) {
                    return OUTCOME.FAIL
                }

                const score = fact.factData[fact.factName]['score']
                let isBetter: boolean = false // Defaults to false, will change to true if better than any other subject.

                // Save score to knowledge base
                kb.addMemoryElement('scores', new Fact(fact.factName, fact.factData))

                // Then check score against the existing kb
                for (let [key, value] of Object.entries(kb.getMemoryElement('scores'))) {
                    // Ignore our own score
                    if (value.factName === fact.factName) continue

                    if (!value.factData.hasOwnProperty(value.factName) && value.factData[value.factName].hasOwnProperty('score'))
                        return OUTCOME.FAIL

                    if (value.factData[value.factName]['score'] < fact.factData[fact.factName]['score']) {
                        kb.addToRelated(value.factName)
                        isBetter = true
                    }
                }

                return isBetter ? OUTCOME.PASS : OUTCOME.FAIL
            })

            .RunRules(jackFact)
            .RunRules(jillFact)
            .GetResults()

        console.log(results)
    }
    testFunction()
    console.log(knowledgeBase.getRelationships('jill'))
}