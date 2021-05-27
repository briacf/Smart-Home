from pymongo import *
import tensorflow as tf
import numpy as np
import time

client = MongoClient('mongodb://localhost:27017/deco3801-nonpc')

db = client['deco3801-nonpc']

users = db.users
devices = db.appliances

def init_powergoals(id):
    goals = {
        "tv" : 1000,
        "computer" : 750,
        "fridge" : 3000,
        "oven" : 700,
        "microwave" : 200,
        "small-appliance" : 50,
        "other" : 100 
    }
    query = {"oem_id" : id}
    devType = devices.find_one(query)['type']
    powerGoals = {"$set": {"power_goals" : [None, None, None, None, None, None, goals[devType]]}} 
    devices.update_one(query, powerGoals)

def update_goal(id):
    query = {"oem_id" : id}
    dev = devices.find_one(query)

    powerGoal = dev['power_goals'][6]

    hourly_usage = dev['hourly_usage'][168:]
    hourly_usage = list(filter(None, hourly_usage))
    usage = []
    
    dayTotal = 0
    dayHoursRemaining = 23

    for hour in hourly_usage:
        if (dayHoursRemaining == 0):
            usage.append(dayTotal)
            dayTotal = 0
            dayHoursRemaining = 23
        else:
            dayTotal += hour
            dayHoursRemaining -= 1

    # Get how much of an outlier todays power usage is compared to the entire week
    todaysUsage = round(usage[6], 1)
    meanUsage = round(np.mean(usage), 1)

    usageDifference = 0

    if (meanUsage > todaysUsage):
        usageDifference = 1 + 0.35 * ((meanUsage - todaysUsage) / float(todaysUsage))
    elif (meanUsage < todaysUsage):
        usageDifference = 1 - 0.35 * ((todaysUsage - meanUsage) / float(todaysUsage))

    usageDifference = round(usageDifference, 3)

    # Get the accuracy of todays power goal compared to todays usage
    goalDifference = 1

    if (todaysUsage > powerGoal):
        goalDifference = 1 + 0.5 * ((todaysUsage - powerGoal) / float(powerGoal))
    elif (todaysUsage < powerGoal):
        goalDifference = 1 - 0.5 * ((powerGoal - todaysUsage) / float(powerGoal))

    goalDifference = round(goalDifference, 3)

    factor = goalDifference * usageDifference
    tomorrowGoal = powerGoal * goalDifference * usageDifference
    tomorrowGoal = round(tomorrowGoal, 0)

    print("Mean usage: " + str(meanUsage))
    print("Today's usage: " + str(todaysUsage))
    print("Usage diff: " + str(usageDifference))
    print("Prev goal: " + str(powerGoal))
    print("Goal diff: " + str(goalDifference))
    print("Factor: " + str(factor))
    print("Next goal: " + str(tomorrowGoal))

    newPowerGoal = dev['power_goals']
    newPowerGoal.pop(0)
    newPowerGoal.append(tomorrowGoal)

    user_query = {"email" : dev['email']}
    user = users.find_one(user_query)
    
    currentCredits = user['credits']
    powerGoals = dev['power_goals']

    for x in range(0, len(powerGoals)):
        newCredits = (powerGoals[x] - hourly_usage[x]) * 0.05
        newCredits = round(newCredits, 0)

        if (newCredits > 0):
            currentCredits += newCredits


    print("Current credits: " + str(currentCredits))

    updateCredits = {"$set": {"credits" : currentCredits}} 
    users.update_one(user_query, updateCredits)

    updateGoal = {"$set": {"power_goals" : newPowerGoal}} 
    devices.update_one(query, updateGoal)

def power_goal():
    for dev in devices.find():
        if(dev['hours_passed'] > 168):
            update_goal(dev['oem_id'])
            break

while (True):
    power_goal()
    print()
    time.sleep(1)
