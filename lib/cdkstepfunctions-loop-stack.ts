import * as cdk from "@aws-cdk/core";
import * as sfn from "@aws-cdk/aws-stepfunctions";
import * as tasks from "@aws-cdk/aws-stepfunctions-tasks";
import * as lambda from "@aws-cdk/aws-lambda";
import { PythonFunction } from "@aws-cdk/aws-lambda-python";

/* example excution input is like
{
  "job": {
    "total_counter": 0,
    "job_counter": 0,
    "done": false
  },
  "max_job_count": 3,
  "max_inside_count": 4
}
*/

/**
 * lambda invoker with ResultSelector
 * https://github.com/aws/aws-cdk/issues/9904
 */

export interface LambdaInvokeWithResultSelectorProps
  extends tasks.LambdaInvokeProps {
  readonly resultSelector?: object;
}

export class LambdaInvokeWithResultSelector extends tasks.LambdaInvoke {
  private readonly resultSelector?: object;

  constructor(
    scope: cdk.Construct,
    id: string,
    props: LambdaInvokeWithResultSelectorProps
  ) {
    super(scope, id, props);

    this.resultSelector = props.resultSelector;
  }

  public toStateJson(): object {
    const stateJson: any = super.toStateJson();
    if (this.resultSelector !== undefined) {
      stateJson.ResultSelector = this.resultSelector;
    }
    return stateJson;
  }
}


export class CdkstepfunctionsLoopStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const PREFIX_NAME = id.toLowerCase().replace('stack', '')
    
    const lambda_function = new PythonFunction(this, "lambda_function", {
      entry: "lambda",
      index: "job.py",
      handler: "lambda_handler",
      functionName: PREFIX_NAME,
      runtime: lambda.Runtime.PYTHON_3_8,
      timeout: cdk.Duration.seconds(20),
    });
    
    const job = new LambdaInvokeWithResultSelector(this, "job", {
      lambdaFunction: lambda_function,
      resultSelector: {
        "total_counter.$": "$.Payload.total_counter",
        "job_counter.$": "$.Payload.job_counter",
        "done.$": "$.Payload.done",
      },
      resultPath: "$.job",
    });
    
    const succeed = new sfn.Succeed(this, "succeed");

    const definition = job
      .next(
        new sfn.Choice(this, "complete?")
          .when(sfn.Condition.booleanEquals("$.job.done", false), job)
          .otherwise(succeed)
      );

    const state_machine = new sfn.StateMachine(this, "state_machine", {
      definition,
      timeout: cdk.Duration.minutes(5),
      stateMachineName: PREFIX_NAME + "-statemachine",
    })
    
    new cdk.CfnOutput(this, 'output', { value: state_machine.stateMachineArn })
  }
}
