import boto3
from datetime import datetime
import json

stepfunctions = boto3.client('stepfunctions')
sts = boto3.client('sts')

caller_identity = sts.get_caller_identity()
account = caller_identity['Account']

STATEMACHINE_ARN = 'arn:aws:states:ap-northeast-1:{}:stateMachine:cdkstepfunctionsloop-statemachine'.format(account)

input_dict = {
  "job": {
    "total_counter": 0,
    "job_counter": 0,
    "done": False
  },
  "max_job_count": 3,
  "max_inside_count": 4
}

response = stepfunctions.start_execution(
    stateMachineArn=STATEMACHINE_ARN,
    name='excution-{}'.format(datetime.now().timestamp()),
    input=json.dumps(input_dict),
)

print(response)
