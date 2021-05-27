from pymongo import *
import numpy as np
from random import randint
import matplotlib.pyplot as plt
from pymongo import *
import sys

client = MongoClient('mongodb://localhost:27017/deco3801-nonpc')

db = client['deco3801-nonpc']

users = db.users
devices = db.appliances

on_cycle = False
cycle_index = 0
cycle_mins = [30, 40, 50, 60, 70, 70, 70, 70, 60, 50, 40, 30]
power_goals = []

client = MongoClient('mongodb://localhost:27017/deco3801-nonpc')

db = client['deco3801-nonpc']

x = []
power = []
devices = db.appliances

def light():
    on_cycle = True
    
    for i in range(0, 336):
        if i % 12 == 0:
            if (on_cycle):
                on_cycle = False
            else:
                on_cycle = True
                cycle_index = 0

        if (on_cycle):
            usage = randint(cycle_mins[cycle_index], 120) / 10
            cycle_index += 1
        else:
            usage = randint(0, 3) / 10

        x.append(i)
        power.append(usage)

    def update_goal(id):
        query = {"oem_id" : id}
        dev = devices.find_one(query)

        print(id)
        hourly_usage = {"$set": {"hourly_usage" : power}}
        print(power)
        devices.update_one(query, hourly_usage)


    def power_goal():
        for dev in devices.find():
            update_goal(dev['oem_id'])
            break

    power_goal()
    ax = plt.axes()

    ax.plot(x, power)

    #plt.show()

    query = {"oem_id" : "800653B8FFB827D941DCE54E15127C0F1CF84698"}
    updateGoal = {"$set": {"hourly_usage" : power}} 
    devices.update_one(query, updateGoal)

def gen_random():
    for i in range(0, 336):
        if (i < len(x)):
            continue
        
        usage = randint(0, 1)

        if (usage == 0):
            newRange = randint(1, 15)
            for k in range(i, i + newRange):
                if (k == 336):
                    break

                power.append(0)
                x.append(k)

            i = i + newRange

        elif (usage != 0):
            usage = randint(10, 40) / 10

            x.append(i)
            power.append(usage)


    def update_goal(id):
        query = {"oem_id" : id}
        dev = devices.find_one(query)
        hourly_usage = {"$set": {"hourly_usage" : power}}
        devices.update_one(query, hourly_usage)

    def power_goal():
        for dev in devices.find():
            update_goal(dev['oem_id'])
            break

    power_goal()
    ax = plt.axes()

    ax.plot(x, power)

    #plt.show()

    # query = {"oem_id" : ""}
    # updateGoal = {"$set": {"hourly_usage" : power}} 
    # devices.update_one(query, updateGoal)

def powerspike_demo():
    for i in range(0, 336):
        usage = randint(0, 5) / 10

        x.append(i)
        power.append(usage)

    def update_goal(id):
        query = {"oem_id" : id}
        dev = devices.find_one(query)

        print(id)
        hourly_usage = {"$set": {"hourly_usage" : power}}
        print(power)
        devices.update_one(query, hourly_usage)


    def power_goal():
        for dev in devices.find():
            update_goal(dev['oem_id'])
            break

    power_goal()
    ax = plt.axes()

    ax.plot(x, power)

    #plt.show()

light()