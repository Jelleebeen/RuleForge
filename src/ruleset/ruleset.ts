export enum RULE {
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
    testConditions: (fact: Fact) => string | RULE
    fireAction: () => void
}

interface ICondition {
    name: string
    test: (fact: Fact) => string | RULE
}

interface IAction {
    act: () => void
}

export type Fact = {
    [key: string]: any
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

    public test: (fact: Fact) => string | RULE

    constructor(name: string, testFunction: (fact: Fact) => string | RULE) {
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

    public testConditions(fact: Fact): string | RULE {
        for(let i = 0; i < this._conditions.length; ++i) {
            // Return false as soon as a condition is not met
            let result = this._conditions[i].test(fact)
            if(result !== RULE.PASS) return result
        }

        // If no conditions were returned, must all have been met.
        return RULE.PASS
    }

    public fireAction(): void {
        this._action.act()
    }

}

export class Ruleset {
    private readonly _name: string
    private readonly _ruleMap: Map<string, IRule>
    private _passedRules: string[] = []
    
    public get name() {
        return this._name
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

    public runRules(fact: Fact, fireOnPass:boolean = true, failOnInfinite:boolean = false): boolean {
        // Loop through, test the conditions and fire the actions on each rule in the ruleMap
        this._passedRules = []

        rulemaploop:
        for(let [key, value] of this._ruleMap) {
            let result = value.testConditions(fact) // Result of running the conditions on this rule.
            let currRuleName: string = key // The name of this rule.
            const seenRules: string[] = [key] // A list of rules we have seen in this iteration

            while(result !== RULE.PASS) {
                if (result === RULE.FAIL) return false // This rule failed, so return false.
                if (result === RULE.ERROR) throw new Error(`An error occurred when running rule '${currRuleName}'`)

                if (seenRules.includes(result)) {
                    if (failOnInfinite) return false // Set to fail when an infinite loop is found, so return false.
                    throw new Error(`An infinite loop happened when running rule '${currRuleName}', it loops back to a rule that has run before ('${result}')`)
                }
                currRuleName = result

                seenRules.push(currRuleName)
                result = this.getRule(currRuleName).testConditions(fact)
            }

            // This rule passed all conditions
            this._passedRules.push(key)
            if (fireOnPass) value.fireAction() // If fireOnPass is enabled, fire action on rule now
            continue rulemaploop

        }

        return true
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
    private lastResult: string = ''
          
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

        const result: boolean = ruleset.runRules(fact, fireOnPass, failOnInfinite)

        this.lastResult = result ? RULE.PASS : RULE.FAIL

        return this
    }

    public GetResult(): boolean {
        this.ruleCheck()

        if (this.lastResult === '') throw new Error(`The rules have not been run for this RuleForge (did you call RunRules yet?)`)

        if (this.lastResult === RULE.PASS) return true
        if (this.lastResult === RULE.FAIL) return false

        // Result not expected (not blank, pass or fail). Throw error.
        throw new Error(`An unknown error occurred. Could not read the results for this RuleForge`)
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

        const ruleset = this._rulesetMap.get(this.lastRuleset)
        if (ruleset === undefined) throw new Error(this.rulesetNameError(this.lastRuleset))

        // TODO - Create a results object for storing the results of each fact on each rule in each ruleset.
        // TODO - Create a function for returning the results of this bulk run.
        this._factMap.forEach((fact) => {
            const result: boolean = ruleset.runRules(fact, fireOnPass, failOnInfinite)

            this.lastResult = result ? RULE.PASS : RULE.FAIL
        })

        return this
    }

    public BulkRunRulesOnRuleset(rulesetName: string, fireOnPass: boolean = true, failOnInfinite: boolean = false): this {
        const ruleset = this._rulesetMap.get(rulesetName)
        if (ruleset === undefined) throw new Error(this.rulesetNameError(rulesetName))

        this._factMap.forEach((fact) => {
            const result: boolean = ruleset.runRules(fact, fireOnPass, failOnInfinite)

            this.lastResult = result ? RULE.PASS : RULE.FAIL
        })

        return this
    }

}





