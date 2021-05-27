from pymongo import *
import tensorflow as tf
import numpy as np
import sys
from itertools import groupby


client = MongoClient('mongodb://localhost:27017/deco3801-nonpc')
db = client['deco3801-nonpc']

users = db.users
devices = db.appliances


def determine_usage_patterns(id):
    query = {"oem_id" : id}
    dev = devices.find_one(query)

    power_goals = dev['power_goals']
    hourly_usage = dev['hourly_usage'][168:]

    daily_usage = []
    day_use = []
    hours_on = []

    for i, hour in enumerate(hourly_usage):
        day_use.append(hour)
        if (((i+1) / 24) % 1 == 0):
            daily_usage.append(day_use[i-23:i+1])

    off_threshold = np.quantile(daily_usage, 0.01, axis=1)

    for i, day in enumerate(daily_usage):
        tempArr = []
        for hour in day:
            if hour < off_threshold[i]:
                tempArr.append(0)
            else:
                tempArr.append(1)
        hours_on.append(tempArr)

    avg_daily = np.mean(daily_usage, axis=1) 

    consec_on = []
    for day in hours_on:
        groups = groupby(day)
        result = [(label, sum(1 for _ in group)) for label, group in groups]
        consec_on.append(result)
    

    print("Device Name: ", dev['alias'])
    print("Daily Usage: ", avg_daily)
    print("Power Goals: ",power_goals )

    week_off_pattern = []
    week_on_pattern = []
    for day in consec_on:
        tempArrOff = []
        tempArrOn = []
        for consec in day:
            if(consec[0] == 0 and consec[1] > 24/len(day)):
                tempArrOff.append(consec)
            elif(consec[0] == 1 and consec[1] > 24/len(day)):
                tempArrOn.append(consec)
        week_off_pattern.append(tempArrOff)
        week_on_pattern.append(tempArrOn)

    on_pattern = []
    off_pattern = []

    for i, day in enumerate(hours_on):
        offRange = None
        onRange = None
        consecOnCount = 0
        consecOffCount = 0
        for j, hour in enumerate(day):
            if (hour == 1):
                consecOnCount += 1
                consecOffCount = 0
                if (len(week_on_pattern[i]) > 0 and consecOnCount == week_on_pattern[i][0][1]):
                    onRange = (j-consecOnCount + 1, j)
            elif (hour == 0):
                consecOffCount += 1
                consecOnCount = 0
                if (len(week_off_pattern[i]) > 0 and consecOffCount == week_off_pattern[i][0][1]):
                    onRange = (j-consecOffCount, j)
        on_pattern.append(onRange)
        off_pattern.append(offRange)

    avgOnTime = [0,0]
    avgOffTime = [0,0]

    for on in on_pattern:
        if (on is None):
            continue
        avgOnTime[0] += on[0]
        avgOnTime[1] += on[1] 
    avgOnTime[0] = avgOnTime[0] / 7
    avgOnTime[1] = avgOnTime[1] / 7
    for off in off_pattern:
        if (off is None):
            continue
        avgOffTime[0] += off[0]
        avgOffTime[1] += off[1] 
    avgOffTime[0] = avgOffTime[0] / 7
    avgOffTime[1] = avgOffTime[1] / 7

    print("Off Pattern: ", off_pattern, "\nOn Pattern: ", on_pattern)
    print("Average Off Range: ", avgOffTime,"\nAverage On Range: ", avgOnTime)

    make_recommendations(avgOnTime, avgOffTime, off_pattern, on_pattern, avg_daily, power_goals, id)
    

def make_recommendations(avgOnTime, avgOffTime, off_pattern, on_pattern, avg_daily, power_goals, id):
    reccUseTime = (int(avgOnTime[0]), int(avgOnTime[1]))
    query = {"oem_id" : id}
    dev = devices.find_one(query)
    uniformRec = True
    uniformRange = (np.mean(avg_daily) - np.std(avg_daily) * 2, np.mean(avg_daily) + np.std(avg_daily) * 2)

    for day in avg_daily:
        if not (uniformRange[0] <= day <= uniformRange[1]):
            print(uniformRange, day)
            uniformRec = False

    if (uniformRec):
        uniform_rec_helper(dev, avgOnTime, avgOffTime, avg_daily, power_goals, id)
    else:
        sep_rec_helper(dev, on_pattern, off_pattern, avg_daily, power_goals, id)



def sep_rec_helper(dev, on_pattern, off_pattern, avg_daily, power_goals, id):
    print("Seperate Rec: ", dev['recommendations'])
    currRecs = dev['recommendations']

def uniform_rec_helper(dev, avgOnTime, avgOffTime, avg_daily, power_goals, id):
    currRecs = dev['recommendations']
    dayArray = [1,1,1,1,1,1,1]
    times = [int(avgOnTime[0] - 1) * 60, int(avgOnTime[1] + 1) * 60]
    nameOff = "Turn " + dev["alias"] + " Off At: " + str(int(avgOnTime[1]) + 1) + "00"
    namePower = "Turn " + dev["alias"] + " Off After: " + str(int(power_goals[-1] * 1.1)) + " Watt Hours Used"
    goalUsage = power_goals[-1]
    offAct = [-1,0]

    newOffRec = {
        'name' : nameOff,
        'day_array' : dayArray,
        'min' : times,
        'act' : offAct,
        'time_opt' : offAct

    }

    newPowerRec = {
        'name' : namePower,
        'day_array' : dayArray,
        'min' : times,
        'power_goal' : goalUsage
    }

    currRecs.append(newOffRec)
    currRecs.append(newPowerRec)
    print(currRecs)
    addRec = {"$set": {"recommendations" : currRecs}}
    query = {"oem_id" : id}
    devices.update_one(query, addRec)
    

if __name__ == "__main__":
    for dev in devices.find():
        # if(dev['hours_passed'] > 168):
        determine_usage_patterns(dev['oem_id'])
        break