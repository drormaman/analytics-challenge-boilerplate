///<reference path="types.ts" />

import express from "express";
import { Request, Response } from "express";

import moment from 'moment';
moment().format();

// some useful database functions in here:
import {} from "./database";
import { Event, weeklyRetentionObject } from "../../client/src/models/event";
import { ensureAuthenticated, validateMiddleware } from "./helpers";

import {
  shortIdValidation,
  searchValidation,
  userFieldsValidator,
  isUserValidator,
} from "./validators";
const router = express.Router();

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('data/database.json')
const db = low(adapter)

// Routes

interface Filter {
  sorting: string;
  type: string;
  browser: string;
  search: string;
  offset: number;
}

router.get('/all', (req: Request, res: Response) => {
  const allEvents: Event[] = db.get("events").value();
  res.json(allEvents)
    
});

router.get('/all-filtered', (req: Request, res: Response) => {
  const params: Filter = {
    sorting: req.query.sorting,
    type: req.query.type,
    browser: req.query.browser,
    search: req.query.search,
    offset: req.query.offset
  }
  console.log(params)
  const filteredEvents: Event[] = db.get("events")
                                    .orderBy("date",params.sorting[0] === "+" ? "desc" : "asc")
                                    .filter(params.type && { "name": params.type})
                                    .filter(params.browser && { "browser": params.browser})
                                    .slice(0,params.offset)
                                    .value();
  res.json({"events":filteredEvents, "more": params.offset ? true : false})
});

router.get('/by-days/:offset', (req: Request, res: Response) => {
  const offset:number = Number(req.params.offset);
  const now:Date =  new Date()
  const latestDay:Date = new Date(now.getTime() - (offset * 24 * 60*60*1000))
  const weekBefore:Date = new Date(latestDay.getTime() - (7*24*60*60*1000))

  interface sessionCountPerDay {
    date: string;
    count: number;
  }
  const countByDays: Array<sessionCountPerDay> = db.get("events")
                                    .filter((event:Event) :boolean => {
                                      const eventDate:Date = new Date(event.date) 
                                      return eventDate >= weekBefore && eventDate <= latestDay})
                                    .map((event :Event) : Event => {
                                      const dateArray:string[] = new Date(event.date).toLocaleDateString().split("/");
                                      const formattedDate:string = `${dateArray[1]}/${dateArray[0]}/${dateArray[2]}`
                                      return { ...event,date:formattedDate}})
                                    .orderBy('date')
                                    .groupBy("date")
                                    .map((events: Event[], date: string) => ({ date, count: events.length}))
                                    .value()
  console.log(countByDays)

  res.send(countByDays)
});

router.get('/by-hours/:offset', (req: Request, res: Response) => {
  res.send('/by-hours/:offset')
});

router.get('/today', (req: Request, res: Response) => {
  res.send('/today')
});

router.get('/week', (req: Request, res: Response) => {
  res.send('/week')
});

router.get('/retention', (req: Request, res: Response) => {
  const {dayZero} = req.query
  res.send('/retention')
});
router.get('/:eventId',(req : Request, res : Response) => {
  res.send('/:eventId')
});

router.post('/', (req: Request, res: Response) => {
  res.send('/')
});

router.get('/chart/os/:time',(req: Request, res: Response) => {
  res.send('/chart/os/:time')
})

  
router.get('/chart/pageview/:time',(req: Request, res: Response) => {
  res.send('/chart/pageview/:time')
})

router.get('/chart/timeonurl/:time',(req: Request, res: Response) => {
  res.send('/chart/timeonurl/:time')
})

router.get('/chart/geolocation/:time',(req: Request, res: Response) => {
  res.send('/chart/geolocation/:time')
})


export default router;
