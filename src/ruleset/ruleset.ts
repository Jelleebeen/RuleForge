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
    testConditions: (fact: Fact) => string | RULE
    fireAction: () => void
}

interface ICondition {
    id: string
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
    private readonly _id: string

    public get id() {
        return this._id
    }

    public test: (fact: Fact) => string | RULE

    constructor(id: string, testFunction: (fact: Fact) => string | RULE) {
        this._id = id
        this.test = testFunction
    }

}

export class Rule implements IRule {   
    private readonly _name: string
    private readonly _action: IAction
    private _conditions: ICondition[] = []
    

    public get name() { return this._name }
    public get action() { return this._action}
    public get conditions() { return this._conditions}

    constructor(name: string, action: IAction, conditions?: ICondition[]) {
        this._name = name
        this._action = action        
        this._conditions = !!conditions? conditions : []
    }

    public addCondition(condition: ICondition) {
        this.conditions.push(condition)
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

    public fireAction() {
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
                    if (failOnInfinite) return false
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

    public fireAllPasses() {
        for(let i = 0; i < this._passedRules.length; ++i) {
            let currRuleName = this._passedRules[i]
            this.getRule(currRuleName).fireAction()
        }
    }

}

