import { RuleForge, OUTCOME, Result, Fact, COMPARE, IKnowledgeBase, KnowledgeBase } from "./ruleset/ruleset"
import type { FactData } from "./ruleset/ruleset"

export module runExample {
    // Data for Fact
    const rosterData: FactData = {
        dave: {
            goalkeeper: false,
            defender: false,
            midfielder: false,
            attacker: true
        },
        paul: {
            goalkeeper: true,
            defender: false,
            midfielder: false,
            attacker: false
        },
        isabel: {
            goalkeeper: false,
            defender: true,
            midfielder: true,
            attacker: false
        },
        elizabeth: {
            goalkeeper: false,
            defender: true,
            midfielder: true,
            attacker: false
        },
        patricia: {
            goalkeeper: false,
            defender: true,
            midfielder: true,
            attacker: false
        }
    }

    // Fact to run through the ruleset
    const fact1: Fact = new Fact('roster', rosterData)

    // Knowledgebase to use in the ruleset
    const knowledgeBase: KnowledgeBase = new KnowledgeBase()

    const testFunction = () => {
        const rf = new RuleForge(knowledgeBase)
        .NewRuleset('firstRS')
        const results: Result[] = rf
            .AddRule('goalkeeper')
            .AddKnowledgeAction(() => { console.log('found a goalkeeper') }, 'teamhasagoalkeeper', 'team', 'goalkeeper', true )
            .AddCondition('findGoalkeeper', (fact) => {
                for (let [key, value] of Object.entries(fact.factData)) {
                    if (value.hasOwnProperty('goalkeeper')) {
                        if (value['goalkeeper'] == true) return OUTCOME.PASS
                    }
                }

                return OUTCOME.FAIL
            })
            .AddRule('defender')
            .AddKnowledgeAction(() => { console.log('found a defender')}, 'teamhasadefender', 'team', 'defender', true )
            .AddCondition('findDefender', (fact) => {
                for (let [key, value] of Object.entries(fact.factData)) {
                    if (value.hasOwnProperty('defender')) {
                        if (value['defender'] == true) return OUTCOME.PASS
                    }
                }

                return OUTCOME.FAIL
            })
            .AddRule('midfielder')
            .AddKnowledgeAction(() => { console.log('found a midfielder')}, 'teamhasamidfielder', 'team', 'midfielder', true )
            .AddCondition('findMidfielder', (fact, kb) => {
                if (kb === undefined) return OUTCOME.FAIL

                let foundMidfielder: boolean = false
                for (let [key, value] of Object.entries(fact.factData)) {
                    if (value.hasOwnProperty('midfielder')) {
                        if (value['midfielder'] == true) {
                            // Save the name of each eligible midfielder, to be counted in the next rule.
                            const midfielderData: FactData = {}
                            midfielderData['midfielder'] = {}
                            midfielderData['midfielder']['name'] = key
                            kb.addMemoryElement('midfielder', new Fact('midfielder', midfielderData)) 
                            
                            foundMidfielder = true
                        }
                    }
                }

                if (foundMidfielder === true) return OUTCOME.PASS

                return OUTCOME.FAIL
            })
            .AddRule('2ndmidfielder')
            .AddKnowledgeAction(() => { console.log('found another midfielder')}, 'teamhastwomidfielders', 'team', '2ndmidfielder', true )
            .AddCondition('find2ndMidfielder', (fact, kb) => {

                if (kb === undefined) return OUTCOME.FAIL

                const midfielderFacts = kb.getMemoryElement('midfielder')

                if (midfielderFacts === undefined) return OUTCOME.FAIL // No midfielders at all

                // Checking knowledge base instead of just counting midfielders in the fact, for demo purposes.
                let midfielderCount: number = midfielderFacts.length
                
                if (midfielderCount > 1) return OUTCOME.PASS

                return OUTCOME.FAIL
            })
            .AddRule('attacker')
            .AddKnowledgeAction(() => { console.log('found an attacker')}, 'teamhasanattacker', 'team', 'attacker', true )
            .AddCondition('findAttacker', (fact) => {
                for (let [key, value] of Object.entries(fact.factData)) {
                    if (value.hasOwnProperty('attacker')) {
                        if (value['attacker'] == true) return OUTCOME.PASS
                    }
                }

                return OUTCOME.FAIL
            })
            .AddRule('fullteam')
            .AddKnowledgeAction(() => { console.log('we have a full team!')}, 'team is full', 'team', 'fullteam', true )
            .AddCondition('findFullTeam', (fact, kb) => {
                let goalkeeper: boolean = false 
                let defender: boolean = false
                let midfielder: boolean = false 
                let twomidfielders: boolean = false
                let attacker: boolean = false
                
                if (kb === undefined) return OUTCOME.FAIL

                const teamFacts = kb.getMemoryElement('team')
                if (teamFacts === undefined) return OUTCOME.FAIL // No team element facts at all

                for (let i = 0, n = teamFacts.length; i < n; ++i) {
                    if (teamFacts[i].hasValue('team', 'goalkeeper', COMPARE.EQUAL, 'true')) goalkeeper = true
                    if (teamFacts[i].hasValue('team', 'defender', COMPARE.EQUAL, 'true')) defender = true
                    if (teamFacts[i].hasValue('team', 'midfielder', COMPARE.EQUAL, 'true')) midfielder = true
                    if (teamFacts[i].hasValue('team', '2ndmidfielder', COMPARE.EQUAL, 'true')) twomidfielders = true
                    if (teamFacts[i].hasValue('team', 'attacker', COMPARE.EQUAL, 'true')) attacker = true
                }

                if (goalkeeper && defender && midfielder && twomidfielders && attacker) return OUTCOME.PASS

                return OUTCOME.FAIL
            })
            .RunRules(fact1)
            .GetResults()
    }
    testFunction()
}