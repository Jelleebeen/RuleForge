export enum OUTCOME {
    PASS = 'PASS',
    ERROR = 'ERROR',
    FAIL = 'FAIL'
}

interface IRule {
    name: string
    conditions: ICondition[]
    action: IAction
    addCondition: (condition: ICondition) => void
    removeCondition: (conditionName: string) => void
    testConditions: (fact: Fact) => string | OUTCOME
    fireAction: () => void
}

interface ICondition {
    name: string
    test: (fact: Fact) => string | OUTCOME
}

interface IAction {
    act: () => void
}

export type Result = {
    rulesetName: string,
    ruleName: string,
    factName: string,
    outcome: string,
}

export type Fact = {
    [key: string]: any
    factName: string
}

export class Action implements IAction {
    public act = () => {}

    constructor(actFunction: () => void) {
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

export class Rule implements IRule {   
    private readonly _name: string
    private _action: IAction
    private _conditions: ICondition[] = [] // TODO - Replace with Hash map?
    

    public get name() { return this._name }
    public get action() { return this._action}
    public set action(val: IAction) { this._action = val }
    public get conditions() { return this._conditions}

    constructor(name: string, action: IAction, conditions?: ICondition[]) {
        this._name = name
        this._action = action        
        this._conditions = !!conditions? conditions : []
    }

    public addCondition(condition: ICondition): void {
        this.conditions.push(condition)
    }

    public removeCondition(conditionName: string): void {
        const condIndex = this.conditions.findIndex((cond) => cond.name === conditionName)

        if (condIndex > -1) this.conditions.splice(condIndex, 1)
    }

    public testConditions(fact: Fact): string | OUTCOME {
        for(let i = 0; i < this._conditions.length; ++i) {
            // Return false as soon as a condition is not met
            let result = this._conditions[i].test(fact)
            if(result !== OUTCOME.PASS) return result
        }

        // If no conditions were returned, must all have been met.
        return OUTCOME.PASS
    }

    public fireAction(): void {
        this._action.act()
    }

}

export class Ruleset {
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
            
            result
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
                    // TODO -- consider fireOnPass actions that mutate the facts.
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

    public fireAllPasses(): void {
        for(let i = 0; i < this._passedRules.length; ++i) {
            let currRuleName = this._passedRules[i]
            this.getRule(currRuleName).fireAction()
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

    public AddAction(actionFunction: () => void): this {
        this.ruleCheck()

        const ruleset = this._rulesetMap.get(this.lastRuleset)
        if (ruleset === undefined) throw new Error(this.rulesetNameError(this.lastRuleset))

        const rule = ruleset.getRule(this.lastRule)
        rule.action = new Action(actionFunction)

        return this
    }

    public AddActionToRule(rulesetName: string, ruleName: string, actionFunction: () => void): this {
        const ruleset = this._rulesetMap.get(rulesetName)
        if (ruleset === undefined) throw new Error(this.rulesetNameError(rulesetName))

        ruleset.getRule(ruleName).action = new Action(actionFunction)

        return this
    }

    public ClearActionFromRule(rulesetName: string, ruleName: string): this {
        const ruleset = this._rulesetMap.get(rulesetName)
        if (ruleset === undefined) throw new Error(this.rulesetNameError(rulesetName))

        ruleset.getRule(ruleName). action = this.baseAction

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

    public FireAllPasses(): this {
        this.ruleCheck()

        const ruleset = this._rulesetMap.get(this.lastRuleset)
        if (ruleset === undefined) throw new Error(this.rulesetNameError(this.lastRuleset))

        ruleset.fireAllPasses()
        
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





