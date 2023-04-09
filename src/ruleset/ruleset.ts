export enum OUTCOME {
    PASS = 'PASS',
    ERROR = 'ERROR',
    FAIL = 'FAIL'
}

export enum COMPARE {
    EQUAL = 'EQUAL',
    NOTEQUAL = 'NOTEQUAL',
    CONTAINS = 'CONTAINS',
    NOTCONTAINS = 'NOTCONTAINS',
    GREATERTHAN = 'GREATERTHAN',
    LESSTHAN = 'LESSTHAN',
    GREATEROREQUAL = 'GREATEROREQUAL',
    LESSOREQUAL = 'LESSOREQUAL'
}

export interface IRuleset {
    name: string
    results: Result[]
    addRule(rule: IRule): void
    getRule(ruleName: string): IRule
    removeRule(ruleName: string): void
    runRules(fact: Fact, fireOnPass: boolean, failOnInfinite: boolean): Result
    fireAllPasses(obj?: any): void
}

export interface IRule {
    name: string
    conditions: ICondition[]
    action: IAction
    addCondition: (condition: ICondition) => void
    removeCondition: (conditionName: string) => void
    updateCondition: (conditionName: string, test: (fact: Fact) => string) => void
    testConditions: (fact: Fact) => string | OUTCOME
    fireAction: (obj?: any) => void
}

export interface ICondition {
    name: string
    test: (fact: Fact) => string | OUTCOME
}

export interface IAction {
    act: (obj?: any) => void
}

export type Result = {
    rulesetName: string,
    ruleName: string,
    factName: string,
    outcome: string,
}

/* TODO - Shape of fact will be:
{ 
    subject1Name: {
        attribute1Name: value<any>,
        attribute2Name: value<any>
    },

    subject2Name: {
        attribute3Name: value<any>
    }

}

*/
export type FactData = {
    [key: string]: any
}

export interface IFact {
    [key: string]: any
    factName: string
    hasSubject: (subjectName: string) => boolean
    hasAttribute: (subjectName: string, attributeName: string) => boolean
    hasValue: (subjectName: string, attributeName: string, compare: COMPARE, value: string) => boolean
}

export class Fact implements IFact {
    [key: string]: any
    private _factName: string
    private _factData: FactData

    public get factName(): string { return this._factName }

    public get factData(): FactData { return this._factData }

    constructor(factName: string, factData: FactData) {
        this._factName = factName
        this._factData = factData
    }

    public hasSubject(subjectName: string): boolean {
        return this._factData.hasOwnProperty(subjectName)
    }

    public hasAttribute(subjectName: string, attributeName: string): boolean {
        if (!this._factData.hasOwnProperty(subjectName)) return false

        return this._factData[subjectName].hasOwnProperty(attributeName)

    }
 
    public hasValue(subjectName: string, attributeName: string, compare: COMPARE, value: string): boolean {
        if(!this._factData.hasOwnProperty(subjectName)) return false

        if(!this._factData[subjectName].hasOwnProperty(attributeName)) return false

        const attribute = this._factData[subjectName][attributeName]

        switch (compare) {
            case COMPARE.EQUAL:
                if (typeof attribute === 'number')
                return attribute == parseInt(value)

                return attribute.toString() == value
            break
            
            case COMPARE.NOTEQUAL:
                if (typeof attribute === 'number')
                return attribute == parseInt(value)

                return attribute.toString() != value
            break

            case COMPARE.CONTAINS:
                if (typeof attribute !== 'object') return false

                attribute.forEach((item: any) => {
                    if (typeof item === 'number' && item === parseInt(value)) return true

                    if (item.toString() == value) return true 
                })

                return false
            break

            case COMPARE.NOTCONTAINS:
                if (typeof attribute !== 'object') return true

                attribute.forEach((item: any) => {
                    if (typeof item === 'number' && item === parseInt(value)) return false

                    if (item.toString() == value) return false 
                })

                return true
            break

            case COMPARE.GREATERTHAN:
                if (typeof attribute !== 'number') return false
                
                return attribute > parseInt(value)
            break

            case COMPARE.LESSTHAN:
                if (typeof attribute !== 'number') return false
                
                return attribute < parseInt(value)
            break

            case COMPARE.GREATEROREQUAL:
                if (typeof attribute !== 'number') return false
                
                return attribute >= parseInt(value)

            case COMPARE.LESSOREQUAL:
                if (typeof attribute !== 'number') return false
                
                return attribute <= parseInt(value)

            default:
                return false
        }
    }
}

export class Action implements IAction {
    public act = (obj?: any) => {}

    constructor(actFunction: (obj?: any) => void) {
        this.act = actFunction
    }
}

export class Condition implements ICondition {
    private readonly _name: string

    public get name() {
        return this._name
    }

    public test: (fact: Fact) => string | OUTCOME

    constructor(name: string, testFunction: (fact: Fact) => string | OUTCOME) {
        this._name = name
        this.test = testFunction
    }

}

export class StandardCondition implements ICondition {
    private readonly _name: string

    public get name() {
        return this._name
    }

    public test: (fact: Fact) => string | OUTCOME

    constructor(
        name: string, 
        subject: string, 
        attribute: string, 
        compare: COMPARE, 
        value: string, 
        passOutcome: string | OUTCOME = OUTCOME.PASS, 
        failOutcome: string | OUTCOME = OUTCOME.FAIL
        ) {
            this._name = name
            this.test = (fact) => {
                if (fact.hasValue(subject, attribute, compare, value)) return passOutcome

                return failOutcome
        }
    }
}

export class Rule implements IRule {   
    private readonly _name: string
    private _action: IAction
    private _conditionMap: Map<string, ICondition>
    

    public get name() { return this._name }
    public get action() { return this._action}
    public set action(val: IAction) { this._action = val }
    public get conditions() { return Array.from(this._conditionMap.values()) }

    constructor(name: string, action: IAction, conditions?: ICondition[]) {
        this._name = name
        this._action = action        
        this._conditionMap = new Map<string, ICondition>
        if(conditions !== undefined) {
            for(let i = 0, n = conditions.length; i < n; ++i) {
                this._conditionMap.set(conditions[i].name, conditions[i])
            }
        }
    }

    public addCondition(condition: ICondition): void {
        this._conditionMap.set(condition.name, condition)
    }

    public removeCondition(conditionName: string): void {
        this._conditionMap.delete(conditionName)
    }

    public updateCondition(conditionName: string, test: (fact: Fact) => string): void {
        const condition = this._conditionMap.get(conditionName)
        if (condition === undefined) throw new Error(`Could not find and update condition '${conditionName}'`)
        condition.test = test
    }

    public testConditions(fact: Fact): string | OUTCOME {
        for(let [key, value] of this._conditionMap) {
            let result: string | OUTCOME = value.test(fact)
            if (result !== OUTCOME.PASS) return result
        }

        // If no conditions were returned, must all have been met.
        return OUTCOME.PASS
    }

    public fireAction(obj?: any): void {
        this._action.act(obj)
    }

}

export class Ruleset implements IRuleset {
    private readonly _name: string
    private readonly _ruleMap: Map<string, IRule>
    private _passedRules: string[] = []
    private _results: Result[] = []
    
    public get name() {
        return this._name
    }

    public get results() {
        return this._results
    }

    constructor(name: string) {
        this._name = name
        this._ruleMap = new Map<string, IRule>
    }

    public addRule(rule: IRule): void {
        this._ruleMap.set(rule.name, rule);
    }

    public getRule(ruleName: string): IRule {
        const rule = this._ruleMap.get(ruleName)
        if(rule == undefined) throw new Error(`This rule does not exist in the rules list ('${ruleName}')`)

        return rule
    }

    public removeRule(ruleName: string): void {
        this._ruleMap.delete(ruleName)
    }

    public runRules(fact: Fact, fireOnPass:boolean = true, failOnInfinite:boolean = false): Result {
        const lastRuleName = ''
        // Loop through, test the conditions and fire the actions on each rule in the ruleMap
        this._passedRules = []
        this._results = []
        let result: Result = { rulesetName: this.name, ruleName: '', factName: fact.name, outcome: '' }

        rulemaploop:
        for(let [key, value] of this._ruleMap) {
            
            result.outcome = value.testConditions(fact) // Result of running the conditions on this rule.
            result.ruleName = key // The name of this rule.
            this._results.push(result)
            const seenRules: string[] = [key] // A list of rules we have seen in this iteration

            while(result.outcome !== OUTCOME.PASS) {
                // If this rule failed, return failed .
                if (result.outcome === OUTCOME.FAIL) return result

                // If an error is detected, throw that there was an error. TODO -- Store that error in the result.
                if (result.outcome === OUTCOME.ERROR) throw new Error(`An error occurred when running rule '${result.ruleName}'`)

                if (seenRules.includes(result.outcome)) {
                    // We've been here before, so will eventually return here in an infinite loops from the same conditions.
                    // Set to fail when an infinite loop is found, so return as a fail.
                    // TODO -- consider fireOnPass actions that mutate the facts OR save to a WME (Working Memory Elements)
                    if (failOnInfinite) {
                        result.outcome = OUTCOME.FAIL
                        return result
                    }
                    throw new Error(`An infinite loop happened when running rule '${result.ruleName}', it loops back to a rule that has run before ('${result.outcome}')`)
                }
                result.ruleName = result.outcome

                seenRules.push(result.ruleName)
                result.outcome = this.getRule(result.ruleName).testConditions(fact)
                this._results.push(result)
            }

            // This rule passed all conditions
            this._passedRules.push(key)
            if (fireOnPass) value.fireAction() // If fireOnPass is enabled, fire action on rule now
            continue rulemaploop
        }

        return result
    }

    public fireAllPasses(obj?: any): void {
        for(let i = 0; i < this._passedRules.length; ++i) {
            let currRuleName = this._passedRules[i]
            this.getRule(currRuleName).fireAction(obj)
        }
    }

}

export class RuleForge {
    // RuleForge is a helper class, filled with functions to help with the building blocks of a ruleset.
    private _rulesetMap: Map<string, Ruleset> = new Map<string, Ruleset>
    private baseAction: IAction = new Action(() => {})
    private _factMap: Map<string, Fact> = new Map<string, Fact>
    private lastRuleset: string = ''
    private lastRule: string = ''
    private lastResult: Result = { rulesetName: '', ruleName: '', factName: '', outcome: ''}
    private lastResults: Result[] = []
          
    public NewRuleset(name: string): this {    
        const newRuleset: Ruleset = new Ruleset(name)

        this._rulesetMap.set(name, newRuleset)
        this.lastRuleset = name
        return this
    }

    public RemoveRuleset(name: string): this {
        this._rulesetMap.delete(name)
        if (this.lastRuleset === name) this.lastRuleset = ''

        return this
    }

    private rulesetError(): string {
        return `Ruleset could not be found for this RuleForge (was it removed?)`
    }

    private rulesetNameError(rulesetName: string): string {
        return `Ruleset '${rulesetName}' could not be found for this RuleForge (was it removed?)`
    }

    private ruleError(rulesetName: string): string {
        return `Rule could not be found in ruleset '${rulesetName}' for this RuleForge`
    }

    private ruleCheck(): void {
        if (this.lastRuleset == '') throw new Error(this.rulesetError())
        if (this.lastRule === '') throw new Error(this.ruleError(this.lastRuleset))
    }

    public AddRule(ruleName: string, action: IAction = this.baseAction): this {
        if (this.lastRuleset == '') throw new Error(this.rulesetError())

        const ruleset = this._rulesetMap.get(this.lastRuleset)
        if (ruleset === undefined) throw new Error(this.rulesetNameError(this.lastRuleset))
        
        ruleset.addRule(new Rule(ruleName, action))

        this.lastRule = ruleName

        return this
    }

    public AddRuleToRuleset(rulesetName: string, ruleName: string, action: IAction = this.baseAction): this {
        const ruleset = this._rulesetMap.get(rulesetName) 
        if (ruleset === undefined) throw new Error(this.rulesetNameError(rulesetName))     
        
        ruleset.addRule(new Rule(ruleName, action))

        return this
    }

    public RemoveRuleFromRuleset(rulesetName: string, ruleName: string): this {
        const ruleset = this._rulesetMap.get(rulesetName) 
        if (ruleset === undefined) throw new Error(this.rulesetNameError(rulesetName))

        ruleset.removeRule(ruleName)

        return this
    }

    public AddAction(actionFunction: (obj?: any) => void): this {
        this.ruleCheck()

        const ruleset = this._rulesetMap.get(this.lastRuleset)
        if (ruleset === undefined) throw new Error(this.rulesetNameError(this.lastRuleset))

        const rule = ruleset.getRule(this.lastRule)
        rule.action = new Action(actionFunction)

        return this
    }

    public AddActionToRule(rulesetName: string, ruleName: string, actionFunction: (obj?: any) => void): this {
        const ruleset = this._rulesetMap.get(rulesetName)
        if (ruleset === undefined) throw new Error(this.rulesetNameError(rulesetName))

        ruleset.getRule(ruleName).action = new Action(actionFunction)

        return this
    }

    public ClearActionFromRule(rulesetName: string, ruleName: string): this {
        const ruleset = this._rulesetMap.get(rulesetName)
        if (ruleset === undefined) throw new Error(this.rulesetNameError(rulesetName))

        ruleset.getRule(ruleName).action = this.baseAction

        return this
    }

    public AddCondition(conditionName: string, testFunction: (fact: Fact) => string): this {
        this.ruleCheck()

        const ruleset = this._rulesetMap.get(this.lastRuleset)
        if (ruleset === undefined) throw new Error(this.rulesetNameError(this.lastRuleset))

        const rule = ruleset.getRule(this.lastRule)

        rule.addCondition(new Condition(conditionName, testFunction))

        return this
    }

    public AddConditionToRule(rulesetName: string, ruleName: string, conditionName: string, testFunction: (fact: Fact) => string): this {
        const ruleset = this._rulesetMap.get(rulesetName)
        if (ruleset === undefined) throw new Error(this.rulesetNameError(rulesetName))

        ruleset.getRule(ruleName).addCondition(new Condition(conditionName, testFunction))

        return this
    }

    public RemoveConditionFromRule(rulesetName: string, ruleName: string, conditionName: string): this {
        const ruleset = this._rulesetMap.get(rulesetName)
        if (ruleset === undefined) throw new Error(this.rulesetNameError(rulesetName))

        ruleset.getRule(ruleName).removeCondition(conditionName)

        return this
    }

    public RunRules(fact: Fact, fireOnPass: boolean = true, failOnInfinite: boolean = false): this {
        this.ruleCheck()

        const ruleset = this._rulesetMap.get(this.lastRuleset)
        if (ruleset === undefined) throw new Error(this.rulesetNameError(this.lastRuleset))

        this.lastResult = ruleset.runRules(fact, fireOnPass, failOnInfinite)

        return this
    }

    public GetLastResult(): Result {
        this.ruleCheck()

        if (this.lastResult.outcome === '') throw new Error(`The rules have not been run for this RuleForge (did you call RunRules yet?)`)

        return this.lastResult
    }

    public GetResults(): Result[] {
        this.ruleCheck()

        const ruleset = this._rulesetMap.get(this.lastRuleset)
        if (ruleset === undefined) throw new Error(this.rulesetNameError(this.lastRuleset))

        this.lastResults.concat(ruleset.results)

        return ruleset.results
    }

    public GetResultsOnRuleset(rulesetName: string): Result[] {
        const ruleset = this._rulesetMap.get(rulesetName)
        if (ruleset === undefined) throw new Error(this.rulesetNameError(rulesetName))

        return ruleset.results
    }

    public FireAllPasses(obj?: any): this {
        this.ruleCheck()

        const ruleset = this._rulesetMap.get(this.lastRuleset)
        if (ruleset === undefined) throw new Error(this.rulesetNameError(this.lastRuleset))

        ruleset.fireAllPasses(obj)
        
        return this
    }

    public AddFact(factName: string, fact: Fact): this {
        this._factMap.set(factName, fact)

        return this
    }

    public GetFact(factName: string) : Fact | undefined {
        return this._factMap.get(factName)
    }

    public DeleteFact(factName: string): this {
        this._factMap.delete(factName)

        return this
    }

    public BulkRunRules(fireOnPass: boolean = true, failOnInfinite: boolean = false): this {
        this.ruleCheck()

        this.lastResults = []

        const ruleset = this._rulesetMap.get(this.lastRuleset)
        if (ruleset === undefined) throw new Error(this.rulesetNameError(this.lastRuleset))

        this._factMap.forEach((fact) => {
            const result: Result = ruleset.runRules(fact, fireOnPass, failOnInfinite)
            this.lastResult = result
            this.GetResults() // Add results of each run to lastResults array.
        })

        return this
    }

    public BulkRunRulesOnRuleset(rulesetName: string, fireOnPass: boolean = true, failOnInfinite: boolean = false): this {
        const ruleset = this._rulesetMap.get(rulesetName)
        if (ruleset === undefined) throw new Error(this.rulesetNameError(rulesetName))

        this._factMap.forEach((fact) => {
            const result: Result = ruleset.runRules(fact, fireOnPass, failOnInfinite)
            this.lastResult = result
            this.GetResults() // Add results of each run to lastResults array.
        })

        return this
    }

    public GetBulkResults(): Result[] {
        this.ruleCheck()     

        return this.lastResults
    }

}





