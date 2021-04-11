import time

def lambda_handler(event, context):
    print(event)

    if 'job' in event:
        total_counter = event['job']['total_counter']
        job_counter = event['job']['job_counter']
    else:
        total_counter = 0
        job_counter = 0
    
    max_job_count = event['max_job_count']
    max_inside_count = event['max_inside_count']

    inside_counter = 0
    
    while True:
        time.sleep(1)
        
        total_counter += 1
        inside_counter += 1
        
        if inside_counter == max_inside_count:
            break

    job_counter += 1
    
    done = job_counter == max_job_count
    
    return {'job_counter': job_counter, 'total_counter': total_counter, 'done': done}
